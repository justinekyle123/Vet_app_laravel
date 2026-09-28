<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\ConfirmablePasswordController;
use App\Http\Controllers\Auth\FirebaseSessionController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredUserController;
use Illuminate\Support\Facades\Route;

/*
 |--------------------------------------------------------------------------
 | Firebase session bridge
 |--------------------------------------------------------------------------
 |
 | Firebase signs the user in on the client (Google popup) and hands the page
 | an ID token. This endpoint verifies that token, matches the identity to a
 | `dog_owners` or `staff` row, and starts a normal Laravel session. It sits
 | outside the "guest" group so it also works when refreshing an existing
 | session. The password routes below stay as the primary sign-in path.
 */
Route::post('firebase/session', [FirebaseSessionController::class, 'store'])
    ->middleware('throttle:10,1')
    ->name('firebase.session');

Route::middleware('guest:owner,staff')->group(function () {
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

/*
 | Email verification is deliberately absent: `dog_owners` and `staff` have no
 | `email_verified_at` column, so there is nothing for the "verified"
 | middleware to check against.
 */
Route::middleware('auth:owner,staff')->group(function () {
    Route::get('confirm-password', [ConfirmablePasswordController::class, 'show'])
        ->name('password.confirm');

    Route::post('confirm-password', [ConfirmablePasswordController::class, 'store']);

    Route::put('password', [PasswordController::class, 'update'])->name('password.update');

    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');
});
