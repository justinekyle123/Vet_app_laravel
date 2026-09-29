<?php

use App\Models\Appointment;
use App\Models\AppointmentStatus;
use App\Models\Dog;
use App\Models\DogOwner;
use App\Models\Service;
use App\Models\Staff;

/**
 * The first weekday after today the clinic is open (its default `days_open` is
 * Monday-Saturday), so booking tests always land on a real open day.
 */
function nextOpenDay(): string
{
    $date = today()->addDay();

    while ($date->isSunday()) {
        $date = $date->addDay();
    }

    return $date->toDateString();
}

test('the services page carries the owner\'s own active dogs for booking', function () {
    $owner = DogOwner::factory()->create();
    Dog::factory()->create(['owner_id' => $owner->owner_id, 'dog_name' => 'Rex']);
    Dog::factory()->create([
        'owner_id' => $owner->owner_id,
        'dog_name' => 'Retired',
        'is_active' => false,
    ]);
    Dog::factory()->create(['dog_name' => 'Someone Else']);

    $this->actingAs($owner)
        ->get(route('owner.services.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Owner/Services')
            ->has('dogs', 1)
            ->where('dogs.0.dog_name', 'Rex')
            ->where('bookingWindowDays', 60)
        );
});

test('an owner can request a visit from the booking calendar', function () {
    $owner = DogOwner::factory()->create();
    $dog = Dog::factory()->create(['owner_id' => $owner->owner_id]);
    $service = Service::factory()->create(['duration_minutes' => 30]);

    $date = nextOpenDay();

    $this->actingAs($owner)
        ->post(route('owner.appointments.store'), [
            'service_id' => $service->service_id,
            'dog_id' => $dog->dog_id,
            'appointment_date' => $date,
            'appointment_time' => '09:00',
            'notes' => 'Limping on the back leg.',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('owner.appointments.index'));

    $appointment = Appointment::query()->sole();

    expect($appointment->owner_id)->toBe($owner->owner_id)
        ->and($appointment->dog_id)->toBe($dog->dog_id)
        ->and($appointment->service_id)->toBe($service->service_id)
        ->and($appointment->appointment_date->toDateString())->toBe($date)
        ->and($appointment->status?->status_name)->toBe('Requested');

    $this->actingAs($owner)
        ->get(route('owner.appointments.index'))
        ->assertInertia(fn ($page) => $page
            ->has('upcoming', 1)
            ->where('upcoming.0.status', 'Requested')
        );
});

test('a booking cannot use another owner\'s dog', function () {
    $owner = DogOwner::factory()->create();
    $other = DogOwner::factory()->create();
    $otherDog = Dog::factory()->create(['owner_id' => $other->owner_id]);

    $this->actingAs($owner)
        ->post(route('owner.appointments.store'), [
            'service_id' => Service::factory()->create()->service_id,
            'dog_id' => $otherDog->dog_id,
            'appointment_date' => nextOpenDay(),
            'appointment_time' => '09:00',
        ])
        ->assertSessionHasErrors('dog_id');

    expect(Appointment::query()->count())->toBe(0);
});

test('a booking cannot take a retired service', function () {
    $owner = DogOwner::factory()->create();
    $dog = Dog::factory()->create(['owner_id' => $owner->owner_id]);

    $this->actingAs($owner)
        ->post(route('owner.appointments.store'), [
            'service_id' => Service::factory()->inactive()->create()->service_id,
            'dog_id' => $dog->dog_id,
            'appointment_date' => nextOpenDay(),
            'appointment_time' => '09:00',
        ])
        ->assertSessionHasErrors('service_id');
});

test('a booking cannot take a time another visit already holds', function () {
    $owner = DogOwner::factory()->create();
    $dog = Dog::factory()->create(['owner_id' => $owner->owner_id]);
    $date = nextOpenDay();

    Appointment::create([
        'owner_id' => DogOwner::factory()->create()->owner_id,
        'dog_id' => Dog::factory()->create()->dog_id,
        'service_id' => Service::factory()->create(['duration_minutes' => 30])->service_id,
        'appointment_date' => $date,
        'appointment_time' => '09:00',
        'status_id' => AppointmentStatus::firstOrCreate(['status_name' => 'Confirmed'])->status_id,
    ]);

    $this->actingAs($owner)
        ->post(route('owner.appointments.store'), [
            'service_id' => Service::factory()->create(['duration_minutes' => 30])->service_id,
            'dog_id' => $dog->dog_id,
            'appointment_date' => $date,
            'appointment_time' => '09:00',
        ])
        ->assertSessionHasErrors('appointment_time');

    expect(Appointment::query()->count())->toBe(1);
});

test('the availability calendar hides times a visit already holds', function () {
    $owner = DogOwner::factory()->create();
    $service = Service::factory()->create(['duration_minutes' => 30]);
    $date = nextOpenDay();

    Appointment::create([
        'owner_id' => $owner->owner_id,
        'dog_id' => Dog::factory()->create(['owner_id' => $owner->owner_id])->dog_id,
        'service_id' => $service->service_id,
        'appointment_date' => $date,
        'appointment_time' => '09:00',
        'status_id' => AppointmentStatus::firstOrCreate(['status_name' => 'Confirmed'])->status_id,
    ]);

    $response = $this->actingAs($owner)
        ->getJson(route('owner.services.availability', $service))
        ->assertOk();

    $times = collect($response->json("times.{$date}"))->pluck('value');

    expect($response->json('dates'))->toContain($date)
        ->and($times)->toContain('09:30')
        ->not->toContain('09:00');
});

test('a cancelled visit frees its slot again', function () {
    $owner = DogOwner::factory()->create();
    $service = Service::factory()->create(['duration_minutes' => 30]);
    $date = nextOpenDay();

    Appointment::create([
        'owner_id' => $owner->owner_id,
        'dog_id' => Dog::factory()->create(['owner_id' => $owner->owner_id])->dog_id,
        'service_id' => $service->service_id,
        'appointment_date' => $date,
        'appointment_time' => '09:00',
        'status_id' => AppointmentStatus::firstOrCreate(['status_name' => 'Cancelled'])->status_id,
    ]);

    $response = $this->actingAs($owner)
        ->getJson(route('owner.services.availability', $service))
        ->assertOk();

    expect(collect($response->json("times.{$date}"))->pluck('value'))->toContain('09:00');
});

test('staff cannot book through the owner portal', function () {
    $this->actingAs(Staff::factory()->frontDesk()->create())
        ->post(route('owner.appointments.store'), [
            'service_id' => Service::factory()->create()->service_id,
            'dog_id' => Dog::factory()->create()->dog_id,
            'appointment_date' => nextOpenDay(),
            'appointment_time' => '09:00',
        ])
        ->assertForbidden();
});
