<?php

use App\Models\Appointment;
use App\Models\AppointmentStatus;
use App\Models\Dog;
use App\Models\DogOwner;
use App\Models\Service;
use App\Models\Staff;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * Books a visit for the desk's day view. The lookups the schema insists on are
 * created on demand, so each test only states the part it cares about.
 */
function deskVisit(
    DogOwner $owner,
    string $date,
    string $statusName = 'Confirmed',
    string $time = '09:00',
): Appointment {
    return Appointment::create([
        'owner_id' => $owner->owner_id,
        'dog_id' => Dog::factory()->create(['owner_id' => $owner->owner_id])->dog_id,
        'service_id' => Service::factory()->create(['duration_minutes' => 30])->service_id,
        'appointment_date' => $date,
        'appointment_time' => $time,
        'status_id' => AppointmentStatus::firstOrCreate(['status_name' => $statusName])->status_id,
    ]);
}

test('the root dashboard redirects each role to its own area', function (
    callable $account,
    string $routeName,
) {
    $this->actingAs($account())
        ->get('/dashboard')
        ->assertRedirect(route($routeName));
})->with([
    'admin' => [fn () => Staff::factory()->admin()->create(), 'admin.dashboard'],
    'front desk' => [fn () => Staff::factory()->frontDesk()->create(), 'front_desk.dashboard'],
    'veterinarian' => [fn () => Staff::factory()->veterinarian()->create(), 'front_desk.dashboard'],
    'dog owner' => [fn () => DogOwner::factory()->create(), 'owner.dashboard'],
]);

test('the admin dashboard renders account stats', function () {
    Staff::factory()->admin()->create();
    Staff::factory()->frontDesk()->create();
    DogOwner::factory()->count(2)->create();

    $this->actingAs(Staff::factory()->admin()->create())
        ->get(route('admin.dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Dashboard')
            ->where('stats.admins', 2)
            ->where('stats.front_desk', 1)
            ->where('stats.owners', 2)
            ->where('stats.total_users', 5)
            ->has('recentUsers', 5)
        );
});

test('the front desk dashboard renders for staff', function () {
    $this->actingAs(Staff::factory()->frontDesk()->create())
        ->get(route('front_desk.dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('FrontDesk/Dashboard')
            ->has('today')
            ->has('upcoming')
            ->has('stats')
        );
});

test('the front desk dashboard lists today\'s and upcoming appointments', function () {
    $owner = DogOwner::factory()->create();

    deskVisit($owner, today()->toDateString(), 'Confirmed', '08:30');
    deskVisit($owner, today()->addDay()->toDateString(), 'Requested', '10:15');
    deskVisit($owner, today()->subDay()->toDateString(), 'Completed', '11:00');

    $this->actingAs(Staff::factory()->frontDesk()->create())
        ->get(route('front_desk.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('FrontDesk/Dashboard')
            // Only today is in the day view; yesterday belongs to the past.
            ->has('today', 1)
            ->where('today.0.time', '08:30')
            ->where('today.0.status', 'Confirmed')
            ->where('today.0.owner', $owner->fullName())
            ->has('upcoming', 1)
            ->where('upcoming.0.status', 'Requested')
            ->where('stats.today', 1)
            ->where('stats.upcoming', 1)
            ->where('stats.requested', 1)
        );
});

test('the desk appointments list can be filtered by status', function () {
    $owner = DogOwner::factory()->create();

    deskVisit($owner, today()->toDateString(), 'Confirmed', '08:30');
    deskVisit($owner, today()->toDateString(), 'Requested', '09:30');

    $this->actingAs(Staff::factory()->frontDesk()->create())
        ->get(route('front_desk.dashboard', ['status' => 'Requested']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('FrontDesk/Dashboard')
            ->has('today', 1)
            ->where('today.0.status', 'Requested')
            ->where('filter.status', 'Requested')
            // The chips follow the clinic's status order, not the DB order.
            ->has('statusOptions', 3)
            ->where('statusOptions.0.value', 'all')
            ->where('statusOptions.1.value', 'Requested')
            ->where('statusOptions.2.value', 'Confirmed')
            // Tab totals stay unfiltered, so the labels do not move.
            ->where('stats.today', 2)
        );
});

test('an unknown status filter falls back to every status', function () {
    $this->actingAs(Staff::factory()->frontDesk()->create())
        ->get(route('front_desk.dashboard', ['status' => 'Bogus']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('filter.status', 'all')
            ->where('statusOptions.0.value', 'all')
        );
});

test('the desk confirmation queue counts only today onwards', function () {
    $owner = DogOwner::factory()->create();

    deskVisit($owner, today()->addDay()->toDateString(), 'Requested');
    deskVisit($owner, today()->subDay()->toDateString(), 'Requested');

    $this->actingAs(Staff::factory()->frontDesk()->create())
        ->get(route('front_desk.dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('stats.requested', 1)
        );
});

test('the owner dashboard renders for owners', function () {
    $this->actingAs(DogOwner::factory()->create())
        ->get(route('owner.dashboard'))
        ->assertInertia(fn (Assert $page) => $page->component('Owner/Dashboard'));
});
