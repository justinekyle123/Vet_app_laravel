<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\ClinicInfo;
use App\Models\RatingFeedback;
use App\Models\Service;
use App\Services\Portal\CareTeam;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The public marketing page.
 *
 * It reads the same menu and clinic row the console writes, so a visitor sees
 * the services the desk actually books and the contact details the clinic
 * maintains — not a second copy that drifts out of date.
 */
class LandingController extends Controller
{
    public function __invoke(CareTeam $careTeam): Response
    {
        $clinic = ClinicInfo::current();

        /*
         * Grouped by category in the order the clinic set them up, and within
         * a category in the order the services were added. The page features
         * the first few of these, so the menu keeps the clinic's own priority
         * instead of reading alphabetically across unrelated disciplines.
         */
        $services = Service::query()
            ->where('is_active', true)
            ->with('category:category_id,category_name')
            ->orderBy('category_id')
            ->orderBy('service_id')
            ->get();

        /*
         * The care team: veterinarians first, then groomers. Administrators are left off the
         * marketing page, and the page falls back to an initials monogram for
         * anyone without a portrait. The same list backs the owner portal's
         * "who can take this service" view.
         */
        $team = $careTeam->presentAll();

        /*
         * The headline numbers are counted rather than claimed: the pets the
         * clinic has actually seen (a dog with at least one completed visit)
         * and the average of the ratings owners have published.
         */
        $petsCaredFor = Appointment::query()
            ->whereHas('status', fn ($status) => $status->where('status_name', 'Completed'))
            ->distinct()
            ->count('dog_id');

        $ratingCount = RatingFeedback::query()->where('is_published', true)->count();

        $averageRating = $ratingCount > 0
            ? round((float) RatingFeedback::query()->where('is_published', true)->avg('rating'), 1)
            : null;

        return Inertia::render('Welcome', [
            'canLogin' => Route::has('login'),
            'canRegister' => Route::has('register'),
            'services' => $services
                ->map(fn (Service $service): array => [
                    'id' => $service->service_id,
                    'service_name' => $service->service_name,
                    'description' => $service->description,
                    'image' => $service->imageUrl(),
                    'category' => $service->category?->category_name ?? 'Other services',
                    'duration_minutes' => $service->duration_minutes,
                    'price' => $service->price,
                    // Which part of the care team takes this service.
                    'provider_role' => $service->providerRole()->value,
                ])
                ->values()
                ->all(),
            'team' => $team->all(),
            'stats' => [
                'pets_cared_for' => $petsCaredFor,
                'rating' => $averageRating,
                'rating_count' => $ratingCount,
            ],
            'clinic' => [
                'clinic_name' => $clinic->clinic_name,
                'address_line' => $clinic->address_line,
                'city' => $clinic->city,
                'province' => $clinic->province,
                'zip_code' => $clinic->zip_code,
                'contact_number' => $clinic->contact_number,
                'email' => $clinic->email,
                // Trimmed to "HH:MM" so the page formats one shape of time.
                'opening_time' => substr((string) $clinic->opening_time, 0, 5),
                'closing_time' => substr((string) $clinic->closing_time, 0, 5),
                'days_open' => $clinic->days_open,
            ],
        ]);
    }
}
