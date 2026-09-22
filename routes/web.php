<?php

use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\StaffController as AdminStaffController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FrontDesk\DashboardController as FrontDeskDashboardController;
use App\Http\Controllers\Owner\AccountController as OwnerAccountController;
use App\Http\Controllers\Owner\DashboardController as OwnerDashboardController;
use App\Http\Controllers\Owner\PetController as OwnerPetController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Staff\OwnerController as StaffOwnerController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/run-my-migrations', function () {
    try {
        Artisan::call('migrate', ['--force' => true]);

        return 'Success! Migrations executed successfully.';
    } catch (Exception $e) {
        return 'Error: '.$e->getMessage();
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

        Route::get('staff', [AdminStaffController::class, 'index'])->name('staff.index');
        Route::patch('staff/{user}/password', [AdminStaffController::class, 'updatePassword'])->name('staff.password');
    });

Route::middleware(['auth', 'verified', 'role:front_desk,admin'])
    ->prefix('front-desk')
    ->name('front_desk.')
    ->group(function () {
        Route::get('/', FrontDeskDashboardController::class)->name('dashboard');
    });

/*
| Dog owner records are shared between the front desk and admin, so they get
| their own role-gated area rather than nesting under one of the dashboards.
*/
Route::middleware(['auth', 'verified', 'role:front_desk,admin'])
    ->prefix('owners')
    ->name('owners.')
    ->group(function () {
        Route::get('/', [StaffOwnerController::class, 'index'])->name('index');
        Route::get('create', [StaffOwnerController::class, 'create'])->name('create');
        Route::post('/', [StaffOwnerController::class, 'store'])->name('store');
        Route::get('{owner}', [StaffOwnerController::class, 'show'])->name('show');
        Route::get('{owner}/edit', [StaffOwnerController::class, 'edit'])->name('edit');
        Route::patch('{owner}', [StaffOwnerController::class, 'update'])->name('update');
        Route::patch('{owner}/deactivate', [StaffOwnerController::class, 'deactivate'])->name('deactivate');
        Route::patch('{owner}/activate', [StaffOwnerController::class, 'activate'])->name('activate');
    });

Route::middleware(['auth', 'verified', 'role:owner'])
    ->prefix('portal')
    ->name('owner.')
    ->group(function () {
        Route::get('/', OwnerDashboardController::class)->name('dashboard');

        Route::get('account', [OwnerAccountController::class, 'edit'])->name('account.edit');
        Route::patch('account', [OwnerAccountController::class, 'update'])->name('account.update');

        Route::post('pets', [OwnerPetController::class, 'store'])->name('pets.store');
        Route::patch('pets/{pet}', [OwnerPetController::class, 'update'])->name('pets.update');
    });

require __DIR__.'/auth.php';
