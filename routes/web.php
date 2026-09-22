<?php

use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FrontDesk\DashboardController as FrontDeskDashboardController;
use App\Http\Controllers\Owner\AccountController as OwnerAccountController;
use App\Http\Controllers\Owner\DashboardController as OwnerDashboardController;
use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Illuminate\Support\Facades\Artisan;

Route::get('/run-my-migrations', function () {
    try {
        Artisan::call('migrate', ['--force' => true]);
        return "Success! Migrations executed successfully.";
    } catch (\Exception $e) {
        return "Error: " . $e->getMessage();
    }
});


Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', DashboardController::class)
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

/*
|--------------------------------------------------------------------------
| Role-protected areas
|--------------------------------------------------------------------------
|
| Everything below is gated by the "role" middleware (EnsureUserHasRole).
| Each area has its own dashboard controller and page. Access rules:
|
|   admin            - clinic-wide management (staff, services, reports).
|   front_desk,admin - day-to-day desk work (owners, pets, bookings, payments).
|   owner            - the client portal; owners only see their own records.
|
| A user hitting an area their role does not cover gets a 403.
|
*/
Route::middleware(['auth', 'verified', 'role:admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('/', AdminDashboardController::class)->name('dashboard');
    });

Route::middleware(['auth', 'verified', 'role:front_desk,admin'])
    ->prefix('front-desk')
    ->name('front_desk.')
    ->group(function () {
        Route::get('/', FrontDeskDashboardController::class)->name('dashboard');
    });

Route::middleware(['auth', 'verified', 'role:owner'])
    ->prefix('portal')
    ->name('owner.')
    ->group(function () {
        Route::get('/', OwnerDashboardController::class)->name('dashboard');

        Route::get('account', [OwnerAccountController::class, 'edit'])->name('account.edit');
        Route::patch('account', [OwnerAccountController::class, 'update'])->name('account.update');
    });

require __DIR__.'/auth.php';
