<?php

use App\Http\Controllers\Admin\ComplaintController as AdminComplaintController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\FaqController as AdminFaqController;
use App\Http\Controllers\Admin\NotificationController as AdminNotificationController;
use App\Http\Controllers\Admin\OperationsAppointmentController;
use App\Http\Controllers\Admin\OperationsDashboardController;
use App\Http\Controllers\Admin\ReportController as AdminReportController;
use App\Http\Controllers\Admin\ServiceController as AdminServiceController;
use App\Http\Controllers\Admin\SettingController as AdminSettingController;
use App\Http\Controllers\Admin\StaffController as AdminStaffController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\LandingController;
use App\Http\Controllers\Owner\AccountController as OwnerAccountController;
use App\Http\Controllers\Owner\AppointmentController as OwnerAppointmentController;
use App\Http\Controllers\Owner\ComplaintController as OwnerComplaintController;
use App\Http\Controllers\Owner\DashboardController as OwnerDashboardController;
use App\Http\Controllers\Owner\DogController as OwnerDogController;
use App\Http\Controllers\Owner\FaqChatController as OwnerFaqChatController;
use App\Http\Controllers\Owner\FaqController as OwnerFaqController;
use App\Http\Controllers\Owner\NotificationController as OwnerNotificationController;
use App\Http\Controllers\Owner\PaymentController as OwnerPaymentController;
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
        Route::get('staff/create', [AdminStaffController::class, 'create'])->name('staff.create');
        Route::post('staff', [AdminStaffController::class, 'store'])->name('staff.store');
        Route::get('staff/{staff}/edit', [AdminStaffController::class, 'edit'])->name('staff.edit');
        Route::patch('staff/{staff}', [AdminStaffController::class, 'update'])->name('staff.update');
        Route::delete('staff/{staff}', [AdminStaffController::class, 'destroy'])->name('staff.destroy');
        Route::patch('staff/{staff}/password', [AdminStaffController::class, 'updatePassword'])->name('staff.password');

        Route::get('services', [AdminServiceController::class, 'index'])->name('services.index');
        Route::get('services/create', [AdminServiceController::class, 'create'])->name('services.create');
        Route::post('services', [AdminServiceController::class, 'store'])->name('services.store');
        Route::get('services/{service}/edit', [AdminServiceController::class, 'edit'])->name('services.edit');
        Route::patch('services/{service}', [AdminServiceController::class, 'update'])->name('services.update');
        Route::patch('services/{service}/toggle', [AdminServiceController::class, 'toggle'])->name('services.toggle');

        // Powers the console topbar's notification bell; clears the unread badge.
        Route::patch('notifications/read', AdminNotificationController::class)
            ->name('notifications.read');

        /*
         * The help questions behind the portal's floating FAQ button.
         * Publishing is what puts an answer in front of clients; deleting a
         * question is safe because nothing references a faq row.
         */
        Route::get('faqs', [AdminFaqController::class, 'index'])->name('faqs.index');
        Route::get('faqs/create', [AdminFaqController::class, 'create'])->name('faqs.create');
        Route::post('faqs', [AdminFaqController::class, 'store'])->name('faqs.store');
        Route::get('faqs/{faq}/edit', [AdminFaqController::class, 'edit'])->name('faqs.edit');
        Route::patch('faqs/{faq}', [AdminFaqController::class, 'update'])->name('faqs.update');
        Route::patch('faqs/{faq}/toggle', [AdminFaqController::class, 'toggle'])->name('faqs.toggle');
        Route::delete('faqs/{faq}', [AdminFaqController::class, 'destroy'])->name('faqs.destroy');

        /*
         * The complaints inbox: what clients have raised through the portal,
         * the conversation with them, and where each one stands.
         */
        Route::get('complaints', [AdminComplaintController::class, 'index'])->name('complaints.index');
        Route::get('complaints/{complaint}', [AdminComplaintController::class, 'show'])->name('complaints.show');
        Route::post('complaints/{complaint}/messages', [AdminComplaintController::class, 'reply'])->name('complaints.reply');
        Route::patch('complaints/{complaint}', [AdminComplaintController::class, 'update'])->name('complaints.update');

        Route::get('reports', AdminReportController::class)->name('reports.index');

        Route::get('settings', [AdminSettingController::class, 'edit'])->name('settings.edit');
        Route::patch('settings', [AdminSettingController::class, 'update'])->name('settings.update');
    });

Route::middleware(['auth:owner,staff', 'role:admin'])
    ->prefix('admin/operations')
    ->name('admin.operations.')
    ->group(function () {
        Route::get('/', OperationsDashboardController::class)->name('dashboard');

        // Administrators own the appointment state transitions.
        Route::patch('appointments/{appointment}/confirm', [OperationsAppointmentController::class, 'confirm'])
            ->name('appointments.confirm');
        Route::patch('appointments/{appointment}/cancel', [OperationsAppointmentController::class, 'cancel'])
            ->name('appointments.cancel');
        Route::patch('appointments/{appointment}/complete', [OperationsAppointmentController::class, 'complete'])
            ->name('appointments.complete');
        Route::patch('appointments/{appointment}/no-show', [OperationsAppointmentController::class, 'noShow'])
            ->name('appointments.no-show');
    });

Route::middleware(['auth:owner,staff', 'role:admin'])
    ->prefix('owners')
    ->name('owners.')
    ->group(function () {
        Route::get('/', [StaffOwnerController::class, 'index'])->name('index');
        Route::get('{owner}', [StaffOwnerController::class, 'show'])->name('show');
        Route::get('create', [StaffOwnerController::class, 'create'])->name('create');
        Route::post('/', [StaffOwnerController::class, 'store'])->name('store');
        /*
         * Owners can be reviewed and deactivated, but their personal details
         * are theirs to maintain through the portal; administrators cannot
         * edit them from here.
         */
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

        // One service in full: its price, length, rating, and every published
        // review, the way a shop item page reads.
        Route::get('services/{service}', [OwnerServiceController::class, 'show'])
            ->name('services.show');

        Route::get('appointments', [OwnerAppointmentController::class, 'index'])->name('appointments.index');
        Route::post('appointments', [OwnerAppointmentController::class, 'store'])->name('appointments.store');

        // Cancels one of the owner's own upcoming visits.
        Route::patch('appointments/{appointment}/cancel', [OwnerAppointmentController::class, 'cancel'])
            ->name('appointments.cancel');

        // Rates a visit the clinic has already carried out.
        Route::post('appointments/{appointment}/review', [OwnerAppointmentController::class, 'review'])
            ->name('appointments.review');

        /*
         * Pays for a confirmed or completed visit. The clinic takes the
         * payment itself, so this is the whole trip: the owner picks a
         * channel, the payment is recorded, and they stay on the page.
         */
        Route::post('appointments/{appointment}/pay', [OwnerPaymentController::class, 'store'])
            ->name('payments.store');

        // Powers the navbar's search box; returns JSON, not an Inertia page.
        Route::get('search', OwnerSearchController::class)->name('search');

        // Powers the floating FAQ button's browse view; JSON, not a page.
        Route::get('faqs', OwnerFaqController::class)->name('faqs');

        /*
         * The FAQ chat: the client asks in their own words and gets the
         * desk's published answer back, so the help button is a conversation
         * instead of a list they have to search.
         */
        Route::get('faqs/chat', [OwnerFaqChatController::class, 'start'])->name('faqs.chat');
        Route::post('faqs/ask', [OwnerFaqChatController::class, 'ask'])->name('faqs.ask');

        /*
         * The help panel's complaint threads. Also JSON: the panel stays open
         * while a client writes, reads the reply, and writes again.
         */
        Route::get('complaints', [OwnerComplaintController::class, 'index'])->name('complaints.index');
        Route::post('complaints', [OwnerComplaintController::class, 'store'])->name('complaints.store');
        Route::post('complaints/{complaint}/messages', [OwnerComplaintController::class, 'reply'])->name('complaints.reply');

        Route::patch('notifications/read', [OwnerNotificationController::class, 'markAllRead'])
            ->name('notifications.read');

        Route::get('account', [OwnerAccountController::class, 'edit'])->name('account.edit');
        Route::patch('account', [OwnerAccountController::class, 'update'])->name('account.update');

        Route::post('dogs', [OwnerDogController::class, 'store'])->name('dogs.store');
        Route::patch('dogs/{dog}', [OwnerDogController::class, 'update'])->name('dogs.update');
    });

require __DIR__.'/auth.php';
