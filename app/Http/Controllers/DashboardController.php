<?php

namespace App\Http\Controllers;

use App\Enums\StaffRole;
use App\Models\Staff;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * Sends a signed-in account to the dashboard that matches its role.
 *
 * Sign-in, registration, and the password flows all land on "dashboard", so
 * this acts as the single funnel into the role-specific areas.
 */
class DashboardController extends Controller
{
    public function __invoke(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user instanceof Staff) {
            return redirect()->route('admin.dashboard');
        }

        return redirect()->route('owner.dashboard');
    }
}
