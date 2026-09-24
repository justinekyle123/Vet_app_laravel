<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\ClerkSessionController;
use App\Http\Controllers\Auth\ConfirmablePasswordController;
use App\Http\Controllers\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\Auth\EmailVerificationPromptController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\VerifyEmailController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
 |--------------------------------------------------------------------------
 | Clerk session bridge
 |--------------------------------------------------------------------------
 |
 | Clerk signs the user in on the client and hands us a session token. This
 | endpoint verifies that token, mirrors the identity onto a local user, and
 | starts a normal Laravel session. It sits outside the "guest" group so it
 | also works when refreshing an existing session. Breeze routes below are
 | left intact as a fallback sign-in path.
 */
Route::post('clerk/session', [ClerkSessionController::class, 'store'])
    ->middleware('throttle:10,1')
    ->name('clerk.session');

Route::middleware('guest')->group(function () {
    /*
     * With CLERK_ENABLED=false these routes stand down to the password screens
     * rather than rendering Clerk's form. They stay registered and keep
     * redirecting because the marketing page links to them by name.
     */
    Route::get('clerk/sign-in', fn () => config('clerk.enabled')
        ? Inertia::render('Auth/ClerkAuth', [
            'mode' => 'sign-in',
            'clerkConfigured' => filled(config('clerk.publishable_key')),
        ])
        : redirect()->route('login')
    )->name('clerk.signin');

    Route::get('clerk/sign-up', fn () => config('clerk.enabled')
        ? Inertia::render('Auth/ClerkAuth', [
            'mode' => 'sign-up',
            'clerkConfigured' => filled(config('clerk.publishable_key')),
        ])
        : redirect()->route('register')
    )->name('clerk.signup');

    Route::get('register', [RegisteredUserController::class, 'create'])
        ->name('register');

    Route::post('register', [RegisteredUserController::class, 'store']);

    Route::get('login', [AuthenticatedSessionController::class, 'create'])
        ->name('login');

    Route::post('login', [AuthenticatedSessionController::class, 'store']);

    Route::get('forgot-password', [PasswordResetLinkController::class, 'create'])
        ->name('password.request');

    Route::post('forgot-password', [PasswordResetLinkController::class, 'store'])
        ->name('password.email');

    Route::get('reset-password/{token}', [NewPasswordController::class, 'create'])
        ->name('password.reset');

    Route::post('reset-password', [NewPasswordController::class, 'store'])
        ->name('password.store');
});

Route::middleware('auth')->group(function () {
    Route::get('verify-email', EmailVerificationPromptController::class)
        ->name('verification.notice');

    Route::get('verify-email/{id}/{hash}', VerifyEmailController::class)
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');

    Route::post('email/verification-notification', [EmailVerificationNotificationController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('verification.send');

    Route::get('confirm-password', [ConfirmablePasswordController::class, 'show'])
        ->name('password.confirm');

    Route::post('confirm-password', [ConfirmablePasswordController::class, 'store']);

    Route::put('password', [PasswordController::class, 'update'])->name('password.update');

    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');
});
