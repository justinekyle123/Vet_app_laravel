<?php

use App\Models\Appointment;
use App\Models\AppointmentStatus;
use App\Models\Dog;
use App\Models\DogOwner;
use App\Models\Notification;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\Service;
use App\Models\Staff;
use Inertia\Testing\AssertableInertia as Assert;

/** A payment the clinic has taken for a visit, in the given channel. */
function opsPayment(
    Appointment $visit,
    string $amount = '100.00',
    string $method = 'GCash',
    ?string $reference = null,
): Payment {
    return Payment::create([
        'appointment_id' => $visit->appointment_id,
        'owner_id' => $visit->owner_id,
        'method_id' => PaymentMethod::firstOrCreate(['method_name' => $method])->method_id,
        'amount' => $amount,
        'payment_status' => 'Paid',
        'reference' => $reference,
        'paid_at' => now(),
    ]);
}

/** An amount as the page carries it. */
function opsMoney(float $value): string
{
    return number_format($value, 2, '.', '');
}

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

test('the operations page shows the money taken and what is still owed', function () {
    $owner = DogOwner::factory()->create();
    $visit = opsVisit($owner, today()->addDay()->toDateString(), 'Confirmed');
    $price = (float) $visit->service->price;
    // A part payment — a quarter of the visit — made ahead of the day.
    $paid = opsMoney(round($price / 4, 2));
    $left = opsMoney($price - (float) $paid);

    opsPayment($visit, $paid, 'GCash', 'DEP-42');

    $this->actingAs(Staff::factory()->admin()->create())
        ->get(route('admin.operations.dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            // The visit itself carries its money story.
            ->where('upcoming.0.settlement.state', 'part')
            ->where('upcoming.0.settlement.price', opsMoney($price))
            ->where('upcoming.0.settlement.paid', $paid)
            ->where('upcoming.0.settlement.balance', $left)
            ->where('upcoming.0.settlement.advance', true)
            // and the desk is warned that calling it off hands money back.
            ->where('upcoming.0.can_cancel', true)
            ->where('upcoming.0.refund_on_cancel', true)
            // The transaction, as the desk reads it back.
            ->has('transactions', 1)
            ->where('transactions.0.amount', $paid)
            ->where('transactions.0.method', 'GCash')
            ->where('transactions.0.reference', 'DEP-42')
            ->where('transactions.0.owner', $owner->fullName())
            ->where('transactions.0.dog', 'Rex')
            ->where('transactions.0.advance', true)
            ->where('transactions.0.state', 'part')
            ->where('transactions.0.balance', $left)
            // The money totals, and who owes the rest.
            ->where('money.collected_today', $paid)
            ->where('money.part_paid', 1)
            ->where('money.owing', 1)
            ->where('money.outstanding', $left)
            ->has('debts', 1)
            ->where('debts.0.owner', $owner->fullName())
            ->where('debts.0.balance', $left)
            ->where('debts.0.advance', true)
        );
});

test('a fully settled visit leaves nothing outstanding', function () {
    $owner = DogOwner::factory()->create();
    $visit = opsVisit($owner, today()->addDay()->toDateString(), 'Confirmed');

    opsPayment($visit, opsMoney((float) $visit->service->price));

    $this->actingAs(Staff::factory()->admin()->create())
        ->get(route('admin.operations.dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('upcoming.0.settlement.state', 'paid')
            ->where('upcoming.0.settlement.balance', '0.00')
            // Paid in full is still paid: calling it off refunds all of it.
            ->where('upcoming.0.can_cancel', true)
            ->where('upcoming.0.refund_on_cancel', true)
            ->where('money.owing', 0)
            ->where('money.outstanding', '0.00')
            ->has('debts', 0)
        );
});

test('cancelling a paid visit refunds the money and tells the owner how to collect it', function () {
    $owner = DogOwner::factory()->create();
    $visit = opsVisit($owner, today()->addDay()->toDateString(), 'Confirmed');

    // A deposit ahead of the day: the desk calls the visit off and the money
    // has to find its way back rather than sitting behind a cancelled visit.
    $deposit = '250.00';
    opsPayment($visit, $deposit, 'GCash', 'DEP-77');

    $this->actingAs(Staff::factory()->admin()->create())
        ->patch(route('admin.operations.appointments.cancel', $visit))
        ->assertSessionHasNoErrors();

    expect($visit->fresh()->status->status_name)->toBe('Cancelled')
        // The payment is marked refunded, so the till no longer counts it.
        ->and($visit->payments()->where('payment_status', 'Refunded')->count())->toBe(1)
        ->and($visit->payments()->where('payment_status', 'Paid')->count())->toBe(0);

    $notice = Notification::query()
        ->where('appointment_id', $visit->appointment_id)
        ->first();

    // The owner is told the visit is off, how much is coming back, and where
    // to collect it — a refund is never something they have to chase.
    expect($notice)->not->toBeNull()
        ->and($notice->message)->toContain('cancelled by the clinic')
        ->and($notice->message)->toContain('$250.00')
        ->and($notice->message)->toContain('front desk');
});

test('a declined request hands its deposit back to the client', function () {
    $owner = DogOwner::factory()->create();
    $visit = opsVisit($owner, today()->addDay()->toDateString(), 'Requested');

    opsPayment($visit, '150.00', 'Maya', 'REQ-11');

    $this->actingAs(Staff::factory()->admin()->create())
        ->patch(route('admin.operations.appointments.cancel', $visit))
        ->assertSessionHasNoErrors();

    $notice = Notification::query()
        ->where('appointment_id', $visit->appointment_id)
        ->first();

    expect($visit->fresh()->status->status_name)->toBe('Cancelled')
        ->and($visit->payments()->where('payment_status', 'Refunded')->exists())->toBeTrue()
        ->and($notice?->message)->toContain('could not be accepted')
        ->and($notice?->message)->toContain('$150.00');
});

test('cancelling a visit nobody has paid for sends no refund details', function () {
    $owner = DogOwner::factory()->create();
    $visit = opsVisit($owner, today()->addDay()->toDateString(), 'Confirmed');

    $this->actingAs(Staff::factory()->admin()->create())
        ->patch(route('admin.operations.appointments.cancel', $visit))
        ->assertSessionHasNoErrors();

    $notice = Notification::query()
        ->where('appointment_id', $visit->appointment_id)
        ->first();

    expect($notice?->message)->toContain('cancelled by the clinic')
        ->and($notice?->message)->not->toContain('refunding');
});

test('a refunded visit no longer counts as money the clinic holds', function () {
    $owner = DogOwner::factory()->create();
    $visit = opsVisit($owner, today()->addDay()->toDateString(), 'Confirmed');

    opsPayment($visit, '200.00');

    $this->actingAs(Staff::factory()->admin()->create())
        ->patch(route('admin.operations.appointments.cancel', $visit));

    $this->actingAs(Staff::factory()->admin()->create())
        ->get(route('admin.operations.dashboard', ['status' => 'all']))
        ->assertInertia(fn (Assert $page) => $page
            // The visit still shows what it was worth and what came back.
            ->where('upcoming.0.settlement.paid', '0.00')
            ->where('upcoming.0.settlement.refunded', '200.00')
            // A cancelled visit is nobody's debt, and no longer a refund wait.
            ->where('upcoming.0.can_cancel', false)
            ->where('upcoming.0.refund_on_cancel', false)
        );
});

test('a visit already carried out cannot be cancelled', function () {
    $owner = DogOwner::factory()->create();
    $visit = opsVisit($owner, today()->subDays(2)->toDateString(), 'Completed');

    $this->actingAs(Staff::factory()->admin()->create())
        ->patch(route('admin.operations.appointments.cancel', $visit))
        ->assertSessionHasErrors('appointment');

    expect($visit->fresh()->status->status_name)->toBe('Completed');
});

test('an admin can still cancel a visit nobody has paid for', function () {
    $owner = DogOwner::factory()->create();
    $visit = opsVisit($owner, today()->addDay()->toDateString(), 'Confirmed');

    $this->actingAs(Staff::factory()->admin()->create())
        ->patch(route('admin.operations.appointments.cancel', $visit))
        ->assertSessionHasNoErrors();

    expect($visit->fresh()->status->status_name)->toBe('Cancelled');
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
