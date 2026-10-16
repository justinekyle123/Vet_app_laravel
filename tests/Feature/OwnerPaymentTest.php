<?php

use App\Models\Appointment;
use App\Models\AppointmentStatus;
use App\Models\Dog;
use App\Models\DogOwner;
use App\Models\Notification;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\Service;
use Inertia\Testing\AssertableInertia as Assert;

/*
|--------------------------------------------------------------------------
| The clinic's own online payment
|--------------------------------------------------------------------------
|
| There is no gateway: the owner picks a channel in the portal and the payment
| is recorded against the visit. These tests hold the shape of that bargain —
| who may pay, in which channels, from which visit states, how much of a visit
| can be settled ahead of the day, what a visit the clinic has already carried
| out costs, and what the client is told afterwards.
|
| Names are prefixed so they cannot collide with helpers other feature test
| files declare in the same global namespace.
|
*/

/** A visit for a fresh owner and dog, in the given state. */
function payableVisit(string $status = 'Confirmed', ?string $date = null, string $price = '500.00'): Appointment
{
    $owner = DogOwner::factory()->create();
    $dog = Dog::factory()->create(['owner_id' => $owner->owner_id]);
    $service = Service::factory()->create(['price' => $price]);

    return Appointment::create([
        'owner_id' => $owner->owner_id,
        'dog_id' => $dog->dog_id,
        'service_id' => $service->service_id,
        'appointment_date' => $date ?? today()->addDays(2)->toDateString(),
        'appointment_time' => '10:00:00',
        'status_id' => AppointmentStatus::firstOrCreate(['status_name' => $status])->status_id,
    ]);
}

/** A payment the clinic has already taken for a visit. */
function paidPayment(
    Appointment $visit,
    string $method = 'GCash',
    ?string $amount = null,
    ?string $reference = null,
): Payment {
    return Payment::create([
        'appointment_id' => $visit->appointment_id,
        'owner_id' => $visit->owner_id,
        'method_id' => PaymentMethod::firstOrCreate(['method_name' => $method])->method_id,
        'amount' => $amount ?? $visit->service->price,
        'payment_status' => 'Paid',
        'reference' => $reference,
        'paid_at' => now(),
    ]);
}

test('the portal offers gcash, maya, a card, and a bank transfer', function () {
    $owner = DogOwner::factory()->create();

    $this->actingAs($owner)
        ->get(route('owner.appointments.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('portal.paymentMethods', 4)
            ->where('portal.paymentMethods.0.name', 'GCash')
            ->where('portal.paymentMethods.1.name', 'Maya')
            ->where('portal.paymentMethods.2.name', 'Card')
            ->where('portal.paymentMethods.2.icon', 'card')
            ->where('portal.paymentMethods.3.name', 'Bank Transfer')
        );
});

test('an owner can pay for a confirmed visit in any channel the clinic offers', function (string $method) {
    $visit = payableVisit();

    $this->actingAs($visit->owner)
        ->from(route('owner.appointments.index'))
        ->post(route('owner.payments.store', $visit), [
            'method' => $method,
            'reference' => '0123 456 789123',
        ])
        ->assertRedirect(route('owner.appointments.index'))
        ->assertSessionHasNoErrors()
        ->assertSessionHas('status', 'payment-paid');

    $payment = Payment::query()->sole();

    expect($payment->owner_id)->toBe($visit->owner_id)
        ->and($payment->appointment_id)->toBe($visit->appointment_id)
        ->and($payment->payment_status)->toBe('Paid')
        ->and($payment->method->method_name)->toBe($method)
        ->and((float) $payment->amount)->toBe(500.0)
        ->and($payment->reference)->toBe('0123 456 789123')
        ->and($payment->paid_at)->not->toBeNull();
})->with(['GCash', 'Maya', 'Card', 'Bank Transfer']);

test('a client can pay part of a visit that is still ahead', function () {
    $visit = payableVisit();

    $this->actingAs($visit->owner)
        ->post(route('owner.payments.store', $visit), [
            'method' => 'GCash',
            'amount' => 200,
            'reference' => 'DEP-1',
        ])
        ->assertSessionHasNoErrors();

    expect((float) Payment::query()->sole()->amount)->toBe(200.0);

    // The visit is part paid: still payable, and the portal says what is left.
    $this->actingAs($visit->owner)
        ->get(route('owner.appointments.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('upcoming.0.settlement.state', 'part')
            ->where('upcoming.0.settlement.price', '500.00')
            ->where('upcoming.0.settlement.paid', '200.00')
            ->where('upcoming.0.settlement.balance', '300.00')
            ->where('upcoming.0.settlement.advance', true)
            ->where('upcoming.0.settlement.last_payment.method', 'GCash')
            ->where('upcoming.0.settlement.last_payment.reference', 'DEP-1')
            ->where('upcoming.0.payable', true)
        );
});

test('a part payment tells the client what is still owed', function () {
    $visit = payableVisit();

    $this->actingAs($visit->owner)
        ->post(route('owner.payments.store', $visit), [
            'method' => 'Maya',
            'amount' => 200,
        ])
        ->assertSessionHasNoErrors();

    $message = Notification::query()
        ->where('appointment_id', $visit->appointment_id)
        ->value('message');

    expect($message)->toBeString()
        ->and($message)->toContain('$200.00')
        ->and($message)->toContain('still due')
        ->and($message)->toContain('$300.00');
});

test('the rest of an advance payment can be settled later', function () {
    $visit = payableVisit();

    $this->actingAs($visit->owner)
        ->post(route('owner.payments.store', $visit), ['method' => 'GCash', 'amount' => 200])
        ->assertSessionHasNoErrors();

    $this->actingAs($visit->owner)
        ->post(route('owner.payments.store', $visit), ['method' => 'Card', 'amount' => 300])
        ->assertSessionHasNoErrors();

    expect($visit->payments()->count())->toBe(2)
        ->and($visit->payments()->where('payment_status', 'Paid')->sum('amount'))->toEqual(500);

    $this->actingAs($visit->owner)
        ->get(route('owner.appointments.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('upcoming.0.settlement.state', 'paid')
            ->where('upcoming.0.settlement.balance', '0.00')
            ->where('upcoming.0.payable', false)
        );
});

test('a completed visit can be settled in full after the fact', function () {
    $visit = payableVisit('Completed', today()->subDay()->toDateString());

    $this->actingAs($visit->owner)
        ->post(route('owner.payments.store', $visit), ['method' => 'GCash'])
        ->assertSessionHasNoErrors();

    expect((float) $visit->payments()->sole()->amount)->toBe(500.0);
});

test('a visit that has already taken place cannot be part paid', function () {
    $visit = payableVisit('Completed', today()->subDay()->toDateString());

    $this->actingAs($visit->owner)
        ->post(route('owner.payments.store', $visit), [
            'method' => 'GCash',
            'amount' => 200,
        ])
        ->assertSessionHasErrors('amount');

    expect(Payment::query()->count())->toBe(0);
});

test('a visit that was part paid ahead can only be settled in full afterwards', function () {
    // Confirmed, paid 200 of 500, now carried out: 300 is due, all of it.
    $visit = payableVisit('Completed', today()->subDay()->toDateString());
    paidPayment($visit, amount: '200.00');

    $this->actingAs($visit->owner)
        ->post(route('owner.payments.store', $visit), ['method' => 'GCash', 'amount' => 100])
        ->assertSessionHasErrors('amount');

    expect($visit->payments()->count())->toBe(1);

    $this->actingAs($visit->owner)
        ->post(route('owner.payments.store', $visit), ['method' => 'GCash', 'amount' => 300])
        ->assertSessionHasNoErrors();

    expect($visit->payments()->where('payment_status', 'Paid')->sum('amount'))->toEqual(500);
});

test('paying more than the visit costs is refused', function () {
    $visit = payableVisit();

    $this->actingAs($visit->owner)
        ->post(route('owner.payments.store', $visit), ['method' => 'GCash', 'amount' => 600])
        ->assertSessionHasErrors('amount');

    // And again once part of it has been paid: only the 300 left may follow.
    paidPayment($visit, amount: '200.00');

    $this->actingAs($visit->owner)
        ->post(route('owner.payments.store', $visit), ['method' => 'GCash', 'amount' => 400])
        ->assertSessionHasErrors('amount');

    expect($visit->payments()->count())->toBe(1);
});

test('the amount has to be a number above nothing', function (string|int $amount) {
    $visit = payableVisit();

    $this->actingAs($visit->owner)
        ->post(route('owner.payments.store', $visit), [
            'method' => 'GCash',
            'amount' => $amount,
        ])
        ->assertSessionHasErrors('amount');

    expect(Payment::query()->count())->toBe(0);
})->with(['half of it', 0]);

test('the reference number is optional', function () {
    $visit = payableVisit();

    $this->actingAs($visit->owner)
        ->post(route('owner.payments.store', $visit), ['method' => 'Maya'])
        ->assertSessionHasNoErrors();

    $payment = Payment::query()->sole();

    expect($payment->reference)->toBeNull()
        ->and($payment->payment_status)->toBe('Paid');
});

test('paying tells the owner it went through', function () {
    $visit = payableVisit();

    $this->actingAs($visit->owner)
        ->post(route('owner.payments.store', $visit), ['method' => 'GCash']);

    $message = Notification::query()
        ->where('appointment_id', $visit->appointment_id)
        ->value('message');

    expect($message)->toBeString()
        ->and($message)->toContain('payment')
        ->and($message)->toContain($visit->service->service_name);
});

test('a visit the clinic has not confirmed cannot be paid', function (string $status) {
    $visit = payableVisit($status);

    $this->actingAs($visit->owner)
        ->post(route('owner.payments.store', $visit), ['method' => 'GCash'])
        ->assertSessionHasErrors('payment');

    expect(Payment::query()->count())->toBe(0);
})->with(['Requested', 'Cancelled', 'No-show']);

test('a visit with nothing to pay is refused', function () {
    $visit = payableVisit(price: '0.00');

    $this->actingAs($visit->owner)
        ->post(route('owner.payments.store', $visit), ['method' => 'GCash'])
        ->assertSessionHasErrors('payment');

    expect(Payment::query()->count())->toBe(0);
});

test('an owner cannot pay for another client\'s visit', function () {
    $visit = payableVisit();
    $other = DogOwner::factory()->create();

    $this->actingAs($other)
        ->post(route('owner.payments.store', $visit), ['method' => 'GCash'])
        ->assertNotFound();

    expect(Payment::query()->count())->toBe(0);
});

test('a visit that was already paid cannot be paid again', function () {
    $visit = payableVisit();
    paidPayment($visit);

    $this->actingAs($visit->owner)
        ->post(route('owner.payments.store', $visit), ['method' => 'Maya'])
        ->assertSessionHasErrors('payment');

    expect($visit->payments()->count())->toBe(1);
});

test('a channel the clinic does not offer is refused', function () {
    $visit = payableVisit();

    $this->actingAs($visit->owner)
        ->post(route('owner.payments.store', $visit), ['method' => 'Bitcoin'])
        ->assertSessionHasErrors('method');

    expect(Payment::query()->count())->toBe(0);
});

test('a visit reads back as paid, with how it was paid for', function () {
    $visit = payableVisit();

    $this->actingAs($visit->owner)
        ->get(route('owner.appointments.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('upcoming.0.payable', true)
            ->where('upcoming.0.settlement.state', 'unpaid')
            ->where('upcoming.0.settlement.paid', '0.00')
            ->where('upcoming.0.settlement.balance', '500.00')
            ->where('upcoming.0.settlement.advance', true)
            ->where('upcoming.0.settlement.last_payment', null)
        );

    $this->actingAs($visit->owner)
        ->post(route('owner.payments.store', $visit), [
            'method' => 'Maya',
            'reference' => '0123 456 789123',
        ])
        ->assertSessionHasNoErrors();

    $this->actingAs($visit->owner)
        ->get(route('owner.appointments.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('upcoming.0.payable', false)
            ->where('upcoming.0.settlement.state', 'paid')
            ->where('upcoming.0.settlement.paid', '500.00')
            ->where('upcoming.0.settlement.balance', '0.00')
            ->where('upcoming.0.settlement.last_payment.method', 'Maya')
            ->where('upcoming.0.settlement.last_payment.reference', '0123 456 789123')
            ->where('upcoming.0.settlement.last_payment.amount', '500.00')
        );
});

test('the client can still call off a visit they have paid for', function () {
    // The clinic cannot cancel a paid visit, so this is the only way out of
    // one — and the money is then refunded at the desk.
    $visit = payableVisit();
    paidPayment($visit, amount: '200.00');

    $this->actingAs($visit->owner)
        ->patch(route('owner.appointments.cancel', $visit))
        ->assertSessionHasNoErrors();

    expect($visit->fresh()->status->status_name)->toBe('Cancelled')
        ->and($visit->payments()->where('payment_status', 'Paid')->exists())->toBeTrue();
});
