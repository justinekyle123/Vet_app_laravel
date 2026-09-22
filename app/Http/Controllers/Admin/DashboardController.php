<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Clinic-wide overview for administrators.
 *
 * Account figures come straight from the users table. The clinical widgets
 * (appointments, revenue, service usage) light up as those models land.
 */
class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'total_users' => User::count(),
                'admins' => User::where('role', UserRole::Admin->value)->count(),
                'front_desk' => User::where('role', UserRole::FrontDesk->value)->count(),
                'owners' => User::where('role', UserRole::Owner->value)->count(),
                'unverified' => User::whereNull('email_verified_at')->count(),
            ],
            'recentUsers' => $this->recentUsers(),
        ]);
    }

    /**
     * @return Collection<int, User>
     */
    private function recentUsers(): Collection
    {
        return User::query()
            ->latest('id')
            ->limit(5)
            ->get(['id', 'name', 'email', 'role', 'created_at']);
    }
}
