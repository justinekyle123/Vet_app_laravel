<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\DogOwner;
use App\Models\Service;
use App\Services\Portal\BookingAvailability;
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
    public function index(Request $request): Response
    {
        /** @var DogOwner $owner */
        $owner = $request->user();

        $services = Service::query()
            ->where('is_active', true)
            ->with('category:category_id,category_name')
            ->orderBy('service_name')
            ->get();

        return Inertia::render('Owner/Services', [
            'categories' => $services
                ->groupBy(fn (Service $service) => $service->category?->category_name ?? 'Other services')
                ->map(fn ($group, $name): array => [
                    'name' => $name,
                    'services' => $group
                        ->map(fn (Service $service): array => [
                            'id' => $service->service_id,
                            'service_name' => $service->service_name,
                            'description' => $service->description,
                            'duration_minutes' => $service->duration_minutes,
                            'price' => $service->price,
                        ])
                        ->values()
                        ->all(),
                ])
                ->values()
                ->all(),
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
     * The days and times one service can be booked, for the calendar modal.
     */
    public function availability(Service $service, BookingAvailability $availability): JsonResponse
    {
        abort_unless($service->is_active, 404);

        return response()->json($availability->calendar($service));
    }
}
