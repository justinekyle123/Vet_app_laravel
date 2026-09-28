<?php

namespace App\Http\Controllers\Admin;

use App\Enums\StaffRole;
use App\Http\Controllers\Controller;
use App\Models\DogOwner;
use App\Models\Staff;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Clinic-wide overview for administrators.
 *
 * Account figures come straight from the two account tables, because the
 * schema keeps staff and dog owners apart. The clinical widgets (appointments,
 * revenue, service usage) light up as those features land.
 */
class DashboardController extends Controller
{
    /** How many of the newest accounts the sign-up feed shows. */
    private const RECENT_LIMIT = 5;

    public function __invoke(): Response
    {
        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'total_users' => Staff::count() + DogOwner::count(),
                'admins' => Staff::where('role', StaffRole::Admin)->count(),
                'front_desk' => Staff::where('role', StaffRole::FrontDesk)->count(),
                'owners' => DogOwner::count(),
            ],
            'recentUsers' => $this->recentAccounts(),
        ]);
    }

    /**
     * The newest accounts across both tables, flattened to one shape.
     *
     * @return Collection<int, array<string, mixed>>
     */
    private function recentAccounts(): Collection
    {
        $staff = Staff::query()
            ->latest('created_at')
            ->limit(self::RECENT_LIMIT)
            ->get()
            ->map(fn (Staff $member): array => [
                'id' => $member->staff_id,
                'name' => $member->fullName(),
                'email' => $member->email,
                'role' => $member->role->value,
                'created_at' => $member->created_at,
            ]);

        $owners = DogOwner::query()
            ->latest('created_at')
            ->limit(self::RECENT_LIMIT)
            ->get()
            ->map(fn (DogOwner $owner): array => [
                'id' => $owner->owner_id,
                'name' => $owner->fullName(),
                'email' => $owner->email,
                'role' => 'owner',
                'created_at' => $owner->created_at,
            ]);

        return $staff
            ->concat($owners)
            ->sortByDesc('created_at')
            ->take(self::RECENT_LIMIT)
            ->values();
    }
}
