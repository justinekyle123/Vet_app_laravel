<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\DogOwner;
use App\Models\Service;
use App\Services\Portal\BookingAvailability;
use App\Services\Portal\CareTeam;
use App\Services\Portal\ServiceReviews;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The clinic's service menu, as the client sees it.
 *
 * Retired services are left out: the portal is for what the clinic currently
 * offers, and past visits keep their own record of what was billed. The page
 * also carries the owner's dogs and the live booking calendar, so a service can
 * be booked without leaving the menu.
 */
class ServiceController extends Controller
{
    public function index(
        Request $request,
        CareTeam $careTeam,
        ServiceReviews $reviews,
    ): Response {
        /** @var DogOwner $owner */
        $owner = $request->user();

        $services = Service::query()
            ->where('is_active', true)
            ->with('category:category_id,category_name')
            ->orderBy('service_name')
            ->get();

        // Every service's published rating, count, and latest comments, read
        // in one pass so each card can show how it has been received.
        $ratings = $reviews->forServices();

        return Inertia::render('Owner/Services', [
            'categories' => $services
                ->groupBy(fn (Service $service) => $service->category?->category_name ?? 'Other services')
                ->map(fn ($group, $name): array => [
                    'name' => $name,
                    'services' => $group
                        ->map(fn (Service $service): array => [
                            ...$this->present($service, $ratings),
                            // The newest few comments, so a card can be read
                            // without leaving the menu. The rest live on the
                            // service's own page.
                            'reviews' => $ratings[$service->service_id]['reviews'] ?? [],
                        ])
                        ->values()
                        ->all(),
                ])
                ->values()
                ->all(),
            // The care team, so an owner can see who could take their booking
            // and read each member's details before they choose.
            'team' => $careTeam->presentAll()->all(),
            // Only dogs the booking form can actually pick: an inactive dog
            // has been retired from the account and should not be scheduled.
            'dogs' => $owner->dogs()
                ->where('is_active', true)
                ->with('breed:breed_id,breed_name')
                ->orderBy('dog_name')
                ->get()
                ->map(fn ($dog): array => [
                    'id' => $dog->dog_id,
                    'dog_name' => $dog->dog_name,
                    'breed' => $dog->breed?->breed_name,
                    'sex' => $dog->sex,
                    'birth_date' => $dog->birth_date?->toDateString(),
                    'is_vaccinated' => $dog->is_vaccinated,
                    'is_active' => $dog->is_active,
                ])
                ->all(),
            'bookingWindowDays' => BookingAvailability::HORIZON_DAYS,
        ]);
    }

    /**
     * One service in full: what it is, what it costs, how it has been rated,
     * and every published review behind that rating.
     *
     * A month of reviews is what a client reads before they trust a price, so
     * the page pages them in rather than cutting them off at the first few.
     */
    public function show(
        Request $request,
        Service $service,
        CareTeam $careTeam,
        ServiceReviews $reviews,
    ): Response {
        /** @var DogOwner $owner */
        $owner = $request->user();

        // A retired service is not something to book, so it is not something to
        // read about either.
        abort_unless($service->is_active, 404);

        $service->load('category:category_id,category_name');

        $ratings = $reviews->forServices();
        $summary = $reviews->summaryFor($service);

        $perPage = (int) $request->query('reviews_per_page', ServiceReviews::PAGE_SIZE);

        return Inertia::render('Owner/ServiceShow', [
            'service' => [
                ...$this->present($service, $ratings),
                'category' => $service->category?->category_name,
                ...$summary,
                // What this client's own history with the service looks like,
                // so the page can say "you had this in March" rather than
                // asking them to remember.
                'last_visit' => $this->lastVisitFor($owner, $service),
            ],
            'reviews' => $reviews->paginatorFor($service, $perPage),
            // The rest of the category, so a client who is not sure can compare
            // two services without going back to the menu.
            'related' => $this->relatedTo($service, $ratings),
            'team' => $careTeam->presentAll()->all(),
            'dogs' => $owner->dogs()
                ->where('is_active', true)
                ->with('breed:breed_id,breed_name')
                ->orderBy('dog_name')
                ->get()
                ->map(fn ($dog): array => [
                    'id' => $dog->dog_id,
                    'dog_name' => $dog->dog_name,
                    'breed' => $dog->breed?->breed_name,
                    'sex' => $dog->sex,
                    'birth_date' => $dog->birth_date?->toDateString(),
                    'is_vaccinated' => $dog->is_vaccinated,
                    'is_active' => $dog->is_active,
                ])
                ->all(),
            'bookingWindowDays' => BookingAvailability::HORIZON_DAYS,
        ]);
    }

    /**
     * The days and times one service can be booked, for the calendar modal.
     */
    public function availability(Service $service, BookingAvailability $availability): JsonResponse
    {
        abort_unless($service->is_active, 404);

        return response()->json($availability->calendar($service));
    }

    /**
     * The service fields every surface shares, with its rating folded in.
     *
     * @param  array<int, array{rating: float|null, count: int, reviews: list<array<string, mixed>>}>  $ratings
     * @return array<string, mixed>
     */
    private function present(Service $service, array $ratings): array
    {
        return [
            'id' => $service->service_id,
            'service_name' => $service->service_name,
            'description' => $service->description,
            'duration_minutes' => $service->duration_minutes,
            'price' => $service->price,
            'image' => $service->imageUrl(),
            // The role the clinic books for this service, so the page can show
            // who might see the dog.
            'provider_role' => $service->providerRole()->value,
            // Null until someone rates the service; the page then shows "no
            // reviews yet" rather than zero stars.
            'rating' => $ratings[$service->service_id]['rating'] ?? null,
            'rating_count' => $ratings[$service->service_id]['count'] ?? 0,
        ];
    }

    /**
     * The other services the desk files under the same category.
     *
     * @param  array<int, array{rating: float|null, count: int, reviews: list<array<string, mixed>>}>  $ratings
     * @return list<array<string, mixed>>
     */
    private function relatedTo(Service $service, array $ratings): array
    {
        if ($service->category_id === null) {
            return [];
        }

        /** @var Collection<int, Service> $related */
        $related = Service::query()
            ->where('is_active', true)
            ->where('category_id', $service->category_id)
            ->whereKeyNot($service->service_id)
            ->orderBy('service_name')
            ->limit(3)
            ->get();

        return $related
            ->map(fn (Service $other): array => $this->present($other, $ratings))
            ->values()
            ->all();
    }

    /**
     * When this client last had this service, if they ever have.
     *
     * Only visits the clinic carried out count: a request the client cancelled
     * is not a visit they had, and saying so would be a small lie on a page
     * they are using to decide whether to book.
     */
    private function lastVisitFor(DogOwner $owner, Service $service): ?string
    {
        $visit = $owner->appointments()
            ->where('service_id', $service->service_id)
            ->whereHas(
                'status',
                fn (Builder $query) => $query->where('status_name', 'Completed'),
            )
            ->orderByDesc('appointment_date')
            ->first(['appointment_id', 'appointment_date']);

        return $visit?->appointment_date?->toDateString();
    }
}
