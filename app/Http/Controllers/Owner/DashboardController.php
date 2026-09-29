<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\DogOwner;
use App\Services\Portal\OwnerAppointments;
use App\Services\Portal\PortalNotifications;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The owner portal's home page: the client's dogs, their next visits, and the
 * messages the clinic has sent them.
 */
class DashboardController extends Controller
{
    /** How many upcoming visits the home page previews. */
    private const UPCOMING_LIMIT = 3;

    public function __invoke(
        Request $request,
        OwnerAppointments $appointments,
        PortalNotifications $notifications,
    ): Response {
        /** @var DogOwner $owner */
        $owner = $request->user();

        $dogs = $owner->dogs()
            ->with('breed:breed_id,breed_name')
            ->orderBy('dog_name')
            ->get();

        $upcoming = $appointments->upcoming($owner, self::UPCOMING_LIMIT);

        return Inertia::render('Owner/Dashboard', [
            'dogs' => $dogs
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
            'upcoming' => $upcoming,
            'stats' => [
                'dogs' => $dogs->count(),
                'upcoming' => count($upcoming),
                'unread' => $notifications->unreadCount($owner),
            ],
        ]);
    }
}
