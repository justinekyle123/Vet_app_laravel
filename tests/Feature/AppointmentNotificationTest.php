<?php

use App\Models\Appointment;
use App\Models\AppointmentStatus;
use App\Models\Dog;
use App\Models\DogOwner;
use App\Models\Notification;
use App\Models\Service;
use App\Models\Staff;

/**
 * Books a visit for a fresh owner and dog, in the given starting state.
 */
function bookVisit(string $statusName = 'Requested'): Appointment
{
    $owner = DogOwner::factory()->create();
    $dog = Dog::factory()->create(['owner_id' => $owner->owner_id]);

    return Appointment::create([
        'owner_id' => $owner->owner_id,
        'dog_id' => $dog->dog_id,
        'service_id' => Service::factory()->create(['service_name' => 'Wellness Exam'])->service_id,
        'appointment_date' => today()->addDays(2)->toDateString(),
        'appointment_time' => '10:00:00',
        'status_id' => AppointmentStatus::firstOrCreate(['status_name' => $statusName])->status_id,
    ]);
}

/** The single message logged for a visit, or null when none was. */
function noticeFor(Appointment $appointment): ?Notification
{
    return Notification::query()
        ->where('owner_id', $appointment->owner_id)
        ->where('appointment_id', $appointment->appointment_id)
        ->first();
}

test('accepting a request notifies the owner', function () {
    $visit = bookVisit('Requested');

    $this->actingAs(Staff::factory()->admin()->create())
        ->patch(route('admin.operations.appointments.confirm', $visit))
        ->assertSessionHasNoErrors();

    $notice = noticeFor($visit);

    expect($notice)->not->toBeNull()
        ->and($notice->message)->toContain('confirmed')
        ->and($notice->status)->toBe('Sent')
        ->and($notice->sent_at)->not->toBeNull();
});

test('declining a request notifies the owner it could not be accepted', function () {
    $visit = bookVisit('Requested');

    $this->actingAs(Staff::factory()->admin()->create())
        ->patch(route('admin.operations.appointments.cancel', $visit))
        ->assertSessionHasNoErrors();

    $notice = noticeFor($visit);

    expect($notice)->not->toBeNull()
        ->and($notice->message)->toContain('could not be accepted');
});

test('cancelling a confirmed visit notifies the owner it was cancelled', function () {
    $visit = bookVisit('Confirmed');

    $this->actingAs(Staff::factory()->admin()->create())
        ->patch(route('admin.operations.appointments.cancel', $visit))
        ->assertSessionHasNoErrors();

    $notice = noticeFor($visit);

    expect($notice)->not->toBeNull()
        ->and($notice->message)->toContain('cancelled by the clinic');
});

test('a refused transition does not notify the owner', function () {
    $visit = bookVisit('Completed');

    $this->actingAs(Staff::factory()->admin()->create())
        ->patch(route('admin.operations.appointments.confirm', $visit))
        ->assertSessionHasErrors('appointment');

    expect(noticeFor($visit))->toBeNull();
});

test('the owner portal bell shows the decision message', function () {
    $visit = bookVisit('Requested');

    $this->actingAs(Staff::factory()->admin()->create())
        ->patch(route('admin.operations.appointments.confirm', $visit));

    $this->actingAs($visit->owner)
        ->get(route('owner.dashboard'))
        ->assertInertia(fn (\Inertia\Testing\AssertableInertia $page) => $page
            ->has('portal.notifications', 1)
            ->where('portal.notifications.0.message', fn ($message) => str_contains($message, 'confirmed'))
            ->where('portal.unreadNotifications', 1)
        );
});
