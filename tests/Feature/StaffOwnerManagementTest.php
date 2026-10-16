<?php

use App\Models\Appointment;
use App\Models\AppointmentStatus;
use App\Models\Dog;
use App\Models\DogOwner;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\Service;
use App\Models\Staff;
use Inertia\Testing\AssertableInertia as Assert;

test('admins can browse dog owners', function () {
    DogOwner::factory()->count(3)->create();

    $this->actingAs(Staff::factory()->admin()->create())
        ->get(route('owners.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Staff/Owners/Index')
            ->has('owners.data', 3)
            // Each row needs the `id` the show/edit links are built from,
            // not just the raw `owner_id` column.
            ->has('owners.data.0.id')
            ->has('owners.data.0.dogs_count')
        );
});

test('the owners list can be filtered by status and search', function () {
    DogOwner::factory()->create(['first_name' => 'Active', 'last_name' => 'Client']);
    DogOwner::factory()->create(['first_name' => 'Gone', 'last_name' => 'Client', 'is_active' => false]);

    $this->actingAs(Staff::factory()->admin()->create())
        ->get(route('owners.index'))
        ->assertInertia(fn (Assert $page) => $page->has('owners.data', 1));

    $this->actingAs(Staff::factory()->admin()->create())
        ->get(route('owners.index', ['status' => 'all']))
        ->assertInertia(fn (Assert $page) => $page->has('owners.data', 2));

    $this->actingAs(Staff::factory()->admin()->create())
        ->get(route('owners.index', ['search' => 'Gone', 'status' => 'all']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('owners.data', 1)
            ->where('owners.data.0.first_name', 'Gone')
        );
});

test('dog owners cannot reach the staff owners area', function () {
    $this->actingAs(DogOwner::factory()->create())
        ->get(route('owners.index'))
        ->assertForbidden();
});

test('admins cannot register an owner through the staff area', function () {
    $this->actingAs(Staff::factory()->admin()->create())
        ->get('/owners/create')
        ->assertNotFound();
});

test('staff can view an owner with their dogs', function () {
    $owner = DogOwner::factory()->create();
    Dog::factory()->create([
        'owner_id' => $owner->owner_id,
        'dog_name' => 'Rex',
    ]);

    $this->actingAs(Staff::factory()->admin()->create())
        ->get(route('owners.show', $owner))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Staff/Owners/Show')
            ->where('owner.id', $owner->owner_id)
            ->has('dogs', 1)
            ->where('dogs.0.dog_name', 'Rex')
        );
});

test('admins can no longer edit an owner\'s details', function () {
    $owner = DogOwner::factory()->create(['address' => 'Old Town']);
    $admin = Staff::factory()->admin()->create();

    // The edit screen is gone, so there is nothing to open.
    $this->actingAs($admin)
        ->get("/owners/{$owner->owner_id}/edit")
        ->assertNotFound();

    // And the update endpoint is gone too, so the record cannot be rewritten
    // by calling the old URL directly.
    $this->actingAs($admin)
        ->patch("/owners/{$owner->owner_id}", [
            'first_name' => 'Changed',
            'last_name' => 'Owner',
            'email' => $owner->email,
            'phone_number' => $owner->phone_number,
            'address' => 'New Town',
            'is_active' => true,
        ])
        // The URI still matches the show route, so Laravel answers 405.
        ->assertStatus(405);

    expect($owner->fresh()->address)->toBe('Old Town')
        ->and($owner->fresh()->first_name)->toBe($owner->first_name);
});

test('staff can see every service an owner has booked, with its details', function () {
    $owner = DogOwner::factory()->create();
    $dog = Dog::factory()->create([
        'owner_id' => $owner->owner_id,
        'dog_name' => 'Rex',
    ]);

    $service = Service::factory()->create([
        'service_name' => 'Dental Cleaning',
        'description' => 'Ultrasonic scaling and polish.',
        'duration_minutes' => 60,
        'price' => '2500.00',
    ]);

    $visit = Appointment::create([
        'owner_id' => $owner->owner_id,
        'dog_id' => $dog->dog_id,
        'service_id' => $service->service_id,
        'appointment_date' => today()->addDays(3)->toDateString(),
        'appointment_time' => '10:00:00',
        'status_id' => AppointmentStatus::firstOrCreate(['status_name' => 'Confirmed'])->status_id,
        'notes' => 'Nervous around dryers.',
    ]);

    // Half the price came in as a deposit, so the balance must show too.
    $method = PaymentMethod::firstOrCreate(['method_name' => 'GCash']);
    Payment::create([
        'appointment_id' => $visit->appointment_id,
        'owner_id' => $owner->owner_id,
        'method_id' => $method->method_id,
        'amount' => '1250.00',
        'payment_status' => Payment::STATUS_PAID,
        'reference' => '0123 456 789012',
        'paid_at' => now(),
    ]);

    // Another client's booking must never surface on this page.
    $otherOwner = DogOwner::factory()->create();
    $otherDog = Dog::factory()->create(['owner_id' => $otherOwner->owner_id]);
    Appointment::create([
        'owner_id' => $otherOwner->owner_id,
        'dog_id' => $otherDog->dog_id,
        'service_id' => $service->service_id,
        'appointment_date' => today()->addDays(4)->toDateString(),
        'appointment_time' => '11:00:00',
        'status_id' => AppointmentStatus::firstOrCreate(['status_name' => 'Requested'])->status_id,
    ]);

    $this->actingAs(Staff::factory()->admin()->create())
        ->get(route('owners.show', $owner))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Staff/Owners/Show')
            ->has('bookings', 1)
            ->where('bookings.0.service', 'Dental Cleaning')
            ->where('bookings.0.service_description', 'Ultrasonic scaling and polish.')
            ->where('bookings.0.dog', 'Rex')
            ->where('bookings.0.status', 'Confirmed')
            ->where('bookings.0.notes', 'Nervous around dryers.')
            ->where('bookings.0.duration_minutes', 60)
            ->where('bookings.0.price', '2500.00')
            ->where('bookings.0.date', today()->addDays(3)->toDateString())
            ->where('bookings.0.time', '10:00')
            ->has('bookings.0.requested_at')
            // Money: half taken, half still outstanding on the visit.
            ->where('bookings.0.settlement.price', '2500.00')
            ->where('bookings.0.settlement.paid', '1250.00')
            ->where('bookings.0.settlement.balance', '1250.00')
            ->where('bookings.0.settlement.state', 'part')
            ->has('bookings.0.payments', 1)
            ->where('bookings.0.payments.0.method', 'GCash')
            ->where('bookings.0.payments.0.reference', '0123 456 789012')
            ->where('bookings.0.payments.0.status', Payment::STATUS_PAID)
        );
});

test('upcoming bookings are listed above the owner\'s history', function () {
    $owner = DogOwner::factory()->create();
    $dog = Dog::factory()->create(['owner_id' => $owner->owner_id]);

    $book = fn (string $date, string $time): Appointment => Appointment::create([
        'owner_id' => $owner->owner_id,
        'dog_id' => $dog->dog_id,
        'service_id' => Service::factory()->create()->service_id,
        'appointment_date' => $date,
        'appointment_time' => $time,
        'status_id' => AppointmentStatus::firstOrCreate(['status_name' => 'Confirmed'])->status_id,
    ]);

    $past = $book(today()->subDays(10)->toDateString(), '11:00:00');
    $later = $book(today()->addDays(9)->toDateString(), '09:00:00');
    $sooner = $book(today()->addDays(2)->toDateString(), '15:00:00');

    $this->actingAs(Staff::factory()->admin()->create())
        ->get(route('owners.show', $owner))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Staff/Owners/Show')
            ->has('bookings', 3)
            // Next visit first, then later ones, and the history last.
            ->where('bookings.0.id', $sooner->appointment_id)
            ->where('bookings.1.id', $later->appointment_id)
            ->where('bookings.2.id', $past->appointment_id)
        );
});

test('the client page reports no bookings for an owner who has none', function () {
    $owner = DogOwner::factory()->create();

    $this->actingAs(Staff::factory()->admin()->create())
        ->get(route('owners.show', $owner))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Staff/Owners/Show')
            ->has('bookings', 0)
        );
});

test('the client page offers the desk actions each visit allows', function () {
    $owner = DogOwner::factory()->create();
    $dog = Dog::factory()->create(['owner_id' => $owner->owner_id]);
    $service = Service::factory()->create(['duration_minutes' => 30, 'price' => '500.00']);

    $book = fn (string $date, string $time, string $status): Appointment => Appointment::create([
        'owner_id' => $owner->owner_id,
        'dog_id' => $dog->dog_id,
        'service_id' => $service->service_id,
        'appointment_date' => $date,
        'appointment_time' => $time,
        'status_id' => AppointmentStatus::firstOrCreate(['status_name' => $status])->status_id,
    ]);

    // A request, a confirmed visit still to come, and one already due.
    $book(today()->addDay()->toDateString(), '09:00:00', 'Requested');
    $book(today()->addDays(7)->toDateString(), '10:00:00', 'Confirmed');
    $book(today()->subDay()->toDateString(), '10:00:00', 'Confirmed');

    $this->actingAs(Staff::factory()->admin()->create())
        ->get(route('owners.show', $owner))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Staff/Owners/Show')
            ->has('bookings', 3)
            // The request: accepted or turned away, nothing to close out yet.
            ->where('bookings.0.can_confirm', true)
            ->where('bookings.0.can_cancel', true)
            ->where('bookings.0.can_complete', false)
            // Confirmed but still ahead: no closing it out early, but a miss
            // can already be recorded and it can be called off.
            ->where('bookings.1.can_confirm', false)
            ->where('bookings.1.can_complete', false)
            ->where('bookings.1.can_no_show', true)
            ->where('bookings.1.can_cancel', true)
            // Confirmed and already due: this one can be closed out.
            ->where('bookings.2.can_complete', true)
            ->where('bookings.2.can_no_show', true)
        );
});

test('the client page warns when calling a paid visit off would refund money', function () {
    $owner = DogOwner::factory()->create();
    $dog = Dog::factory()->create(['owner_id' => $owner->owner_id]);
    $service = Service::factory()->create(['duration_minutes' => 30, 'price' => '500.00']);

    $visit = Appointment::create([
        'owner_id' => $owner->owner_id,
        'dog_id' => $dog->dog_id,
        'service_id' => $service->service_id,
        'appointment_date' => today()->addDay()->toDateString(),
        'appointment_time' => '09:00:00',
        'status_id' => AppointmentStatus::firstOrCreate(['status_name' => 'Confirmed'])->status_id,
    ]);

    $method = PaymentMethod::firstOrCreate(['method_name' => 'GCash']);
    Payment::create([
        'appointment_id' => $visit->appointment_id,
        'owner_id' => $owner->owner_id,
        'method_id' => $method->method_id,
        'amount' => '250.00',
        'payment_status' => Payment::STATUS_PAID,
        'paid_at' => now(),
    ]);

    $this->actingAs(Staff::factory()->admin()->create())
        ->get(route('owners.show', $owner))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Staff/Owners/Show')
            ->where('bookings.0.settlement.paid', '250.00')
            ->where('bookings.0.settlement.refunded', '0.00')
            // The desk may still call it off, and is told the money goes back.
            ->where('bookings.0.can_cancel', true)
            ->where('bookings.0.refund_on_cancel', true)
        );
});

test('staff can deactivate and reactivate an owner', function () {
    $owner = DogOwner::factory()->create(['is_active' => true]);
    $staff = Staff::factory()->admin()->create();

    $this->actingAs($staff)
        ->patch(route('owners.deactivate', $owner))
        ->assertSessionHasNoErrors();

    expect($owner->fresh()->is_active)->toBeFalse();

    $this->actingAs($staff)
        ->patch(route('owners.activate', $owner))
        ->assertSessionHasNoErrors();

    expect($owner->fresh()->is_active)->toBeTrue();
});
