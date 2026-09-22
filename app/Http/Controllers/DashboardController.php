<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * Sends a signed-in user to the dashboard that matches their role.
 *
 * Login, registration, and email verification all land on "dashboard", so this
 * acts as the single funnel into the role-specific areas.
 */
class DashboardController extends Controller
{
    public function __invoke(Request $request): RedirectResponse
    {
        return match ($request->user()->role) {
            UserRole::Admin => redirect()->route('admin.dashboard'),
            UserRole::FrontDesk => redirect()->route('front_desk.dashboard'),
            default => redirect()->route('owner.dashboard'),
        };
    }
}
