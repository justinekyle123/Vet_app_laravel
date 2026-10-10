<?php

use App\Models\Appointment;
use App\Models\AppointmentStatus;
use App\Models\Dog;
use App\Models\DogOwner;
use App\Models\Service;
use App\Models\Staff;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * Books a visit for a fresh owner and dog. The lookups the schema insists on
 * are created on demand, so each test only states the part it cares about.
 */
function bookRequest(string $date, string $statusName = 'Requested'): Appointment
{
    $owner = DogOwner::factory()->create();
    $dog = Dog::factory()->create(['owner_id' => $owner->owner_id]);

    return Appointment::create([
        'owner_id' => $owner->owner_id,
        'dog_id' => $dog->dog_id,
        'service_id' => Service::factory()->create()->service_id,
        'appointment_date' => $date,
        'appointment_time' => '10:00:00',
        'status_id' => AppointmentStatus::firstOrCreate(['status_name' => $statusName])->status_id,
    ]);
}

test('the admin console bell lists incoming appointment requests', function () {
    bookRequest(today()->addDays(1)->toDateString());
    // A confirmed visit is not awaiting confirmation, so it stays out of the feed.
    bookRequest(today()->addDays(2)->toDateString(), 'Confirmed');
    // A request already in the past is not incoming either.
    bookRequest(today()->subDay()->toDateString());

    $this->actingAs(Staff::factory()->admin()->create())
        ->get(route('admin.dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('adminNotifications.notifications', 1)
            ->where('adminNotifications.notifications.0.status', 'Requested')
            ->where('adminNotifications.unreadNotifications', 1)
        );
});

test('marking requests read clears the badge but keeps the feed', function () {
    bookRequest(today()->addDay()->toDateString());
    $admin = Staff::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('adminNotifications.unreadNotifications', 1)
        );

    $this->actingAs($admin)
        ->patch(route('admin.notifications.read'))
        ->assertRedirect();

    $this->actingAs($admin)
        ->get(route('admin.dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('adminNotifications.notifications', 1)
            ->where('adminNotifications.unreadNotifications', 0)
        );
});

test('marking requests read clears the badge even with a skewed database clock', function () {
    $request = bookRequest(today()->addDay()->toDateString());
    // `created_at` is database-written and can be ahead of PHP's clock.
    $request->created_at = now()->addHours(8);
    $request->save();

    $admin = Staff::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('adminNotifications.unreadNotifications', 1)
        );

    $this->actingAs($admin)
        ->patch(route('admin.notifications.read'))
        ->assertRedirect();

    $this->actingAs($admin)
        ->get(route('admin.dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('adminNotifications.unreadNotifications', 0)
        );
});

test('non-admin accounts have no console notification feed', function () {
    $this->actingAs(Staff::factory()->veterinarian()->create())
        ->get(route('profile.edit'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('adminNotifications', null)
        );
});
