<?php

use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\ReportController as AdminReportController;
use App\Http\Controllers\Admin\ServiceController as AdminServiceController;
use App\Http\Controllers\Admin\SettingController as AdminSettingController;
use App\Http\Controllers\Admin\StaffController as AdminStaffController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Admin\OperationsAppointmentController;
use App\Http\Controllers\Admin\OperationsDashboardController;
use App\Http\Controllers\LandingController;
use App\Http\Controllers\Owner\AccountController as OwnerAccountController;
use App\Http\Controllers\Owner\AppointmentController as OwnerAppointmentController;
use App\Http\Controllers\Owner\DashboardController as OwnerDashboardController;
use App\Http\Controllers\Owner\DogController as OwnerDogController;
use App\Http\Controllers\Owner\FaqController as OwnerFaqController;
use App\Http\Controllers\Owner\NotificationController as OwnerNotificationController;
use App\Http\Controllers\Owner\SearchController as OwnerSearchController;
use App\Http\Controllers\Owner\ServiceController as OwnerServiceController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Staff\OwnerController as StaffOwnerController;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Route;

Route::get('/run-my-migrations', function () {
    try {
        Artisan::call('migrate', ['--force' => true]);

        return 'Success! Migrations executed successfully.';
    } catch (Exception $e) {
        return 'Error: '.$e->getMessage();
    }
});

Route::get('/', LandingController::class);

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
|   admin                  - clinic-wide management and daily operations.
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

Route::middleware(['auth:owner,staff', 'role:admin'])
    ->prefix('admin/operations')
    ->name('admin.operations.')
    ->group(function () {
        Route::get('/', OperationsDashboardController::class)->name('dashboard');

        // Administrators own the two appointment state transitions.
        Route::patch('appointments/{appointment}/confirm', [OperationsAppointmentController::class, 'confirm'])
            ->name('appointments.confirm');
        Route::patch('appointments/{appointment}/cancel', [OperationsAppointmentController::class, 'cancel'])
            ->name('appointments.cancel');
    });

Route::middleware(['auth:owner,staff', 'role:admin'])
    ->prefix('owners')
    ->name('owners.')
    ->group(function () {
        Route::get('/', [StaffOwnerController::class, 'index'])->name('index');
        Route::get('{owner}', [StaffOwnerController::class, 'show'])->name('show');
        Route::get('create', [StaffOwnerController::class, 'create'])->name('create');
        Route::post('/', [StaffOwnerController::class, 'store'])->name('store');
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

        Route::get('services', [OwnerServiceController::class, 'index'])->name('services.index');

        // Feeds the booking modal's calendar for one service; returns JSON.
        Route::get('services/{service}/availability', [OwnerServiceController::class, 'availability'])
            ->name('services.availability');

        Route::get('appointments', [OwnerAppointmentController::class, 'index'])->name('appointments.index');
        Route::post('appointments', [OwnerAppointmentController::class, 'store'])->name('appointments.store');

        // Cancels one of the owner's own upcoming visits.
        Route::patch('appointments/{appointment}/cancel', [OwnerAppointmentController::class, 'cancel'])
            ->name('appointments.cancel');

        // Powers the navbar's search box; returns JSON, not an Inertia page.
        Route::get('search', OwnerSearchController::class)->name('search');

        // Powers the floating FAQ button; returns JSON, not an Inertia page.
        Route::get('faqs', OwnerFaqController::class)->name('faqs');

        Route::patch('notifications/read', [OwnerNotificationController::class, 'markAllRead'])
            ->name('notifications.read');

        Route::get('account', [OwnerAccountController::class, 'edit'])->name('account.edit');
        Route::patch('account', [OwnerAccountController::class, 'update'])->name('account.update');

        Route::post('dogs', [OwnerDogController::class, 'store'])->name('dogs.store');
        Route::patch('dogs/{dog}', [OwnerDogController::class, 'update'])->name('dogs.update');
    });

require __DIR__.'/auth.php';
