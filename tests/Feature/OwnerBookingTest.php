<?php

use App\Models\Appointment;
use App\Models\AppointmentStatus;
use App\Models\Dog;
use App\Models\DogOwner;
use App\Models\Payment;
use App\Models\Service;
use App\Models\Staff;
use Carbon\CarbonImmutable;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

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

/*
 * Online booking is closed in the clinic's own configuration while the way a
 * visit is arranged is reworked, so these tests open it: they hold the shape
 * of the flow for when it returns. The last test covers the closed state
 * itself — the state the portal ships in.
 */
beforeEach(function () {
    config(['booking.online' => true]);
});

/**
 * The payment a booking must carry: half the price up front, with the
 * reference number and screenshot of the successful payment the clinic
 * matches it against. Half is what the portal offers by default.
 *
 * @return array<string, mixed>
 */
function bookingPayment(
    Service $service,
    ?string $amount = null,
    string $method = 'GCash',
): array {
    return [
        'payment_method' => $method,
        'payment_amount' => $amount ?? number_format((float) $service->price / 2, 2, '.', ''),
        'payment_reference' => '0123 456 789123',
        'payment_proof' => UploadedFile::fake()->create('gcash-receipt.jpg', 120, 'image/jpeg'),
    ];
}

test('the booking wizard carries active services, the owner\'s dogs, and the booking window', function () {
    $owner = DogOwner::factory()->create();
    Dog::factory()->create(['owner_id' => $owner->owner_id, 'dog_name' => 'Rex']);
    Dog::factory()->create([
        'owner_id' => $owner->owner_id,
        'dog_name' => 'Retired',
        'is_active' => false,
    ]);
    Dog::factory()->create(['dog_name' => 'Someone Else']);
        $service = Service::factory()->create(['is_active' => true]);

    $this->actingAs($owner)
        ->get(route('owner.booking'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Owner/BookingPage')
            ->where('services.0.id', $service->service_id)
            // Only the owner's own, active dogs can be booked.
            ->has('dogs', 1)
            ->where('dogs.0.dog_name', 'Rex')
            ->where('bookingWindowDays', 60)
        );
});

test('a retired service is excluded from the booking wizard', function () {
    $owner = DogOwner::factory()->create();
    $active = Service::factory()->create();
    Service::factory()->inactive()->create();

    $this->actingAs($owner)
        ->get(route('owner.booking'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('services.0.id', $active->service_id)
            ->count('services', 1)
        );
});

test('an owner can request a visit from the booking calendar', function () {
    Storage::fake('public');

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
            ...bookingPayment($service),
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
    $service = Service::factory()->create();

    $this->actingAs($owner)
        ->post(route('owner.appointments.store'), [
            'service_id' => $service->service_id,
            'dog_id' => $otherDog->dog_id,
            'appointment_date' => nextOpenDay(),
            'appointment_time' => '09:00',
            ...bookingPayment($service),
        ])
        ->assertSessionHasErrors('dog_id');

    expect(Appointment::query()->count())->toBe(0);
});

test('a booking cannot take a retired service', function () {
    $owner = DogOwner::factory()->create();
    $dog = Dog::factory()->create(['owner_id' => $owner->owner_id]);
    $service = Service::factory()->inactive()->create();

    $this->actingAs($owner)
        ->post(route('owner.appointments.store'), [
            'service_id' => $service->service_id,
            'dog_id' => $dog->dog_id,
            'appointment_date' => nextOpenDay(),
            'appointment_time' => '09:00',
            ...bookingPayment($service),
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

    $service = Service::factory()->create(['duration_minutes' => 30]);

    $this->actingAs($owner)
        ->post(route('owner.appointments.store'), [
            'service_id' => $service->service_id,
            'dog_id' => $dog->dog_id,
            'appointment_date' => $date,
            'appointment_time' => '09:00',
            ...bookingPayment($service),
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

test('a day that has already closed offers no times for today', function () {
    $owner = DogOwner::factory()->create();
    $service = Service::factory()->create(['duration_minutes' => 30]);

    // Six in the evening in Quezon City is ten in the morning UTC. Read on the
    // server's own clock the day would still look half-empty, which is how a
    // client ends up picking a time the clinic has already closed on.
    $this->travelTo(CarbonImmutable::parse('2026-10-20 18:00:00', 'Asia/Manila'));

    $availability = $this->actingAs($owner)
        ->getJson(route('owner.services.availability', $service))
        ->assertOk()
        ->json();

    expect($availability['dates'])->not->toContain('2026-10-20')
        // The next open day is untouched: the clinic is shut for the night,
        // not out of business.
        ->and($availability['dates'])->toContain('2026-10-21')
        ->and(array_column($availability['times']['2026-10-21'], 'value'))->toContain('08:00');
});

test('only the times still ahead of the clinic are offered for today', function () {
    $owner = DogOwner::factory()->create();
    $service = Service::factory()->create(['duration_minutes' => 30]);

    // A quarter past four in the afternoon. The clinic closes at six, so the
    // last half-hour starts are 16:30, 17:00 and 17:30 — the rest have gone.
    $this->travelTo(CarbonImmutable::parse('2026-10-20 16:15:00', 'Asia/Manila'));

    $availability = $this->actingAs($owner)
        ->getJson(route('owner.services.availability', $service))
        ->assertOk()
        ->json();

    expect(array_column($availability['times']['2026-10-20'], 'value'))
        ->toBe(['16:30', '17:00', '17:30']);
});

test('the calendar can leave one of the owner\'s own visits out of the clash check', function () {
    $owner = DogOwner::factory()->create();
    $dog = Dog::factory()->create(['owner_id' => $owner->owner_id]);
    $service = Service::factory()->create(['duration_minutes' => 30]);
    $date = nextOpenDay();

    // The visit being moved already holds 09:00, so that slot is the one the
    // reschedule sheet has to offer back.
    $visit = existingVisit($owner, $dog, $service, 'Confirmed', $date, '09:00');

    $withoutIgnore = $this->actingAs($owner)
        ->getJson(route('owner.services.availability', $service))
        ->assertOk()
        ->json();

    $withIgnore = $this->actingAs($owner)
        ->getJson(route('owner.services.availability', [
            'service' => $service->service_id,
            'ignore' => $visit->appointment_id,
        ]))
        ->assertOk()
        ->json();

    expect(collect($withoutIgnore['times'][$date] ?? [])->pluck('value'))->not->toContain('09:00')
        ->and(collect($withIgnore['times'][$date] ?? [])->pluck('value'))->toContain('09:00');
});

test('a visit that is not the owner\'s own cannot be excused from the clash check', function () {
    $owner = DogOwner::factory()->create();
    $stranger = DogOwner::factory()->create();
    $dog = Dog::factory()->create(['owner_id' => $stranger->owner_id]);
    $service = Service::factory()->create(['duration_minutes' => 30]);
    $date = nextOpenDay();

    $otherVisit = existingVisit($stranger, $dog, $service, 'Confirmed', $date, '09:00');

    $availability = $this->actingAs($owner)
        ->getJson(route('owner.services.availability', [
            'service' => $service->service_id,
            'ignore' => $otherVisit->appointment_id,
        ]))
        ->assertOk()
        ->json();

    expect(collect($availability['times'][$date] ?? [])->pluck('value'))->not->toContain('09:00');
});

test('a visit can be moved to any other slot the calendar still offers', function () {
    $owner = DogOwner::factory()->create();
    $dog = Dog::factory()->create(['owner_id' => $owner->owner_id]);
    $service = Service::factory()->create(['duration_minutes' => 30]);
    $date = nextOpenDay();

    $visit = existingVisit($owner, $dog, $service, 'Confirmed', $date, '09:00');

    $this->actingAs($owner)
        ->patch(route('owner.appointments.reschedule', $visit), [
            'appointment_date' => $date,
            'appointment_time' => '10:00',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('owner.appointments.index'));

    $moved = $visit->fresh();

    expect($moved->appointment_date->toDateString())->toBe($date)
        ->and((string) $moved->appointment_time)->toStartWith('10:00');
});

test('a visit cannot be moved to a slot that has already passed today', function () {
    $owner = DogOwner::factory()->create();
    $dog = Dog::factory()->create(['owner_id' => $owner->owner_id]);
    $service = Service::factory()->create(['duration_minutes' => 30]);

    // Six in the evening in Quezon City. The clinic closes at six, so nothing
    // of today is left to book — even on the server's own (UTC) clock, where
    // the day would still look half empty. The date validation alone would
    // let this through, so the slot itself has to turn it away.
    $this->travelTo(CarbonImmutable::parse('2026-10-20 18:00:00', 'Asia/Manila'));

    $visit = existingVisit($owner, $dog, $service, 'Confirmed', '2026-10-21', '09:00');

    $this->actingAs($owner)
        ->patch(route('owner.appointments.reschedule', $visit), [
            'appointment_date' => '2026-10-20',
            'appointment_time' => '09:00',
        ])
        ->assertSessionHasErrors('appointment_time');

    $untouched = $visit->fresh();

    expect($untouched->appointment_date->toDateString())->toBe('2026-10-21')
        ->and((string) $untouched->appointment_time)->toStartWith('09:00');
});

test('an owner cannot reschedule another client\'s visit', function () {
    $owner = DogOwner::factory()->create();
    $stranger = DogOwner::factory()->create();
    $dog = Dog::factory()->create(['owner_id' => $stranger->owner_id]);
    $service = Service::factory()->create(['duration_minutes' => 30]);
    $date = nextOpenDay();

    $visit = existingVisit($stranger, $dog, $service, 'Confirmed', $date, '09:00');

    $this->actingAs($owner)
        ->patch(route('owner.appointments.reschedule', $visit), [
            'appointment_date' => $date,
            'appointment_time' => '10:00',
        ])
        ->assertNotFound();

    expect((string) $visit->fresh()->appointment_time)->toStartWith('09:00');
});

/** A visit already on the books for a dog and service, in the given state. */
function existingVisit(DogOwner $owner, Dog $dog, Service $service, string $status, string $date, string $time = '09:00'): Appointment
{
    return Appointment::create([
        'owner_id' => $owner->owner_id,
        'dog_id' => $dog->dog_id,
        'service_id' => $service->service_id,
        'appointment_date' => $date,
        'appointment_time' => $time,
        'status_id' => AppointmentStatus::firstOrCreate(['status_name' => $status])->status_id,
    ]);
}

test('an owner cannot book a service their dog already has upcoming', function () {
    $owner = DogOwner::factory()->create();
    $dog = Dog::factory()->create(['owner_id' => $owner->owner_id]);
    $service = Service::factory()->create(['duration_minutes' => 30]);
    $date = nextOpenDay();

    existingVisit($owner, $dog, $service, 'Requested', $date);

    $this->actingAs($owner)
        ->post(route('owner.appointments.store'), [
            'service_id' => $service->service_id,
            'dog_id' => $dog->dog_id,
            'appointment_date' => $date,
            'appointment_time' => '10:00',
            ...bookingPayment($service),
        ])
        ->assertSessionHasErrors('service_id');

    expect(Appointment::query()->count())->toBe(1);
});

test('a second dog can book a service another dog already has upcoming', function () {
    $owner = DogOwner::factory()->create();
    $first = Dog::factory()->create(['owner_id' => $owner->owner_id]);
    $second = Dog::factory()->create(['owner_id' => $owner->owner_id]);
    $service = Service::factory()->create(['duration_minutes' => 30]);
    $date = nextOpenDay();

    existingVisit($owner, $first, $service, 'Requested', $date);

    $this->actingAs($owner)
        ->post(route('owner.appointments.store'), [
            'service_id' => $service->service_id,
            'dog_id' => $second->dog_id,
            'appointment_date' => $date,
            'appointment_time' => '10:00',
            ...bookingPayment($service),
        ])
        ->assertSessionHasNoErrors();

    expect(Appointment::query()->count())->toBe(2);
});

test('an owner can book a different service while another is upcoming', function () {
    $owner = DogOwner::factory()->create();
    $dog = Dog::factory()->create(['owner_id' => $owner->owner_id]);
    $booked = Service::factory()->create(['duration_minutes' => 30]);
    $other = Service::factory()->create(['duration_minutes' => 30]);
    $date = nextOpenDay();

    existingVisit($owner, $dog, $booked, 'Confirmed', $date);

    $this->actingAs($owner)
        ->post(route('owner.appointments.store'), [
            'service_id' => $other->service_id,
            'dog_id' => $dog->dog_id,
            'appointment_date' => $date,
            'appointment_time' => '10:00',
            ...bookingPayment($other),
        ])
        ->assertSessionHasNoErrors();

    expect(Appointment::query()->count())->toBe(2);
});

test('a completed visit frees the service for booking again', function () {
    $owner = DogOwner::factory()->create();
    $dog = Dog::factory()->create(['owner_id' => $owner->owner_id]);
    $service = Service::factory()->create(['duration_minutes' => 30]);
    $date = nextOpenDay();

    existingVisit($owner, $dog, $service, 'Completed', today()->toDateString());

    $this->actingAs($owner)
        ->post(route('owner.appointments.store'), [
            'service_id' => $service->service_id,
            'dog_id' => $dog->dog_id,
            'appointment_date' => $date,
            'appointment_time' => '09:00',
            ...bookingPayment($service),
        ])
        ->assertSessionHasNoErrors();

    expect(Appointment::query()->count())->toBe(2);
});

test('a cancelled visit frees the service for booking again', function () {
    $owner = DogOwner::factory()->create();
    $dog = Dog::factory()->create(['owner_id' => $owner->owner_id]);
    $service = Service::factory()->create(['duration_minutes' => 30]);
    $date = nextOpenDay();

    existingVisit($owner, $dog, $service, 'Cancelled', $date);

    $this->actingAs($owner)
        ->post(route('owner.appointments.store'), [
            'service_id' => $service->service_id,
            'dog_id' => $dog->dog_id,
            'appointment_date' => $date,
            'appointment_time' => '09:00',
            ...bookingPayment($service),
        ])
        ->assertSessionHasNoErrors();

    expect(Appointment::query()->count())->toBe(2);
});

test('staff cannot book through the owner portal', function () {
    $this->actingAs(Staff::factory()->admin()->create())
        ->post(route('owner.appointments.store'), [
            'service_id' => Service::factory()->create()->service_id,
            'dog_id' => Dog::factory()->create()->dog_id,
            'appointment_date' => nextOpenDay(),
            'appointment_time' => '09:00',
        ])
        ->assertForbidden();
});

/*
|--------------------------------------------------------------------------
| Paying to book
|--------------------------------------------------------------------------
|
| The clinic takes the payment itself, so a request only reaches the desk
| once the client has sent at least half the price and shown the screenshot
| that proves it. These tests hold that bargain: the deposit, the full
| price, and the requests that are refused before anything is written.
|
*/

test('a booking records the deposit, its reference, and the proof of payment', function () {
    Storage::fake('public');

    $owner = DogOwner::factory()->create();
    $dog = Dog::factory()->create(['owner_id' => $owner->owner_id]);
    $service = Service::factory()->create(['duration_minutes' => 30, 'price' => '500.00']);

    $this->actingAs($owner)
        ->post(route('owner.appointments.store'), [
            'service_id' => $service->service_id,
            'dog_id' => $dog->dog_id,
            'appointment_date' => nextOpenDay(),
            'appointment_time' => '09:00',
            'payment_method' => 'GCash',
            'payment_amount' => '250.00',
            'payment_reference' => '0123 456 789123',
            'payment_proof' => UploadedFile::fake()->create('gcash-receipt.jpg', 120, 'image/jpeg'),
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('owner.appointments.index'));

    $payment = Payment::query()->sole();

    expect((float) $payment->amount)->toBe(250.0)
        ->and($payment->payment_status)->toBe('Paid')
        ->and($payment->method->method_name)->toBe('GCash')
        ->and($payment->reference)->toBe('0123 456 789123')
        ->and($payment->paid_at)->not->toBeNull()
        ->and($payment->payment_proof_path)->toBeString();

    // The screenshot really landed, so the desk can open it later.
    Storage::disk('public')->assertExists($payment->payment_proof_path);

    // And the portal reads the visit back as part paid.
    $this->actingAs($owner)
        ->get(route('owner.appointments.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('upcoming.0.settlement.state', 'part')
            ->where('upcoming.0.settlement.price', '500.00')
            ->where('upcoming.0.settlement.paid', '250.00')
            ->where('upcoming.0.settlement.balance', '250.00')
        );
});

test('a booking can settle the whole price up front', function () {
    Storage::fake('public');

    $owner = DogOwner::factory()->create();
    $dog = Dog::factory()->create(['owner_id' => $owner->owner_id]);
    $service = Service::factory()->create(['duration_minutes' => 30, 'price' => '500.00']);

    $this->actingAs($owner)
        ->post(route('owner.appointments.store'), [
            'service_id' => $service->service_id,
            'dog_id' => $dog->dog_id,
            'appointment_date' => nextOpenDay(),
            'appointment_time' => '09:00',
            ...bookingPayment($service, '500.00'),
        ])
        ->assertSessionHasNoErrors();

    expect((float) Payment::query()->sole()->amount)->toBe(500.0);

    $this->actingAs($owner)
        ->get(route('owner.appointments.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('upcoming.0.settlement.state', 'paid')
            ->where('upcoming.0.settlement.balance', '0.00')
        );
});

test('a booking cannot be sent with less than half the price up front', function () {
    Storage::fake('public');

    $owner = DogOwner::factory()->create();
    $dog = Dog::factory()->create(['owner_id' => $owner->owner_id]);
    $service = Service::factory()->create(['duration_minutes' => 30, 'price' => '500.00']);

    $this->actingAs($owner)
        ->post(route('owner.appointments.store'), [
            'service_id' => $service->service_id,
            'dog_id' => $dog->dog_id,
            'appointment_date' => nextOpenDay(),
            'appointment_time' => '09:00',
            ...bookingPayment($service, '249.99'),
        ])
        ->assertSessionHasErrors('payment_amount');

    expect(Appointment::query()->count())->toBe(0)
        ->and(Payment::query()->count())->toBe(0);
});

test('a booking cannot promise more than the visit costs', function () {
    Storage::fake('public');

    $owner = DogOwner::factory()->create();
    $dog = Dog::factory()->create(['owner_id' => $owner->owner_id]);
    $service = Service::factory()->create(['duration_minutes' => 30, 'price' => '500.00']);

    $this->actingAs($owner)
        ->post(route('owner.appointments.store'), [
            'service_id' => $service->service_id,
            'dog_id' => $dog->dog_id,
            'appointment_date' => nextOpenDay(),
            'appointment_time' => '09:00',
            ...bookingPayment($service, '500.01'),
        ])
        ->assertSessionHasErrors('payment_amount');

    expect(Appointment::query()->count())->toBe(0)
        ->and(Payment::query()->count())->toBe(0);
});

test('a booking cannot be sent without a screenshot of the payment', function () {
    Storage::fake('public');

    $owner = DogOwner::factory()->create();
    $dog = Dog::factory()->create(['owner_id' => $owner->owner_id]);
    $service = Service::factory()->create(['duration_minutes' => 30, 'price' => '500.00']);

    $this->actingAs($owner)
        ->post(route('owner.appointments.store'), [
            'service_id' => $service->service_id,
            'dog_id' => $dog->dog_id,
            'appointment_date' => nextOpenDay(),
            'appointment_time' => '09:00',
            'payment_method' => 'GCash',
            'payment_amount' => '250.00',
            'payment_reference' => '0123 456 789123',
        ])
        ->assertSessionHasErrors('payment_proof');

    expect(Appointment::query()->count())->toBe(0)
        ->and(Payment::query()->count())->toBe(0);
});

test('the portal turns booking away while online booking is closed', function () {
    // The switch the portal ships with: the front desk takes the booking, so
    // neither the page nor the endpoint behind it can be reached.
    config(['booking.online' => false]);

    $owner = DogOwner::factory()->create();
    $dog = Dog::factory()->create(['owner_id' => $owner->owner_id]);
    $service = Service::factory()->create(['duration_minutes' => 30, 'price' => '500.00']);

    $this->actingAs($owner)
        ->get(route('owner.booking'))
        ->assertNotFound();

    $this->actingAs($owner)
        ->post(route('owner.appointments.store'), [
            'service_id' => $service->service_id,
            'dog_id' => $dog->dog_id,
            'appointment_date' => nextOpenDay(),
            'appointment_time' => '09:00',
            ...bookingPayment($service),
        ])
        ->assertNotFound();

    expect(Appointment::query()->count())->toBe(0)
        ->and(Payment::query()->count())->toBe(0);
});

test('a booking cannot use a payment channel the clinic does not offer', function () {
    Storage::fake('public');

    $owner = DogOwner::factory()->create();
    $dog = Dog::factory()->create(['owner_id' => $owner->owner_id]);
    $service = Service::factory()->create(['duration_minutes' => 30, 'price' => '500.00']);

    $this->actingAs($owner)
        ->post(route('owner.appointments.store'), [
            'service_id' => $service->service_id,
            'dog_id' => $dog->dog_id,
            'appointment_date' => nextOpenDay(),
            'appointment_time' => '09:00',
            ...bookingPayment($service, '250.00', 'Bitcoin'),
        ])
        ->assertSessionHasErrors('payment_method');

    expect(Appointment::query()->count())->toBe(0)
        ->and(Payment::query()->count())->toBe(0);
});
