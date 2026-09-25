<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\Firebase\FirebaseAuthenticator;
use App\Services\Firebase\FirebaseUserSynchronizer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Throwable;
use UnexpectedValueException;

/**
 * Bridges a Firebase sign-in into a normal Laravel session.
 *
 * Firebase authenticates the user in the browser and hands the page an ID
 * token; this endpoint proves that token to Laravel, mirrors the identity onto
 * a local user row, and then logs in the usual way. Everything downstream
 * (Inertia shared props, the "auth" middleware, Auth::user()) keeps working
 * untouched.
 */
class FirebaseSessionController extends Controller
{
    public function store(
        Request $request,
        FirebaseAuthenticator $authenticator,
        FirebaseUserSynchronizer $synchronizer,
    ): JsonResponse {
        // The whole integration can be stood down with FIREBASE_ENABLED=false.
        abort_unless(config('firebase.enabled'), 404);

        $validated = $request->validate([
            'id_token' => ['required', 'string'],
        ]);

        try {
            $claims = $authenticator->verify($validated['id_token']);
        } catch (UnexpectedValueException $e) {
            // Covers a bad signature, an expired token, and a token minted for
            // another project — all of which mean "sign in again", not "we
            // broke". Nothing here is worth logging as an application error.
            throw ValidationException::withMessages([
                'id_token' => 'That Google sign-in could not be verified. Please try again.',
            ]);
        } catch (Throwable $e) {
            report($e);

            throw ValidationException::withMessages([
                'id_token' => 'Google sign-in failed unexpectedly.',
            ]);
        }

        $user = $synchronizer->sync($claims);

        Auth::login($user, remember: true);

        // Guards against session fixation now that the user is authenticated.
        $request->session()->regenerate();

        return response()->json([
            'redirect' => config('firebase.redirect_to'),
        ]);
    }
}
