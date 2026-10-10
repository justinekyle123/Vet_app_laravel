<?php

use App\Models\Appointment;
use App\Models\AppointmentStatus;
use App\Models\Dog;
use App\Models\DogOwner;
use App\Models\Notification;
use App\Models\Service;
use App\Models\Staff;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * Books a visit for the operations desk. The lookups the schema insists on are
 * created on demand, so each test only states the part it actually cares about.
 */
function opsVisit(
    DogOwner $owner,
    string $date,
    string $statusName = 'Confirmed',
    string $time = '09:00',
    ?string $dogName = null,
    ?string $serviceName = null,
): Appointment {
    return Appointment::create([
        'owner_id' => $owner->owner_id,
        'dog_id' => Dog::factory()->create([
            'owner_id' => $owner->owner_id,
            'dog_name' => $dogName ?? 'Rex',
        ])->dog_id,
        'service_id' => Service::factory()->create([
            'service_name' => $serviceName ?? 'Wellness Exam',
            'duration_minutes' => 30,
        ])->service_id,
        'appointment_date' => $date,
        'appointment_time' => $time,
        'status_id' => AppointmentStatus::firstOrCreate(['status_name' => $statusName])->status_id,
    ]);
}

test('the operations page lists enriched appointment details', function () {
    $owner = DogOwner::factory()->create(['phone_number' => '09170000000']);
    // Midnight today is always behind us, so "can complete" is deterministic.
    opsVisit($owner, today()->toDateString(), 'Confirmed', '00:00');

    $this->actingAs(Staff::factory()->admin()->create())
        ->get(route('admin.operations.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('FrontDesk/Dashboard')
            ->has('today', 1)
            ->where('today.0.owner', $owner->fullName())
            ->where('today.0.owner_phone', '09170000000')
            ->where('today.0.duration_minutes', 30)
            // The payload tells the page exactly what can be done next.
            ->where('today.0.can_complete', true)
            ->where('today.0.can_no_show', true)
            ->where('today.0.can_confirm', false)
            ->where('today.0.can_cancel', true)
        );
});

test('the operations list can be searched by client, dog, or service', function () {
    $alice = DogOwner::factory()->create(['first_name' => 'Alice', 'last_name' => 'Reyes']);
    $bob = DogOwner::factory()->create(['first_name' => 'Bob', 'last_name' => 'Tan']);
    opsVisit($alice, today()->toDateString(), 'Confirmed', '09:00', 'Rex', 'Wellness Exam');
    opsVisit($bob, today()->toDateString(), 'Confirmed', '10:00', 'Milo', 'Grooming');

    $admin = Staff::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.operations.dashboard', ['q' => 'Rex']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('today', 1)
            ->where('today.0.dog', 'Rex')
            ->where('filter.q', 'Rex')
        );

    $this->actingAs($admin)
        ->get(route('admin.operations.dashboard', ['q' => 'Bob']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('today', 1)
            ->where('today.0.owner', 'Bob Tan')
        );

    $this->actingAs($admin)
        ->get(route('admin.operations.dashboard', ['q' => 'Grooming']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('today', 1)
            ->where('today.0.service', 'Grooming')
        );
});

test('the operations totals ignore the active filters', function () {
    $owner = DogOwner::factory()->create();
    opsVisit($owner, today()->toDateString(), 'Confirmed', '08:30');
    opsVisit($owner, today()->toDateString(), 'Completed', '09:30');
    opsVisit($owner, today()->toDateString(), 'Cancelled', '10:30');
    opsVisit($owner, today()->addDay()->toDateString(), 'Requested', '09:00');

    $this->actingAs(Staff::factory()->admin()->create())
        ->get(route('admin.operations.dashboard', ['status' => 'Requested']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('stats.today', 3)
            ->where('stats.requested', 1)
            ->where('stats.confirmed_today', 1)
            ->where('stats.completed_today', 1)
            ->where('stats.cancelled_today', 1)
        );
});

test('an admin can close a confirmed visit as completed', function () {
    $owner = DogOwner::factory()->create();
    // A past visit, since a future one cannot be completed yet.
    $visit = opsVisit($owner, today()->subDay()->toDateString(), 'Confirmed');

    $this->actingAs(Staff::factory()->admin()->create())
        ->patch(route('admin.operations.appointments.complete', $visit))
        ->assertSessionHasNoErrors();

    expect($visit->fresh()->status->status_name)->toBe('Completed')
        // Closing a visit out is not a client-facing change, so no message.
        ->and(Notification::where('appointment_id', $visit->appointment_id)->exists())->toBeFalse();
});

test('an admin can record a confirmed visit as a no-show', function () {
    $owner = DogOwner::factory()->create();
    $visit = opsVisit($owner, today()->toDateString(), 'Confirmed');

    $this->actingAs(Staff::factory()->admin()->create())
        ->patch(route('admin.operations.appointments.no-show', $visit))
        ->assertSessionHasNoErrors();

    expect($visit->fresh()->status->status_name)->toBe('No-show')
        ->and(Notification::where('appointment_id', $visit->appointment_id)->exists())->toBeFalse();
});

test('a visit cannot be completed before it is due', function () {
    $owner = DogOwner::factory()->create();
    $visit = opsVisit($owner, today()->addDay()->toDateString(), 'Confirmed', '10:00');

    $admin = Staff::factory()->admin()->create();

    $this->actingAs($admin)
        ->patch(route('admin.operations.appointments.complete', $visit))
        ->assertSessionHasErrors('appointment');

    // The visit keeps its state, and the page does not offer the action.
    expect($visit->fresh()->status->status_name)->toBe('Confirmed');

    $this->actingAs($admin)
        ->get(route('admin.operations.dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('upcoming.0.can_complete', false)
            ->where('upcoming.0.can_no_show', true)
        );
});

test('only a confirmed visit can be completed or marked a no-show', function () {
    $owner = DogOwner::factory()->create();
    $requested = opsVisit($owner, today()->toDateString(), 'Requested');

    $admin = Staff::factory()->admin()->create();

    $this->actingAs($admin)
        ->patch(route('admin.operations.appointments.complete', $requested))
        ->assertSessionHasErrors('appointment');

    $this->actingAs($admin)
        ->patch(route('admin.operations.appointments.no-show', $requested))
        ->assertSessionHasErrors('appointment');

    expect($requested->fresh()->status->status_name)->toBe('Requested');
});
