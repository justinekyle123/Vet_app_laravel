<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The signed-in account's own profile.
 *
 * Works for either account model: both keep first name, last name, and email,
 * which is all this screen edits.
 */
class ProfileController extends Controller
{
    /**
     * Display the account's profile form.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('Profile/Edit', [
            'status' => session('status'),
        ]);
    }

    /**
     * Update the account's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated())->save();

        return Redirect::route('profile.edit');
    }

    /**
     * Delete the account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            // With two account tables the guard has to be named, or the check
            // would look the password up in the wrong provider.
            'password' => ['required', 'current_password:'.$request->user()->guardName()],
        ]);

        $user = $request->user();

        Auth::guard('owner')->logout();
        Auth::guard('staff')->logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
