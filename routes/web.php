<?php

use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\ReportController as AdminReportController;
use App\Http\Controllers\Admin\ServiceController as AdminServiceController;
use App\Http\Controllers\Admin\SettingController as AdminSettingController;
use App\Http\Controllers\Admin\StaffController as AdminStaffController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FrontDesk\DashboardController as FrontDeskDashboardController;
use App\Http\Controllers\Owner\AccountController as OwnerAccountController;
use App\Http\Controllers\Owner\DashboardController as OwnerDashboardController;
use App\Http\Controllers\Owner\DogController as OwnerDogController;
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

/*
 | Accounts live in two tables, so "auth" names both guards throughout. There
 | is no email verification: the schema has no email_verified_at column.
 */
Route::get('/dashboard', DashboardController::class)
    ->middleware(['auth:owner,staff'])
    ->name('dashboard');

Route::middleware('auth:owner,staff')->group(function () {
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
|   admin                  - clinic-wide management (staff, services, reports).
|   any staff role         - day-to-day desk work (owners, dogs, payments).
|   owner                  - the client portal; owners only see their records.
|
| A user hitting an area their role does not cover gets a 403.
|
*/
Route::middleware(['auth:owner,staff', 'role:admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('/', AdminDashboardController::class)->name('dashboard');

        Route::get('staff', [AdminStaffController::class, 'index'])->name('staff.index');
        Route::patch('staff/{staff}/password', [AdminStaffController::class, 'updatePassword'])->name('staff.password');

        Route::get('services', [AdminServiceController::class, 'index'])->name('services.index');
        Route::post('services', [AdminServiceController::class, 'store'])->name('services.store');
        Route::patch('services/{service}', [AdminServiceController::class, 'update'])->name('services.update');
        Route::patch('services/{service}/toggle', [AdminServiceController::class, 'toggle'])->name('services.toggle');

        Route::get('reports', AdminReportController::class)->name('reports.index');

        Route::get('settings', [AdminSettingController::class, 'edit'])->name('settings.edit');
        Route::patch('settings', [AdminSettingController::class, 'update'])->name('settings.update');
    });

/*
 * Any staff role may work the desk: veterinarians and groomers need the client
 * records as much as the front desk does. Only clinic-wide administration
 * (the group above) is restricted to administrators.
 */
Route::middleware(['auth:owner,staff', 'role:admin,front_desk,veterinarian,groomer'])
    ->prefix('front-desk')
    ->name('front_desk.')
    ->group(function () {
        Route::get('/', FrontDeskDashboardController::class)->name('dashboard');
    });

Route::middleware(['auth:owner,staff', 'role:admin,front_desk,veterinarian,groomer'])
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

Route::middleware(['auth:owner,staff', 'role:owner'])
    ->prefix('portal')
    ->name('owner.')
    ->group(function () {
        Route::get('/', OwnerDashboardController::class)->name('dashboard');

        Route::get('account', [OwnerAccountController::class, 'edit'])->name('account.edit');
        Route::patch('account', [OwnerAccountController::class, 'update'])->name('account.update');

        Route::post('dogs', [OwnerDogController::class, 'store'])->name('dogs.store');
        Route::patch('dogs/{dog}', [OwnerDogController::class, 'update'])->name('dogs.update');
    });

require __DIR__.'/auth.php';
