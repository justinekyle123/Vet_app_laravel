<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\Clerk\ClerkAuthenticator;
use App\Services\Clerk\ClerkUserSynchronizer;
use Clerk\Backend\Helpers\Jwks\TokenVerificationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Throwable;

/**
 * Bridges a Clerk session into a normal Laravel session.
 *
 * Clerk authenticates the user in the browser; this endpoint proves that
 * identity to Laravel, mirrors it onto a local user row, and then logs in the
 * usual way. Everything downstream (Inertia shared props, the "auth"
 * middleware, Auth::user()) keeps working untouched.
 */
class ClerkSessionController extends Controller
{
    public function store(
        Request $request,
        ClerkAuthenticator $authenticator,
        ClerkUserSynchronizer $synchronizer,
    ): JsonResponse {
        $validated = $request->validate([
            'token' => ['required', 'string'],
        ]);

        try {
            $claims = $authenticator->verify($validated['token']);
        } catch (TokenVerificationException $e) {
            throw ValidationException::withMessages([
                'token' => 'That Clerk session could not be verified. Please sign in again.',
            ]);
        } catch (Throwable $e) {
            report($e);

            throw ValidationException::withMessages([
                'token' => 'Clerk sign-in failed unexpectedly.',
            ]);
        }

        $user = $synchronizer->sync($claims);

        Auth::login($user, remember: true);

        // Guards against session fixation now that the user is authenticated.
        $request->session()->regenerate();

        return response()->json([
            'redirect' => config('clerk.redirect_to'),
        ]);
    }
}
