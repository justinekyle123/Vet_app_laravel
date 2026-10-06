<?php

use App\Models\Appointment;
use App\Models\AppointmentStatus;
use App\Models\Dog;
use App\Models\DogOwner;
use App\Models\Faq;
use App\Models\FaqCategory;
use App\Models\Notification;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\Staff;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * Books a visit for the owner. The lookups the schema insists on are created on
 * demand, so each test only states the part it actually cares about.
 */
function bookPortalVisit(
    DogOwner $owner,
    Dog $dog,
    string $date,
    string $statusName = 'Confirmed',
): Appointment {
    return Appointment::create([
        'owner_id' => $owner->owner_id,
        'dog_id' => $dog->dog_id,
        'service_id' => Service::factory()->create()->service_id,
        'appointment_date' => $date,
        'appointment_time' => '10:00:00',
        'status_id' => AppointmentStatus::firstOrCreate(['status_name' => $statusName])->status_id,
    ]);
}

test('the portal home lists the owner\'s dogs and next visits', function () {
    $owner = DogOwner::factory()->create();
    $dog = Dog::factory()->create([
        'owner_id' => $owner->owner_id,
        'dog_name' => 'Rex',
    ]);

    bookPortalVisit($owner, $dog, today()->addDays(2)->toDateString());
    bookPortalVisit($owner, $dog, today()->subWeeks(3)->toDateString(), 'Completed');

    $this->actingAs($owner)
        ->get(route('owner.dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Owner/Dashboard')
            ->has('dogs', 1)
            ->where('dogs.0.dog_name', 'Rex')
            ->has('upcoming', 1)
            ->where('upcoming.0.status', 'Confirmed')
            ->where('stats.dogs', 1)
            ->where('stats.upcoming', 1)
        );
});

test('the portal home previews only the next three visits', function () {
    $owner = DogOwner::factory()->create();
    $dog = Dog::factory()->create(['owner_id' => $owner->owner_id]);

    foreach (range(1, 4) as $days) {
        bookPortalVisit($owner, $dog, today()->addDays($days)->toDateString());
    }

    $this->actingAs($owner)
        ->get(route('owner.dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('upcoming', 3)
            ->where('stats.upcoming', 3)
        );
});

test('the services page groups the active menu by category', function () {
    $category = ServiceCategory::factory()->create(['category_name' => 'Vaccination']);
    Service::factory()->create([
        'category_id' => $category->category_id,
        'service_name' => 'Core Booster',
        'image_path' => 'services/core-booster.jpg',
    ]);
    Service::factory()->inactive()->create([
        'category_id' => $category->category_id,
        'service_name' => 'Retired Procedure',
    ]);

    $this->actingAs(DogOwner::factory()->create())
        ->get(route('owner.services.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Owner/Services')
            ->has('categories', 1)
            ->where('categories.0.name', 'Vaccination')
            ->has('categories.0.services', 1)
            ->where('categories.0.services.0.service_name', 'Core Booster')
            ->where(
                'categories.0.services.0.image',
                Storage::disk('public')->url('services/core-booster.jpg'),
            )
        );
});

test('the appointments page splits upcoming from past and hides other owners', function () {
    $owner = DogOwner::factory()->create();
    $dog = Dog::factory()->create(['owner_id' => $owner->owner_id]);

    bookPortalVisit($owner, $dog, today()->addDays(3)->toDateString());
    bookPortalVisit($owner, $dog, today()->subDays(3)->toDateString(), 'Completed');

    $other = DogOwner::factory()->create();
    bookPortalVisit(
        $other,
        Dog::factory()->create(['owner_id' => $other->owner_id]),
        today()->addDay()->toDateString(),
    );

    $this->actingAs($owner)
        ->get(route('owner.appointments.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Owner/Appointments')
            ->has('upcoming', 1)
            ->has('past', 1)
            ->where('past.0.status', 'Completed')
        );
});

test('an owner can cancel their own upcoming visit', function () {
    $owner = DogOwner::factory()->create();
    $dog = Dog::factory()->create(['owner_id' => $owner->owner_id]);
    $visit = bookPortalVisit($owner, $dog, today()->addDays(2)->toDateString(), 'Confirmed');

    $this->actingAs($owner)
        ->patch(route('owner.appointments.cancel', $visit))
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('owner.appointments.index'));

    expect($visit->fresh()->status->status_name)->toBe('Cancelled');
});

test('an owner cannot cancel another client\'s visit', function () {
    $owner = DogOwner::factory()->create();
    $other = DogOwner::factory()->create();
    $visit = bookPortalVisit(
        $other,
        Dog::factory()->create(['owner_id' => $other->owner_id]),
        today()->addDay()->toDateString(),
    );

    $this->actingAs($owner)
        ->patch(route('owner.appointments.cancel', $visit))
        ->assertNotFound();

    // The other client's booking is untouched.
    expect($visit->fresh()->status->status_name)->toBe('Confirmed');
});

test('a completed visit cannot be cancelled', function () {
    $owner = DogOwner::factory()->create();
    $dog = Dog::factory()->create(['owner_id' => $owner->owner_id]);
    $visit = bookPortalVisit($owner, $dog, today()->subDays(2)->toDateString(), 'Completed');

    $this->actingAs($owner)
        ->patch(route('owner.appointments.cancel', $visit))
        ->assertSessionHasErrors('appointment');

    expect($visit->fresh()->status->status_name)->toBe('Completed');
});

test('the FAQ endpoint returns only published questions, grouped by category', function () {
    $bookings = FaqCategory::create(['category_name' => 'Bookings']);
    Faq::create([
        'faq_category_id' => $bookings->faq_category_id,
        'question' => 'Can I cancel a booking?',
        'answer' => 'Yes, from your appointments page.',
        'is_published' => true,
    ]);
    Faq::create([
        'faq_category_id' => $bookings->faq_category_id,
        'question' => 'Unpublished draft',
        'answer' => 'Hidden.',
        'is_published' => false,
    ]);
    // A category with nothing published is dropped rather than shown empty.
    FaqCategory::create(['category_name' => 'Empty']);

    $this->actingAs(DogOwner::factory()->create())
        ->getJson(route('owner.faqs'))
        ->assertOk()
        ->assertJsonCount(1, 'categories')
        ->assertJsonPath('categories.0.name', 'Bookings')
        ->assertJsonCount(1, 'categories.0.faqs')
        ->assertJsonPath('categories.0.faqs.0.question', 'Can I cancel a booking?');
});

test('the portal search only matches the owner\'s own dogs', function () {
    $owner = DogOwner::factory()->create();
    Dog::factory()->create([
        'owner_id' => $owner->owner_id,
        'dog_name' => 'Rex',
    ]);

    // A different client's dog with a matching name must stay out of reach.
    $other = DogOwner::factory()->create();
    Dog::factory()->create([
        'owner_id' => $other->owner_id,
        'dog_name' => 'Rex',
    ]);

    $this->actingAs($owner)
        ->getJson(route('owner.search', ['q' => 'rex']))
        ->assertOk()
        ->assertJsonCount(1, 'dogs')
        ->assertJsonPath('dogs.0.label', 'Rex')
        ->assertJsonPath('dogs.0.href', route('owner.account.edit'))
        ->assertJsonCount(0, 'appointments');
});

test('the portal search matches the clinic\'s services', function () {
    Service::factory()->create(['service_name' => 'Vaccination Booster']);

    $this->actingAs(DogOwner::factory()->create())
        ->getJson(route('owner.search', ['q' => 'vacc']))
        ->assertOk()
        ->assertJsonCount(1, 'services')
        ->assertJsonPath('services.0.label', 'Vaccination Booster');
});

test('the portal search ignores terms that are too short', function () {
    Dog::factory()->create(['dog_name' => 'Rex']);

    $this->actingAs(DogOwner::factory()->create())
        ->getJson(route('owner.search', ['q' => 'r']))
        ->assertOk()
        ->assertJson(['dogs' => [], 'appointments' => [], 'services' => []]);
});

test('the portal bell counts the owner\'s unread notifications and clears them', function () {
    $owner = DogOwner::factory()->create();

    foreach (['SMS' => 'Booster due soon', 'Email' => 'Welcome to MyVet'] as $channel => $message) {
        Notification::create([
            'owner_id' => $owner->owner_id,
            'channel' => $channel,
            'message' => $message,
            'status' => 'Sent',
        ]);
    }

    // Another client's feed must not inflate the badge.
    Notification::create([
        'owner_id' => DogOwner::factory()->create()->owner_id,
        'channel' => 'SMS',
        'message' => 'Not yours',
        'status' => 'Sent',
    ]);

    $this->actingAs($owner)
        ->get(route('owner.dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('portal.notifications', 2)
            ->where('portal.unreadNotifications', 2)
        );

    $this->actingAs($owner)
        ->patch(route('owner.notifications.read'))
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    $this->actingAs($owner)
        ->get(route('owner.dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('portal.unreadNotifications', 0)
            ->has('portal.notifications', 2)
        );
});

test('staff cannot reach the owner portal', function () {
    foreach (['admin', 'frontDesk', 'veterinarian'] as $state) {
        $this->actingAs(Staff::factory()->{$state}()->create())
            ->get(route('owner.dashboard'))
            ->assertForbidden();
    }
});
