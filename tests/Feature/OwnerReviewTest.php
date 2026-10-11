<?php

use App\Models\Appointment;
use App\Models\AppointmentStatus;
use App\Models\Dog;
use App\Models\DogOwner;
use App\Models\RatingFeedback;
use App\Models\Service;
use App\Models\ServiceCategory;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * A visit for the owner against the given service, in the given state.
 */
function reviewVisit(
    DogOwner $owner,
    Service $service,
    string $statusName = 'Completed',
    ?Dog $dog = null,
): Appointment {
    return Appointment::create([
        'owner_id' => $owner->owner_id,
        'dog_id' => ($dog ?? Dog::factory()->create(['owner_id' => $owner->owner_id]))->dog_id,
        'service_id' => $service->service_id,
        'appointment_date' => today()->subDays(3)->toDateString(),
        'appointment_time' => '10:00:00',
        'status_id' => AppointmentStatus::firstOrCreate(['status_name' => $statusName])->status_id,
    ]);
}

test('an owner can rate a completed visit', function () {
    $owner = DogOwner::factory()->create();
    $visit = reviewVisit($owner, Service::factory()->create());

    $this->actingAs($owner)
        ->post(route('owner.appointments.review', $visit), [
            'rating' => 5,
            'comment' => 'The vet explained everything and Rex stayed calm.',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('owner.appointments.index'));

    $review = RatingFeedback::where('appointment_id', $visit->appointment_id)->firstOrFail();

    expect($review->rating)->toBe(5)
        ->and($review->comment)->toBe('The vet explained everything and Rex stayed calm.')
        ->and($review->owner_id)->toBe($owner->owner_id)
        ->and($review->is_published)->toBeTrue();
});

test('a rating is required and must be between one and five', function () {
    $owner = DogOwner::factory()->create();
    $visit = reviewVisit($owner, Service::factory()->create());

    $this->actingAs($owner)
        ->from(route('owner.appointments.index'))
        ->post(route('owner.appointments.review', $visit), ['rating' => 0])
        ->assertSessionHasErrors('rating');

    $this->actingAs($owner)
        ->from(route('owner.appointments.index'))
        ->post(route('owner.appointments.review', $visit), ['rating' => 6])
        ->assertSessionHasErrors('rating');

    $this->actingAs($owner)
        ->from(route('owner.appointments.index'))
        ->post(route('owner.appointments.review', $visit), [])
        ->assertSessionHasErrors('rating');

    expect(RatingFeedback::count())->toBe(0);
});

test('a star rating without a written comment is accepted', function () {
    $owner = DogOwner::factory()->create();
    $visit = reviewVisit($owner, Service::factory()->create());

    $this->actingAs($owner)
        ->post(route('owner.appointments.review', $visit), ['rating' => 4])
        ->assertSessionHasNoErrors();

    expect(RatingFeedback::first()->comment)->toBeNull();
});

test('only a completed visit can be reviewed', function () {
    $owner = DogOwner::factory()->create();
    $visit = reviewVisit($owner, Service::factory()->create(), 'Confirmed');

    $this->actingAs($owner)
        ->from(route('owner.appointments.index'))
        ->post(route('owner.appointments.review', $visit), ['rating' => 5])
        ->assertSessionHasErrors('rating');

    expect(RatingFeedback::count())->toBe(0);
});

test('a visit can only be reviewed once', function () {
    $owner = DogOwner::factory()->create();
    $visit = reviewVisit($owner, Service::factory()->create());

    RatingFeedback::create([
        'appointment_id' => $visit->appointment_id,
        'owner_id' => $owner->owner_id,
        'rating' => 3,
    ]);

    $this->actingAs($owner)
        ->from(route('owner.appointments.index'))
        ->post(route('owner.appointments.review', $visit), ['rating' => 5])
        ->assertSessionHasErrors('rating');

    expect(RatingFeedback::count())->toBe(1)
        ->and(RatingFeedback::first()->rating)->toBe(3);
});

test('an owner cannot review another client\'s visit', function () {
    $owner = DogOwner::factory()->create();
    $other = DogOwner::factory()->create();
    $visit = reviewVisit($other, Service::factory()->create());

    $this->actingAs($owner)
        ->post(route('owner.appointments.review', $visit), ['rating' => 5])
        ->assertNotFound();

    expect(RatingFeedback::count())->toBe(0);
});

test('the appointments page offers a review on an unrated visit', function () {
    $owner = DogOwner::factory()->create();
    $rated = reviewVisit($owner, Service::factory()->create());
    RatingFeedback::create([
        'appointment_id' => $rated->appointment_id,
        'owner_id' => $owner->owner_id,
        'rating' => 4,
        'comment' => 'Very gentle with him.',
    ]);
    $unrated = reviewVisit($owner, Service::factory()->create());

    $this->actingAs($owner)
        ->get(route('owner.appointments.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Owner/Appointments')
            ->has('past', 2)
            ->where('summary.awaiting_review', 1)
            ->where('summary.completed', 2)
            ->where(
                'past',
                fn ($past) => collect($past)->firstWhere('id', $unrated->appointment_id)['reviewable'] === true
                    && collect($past)->firstWhere('id', $rated->appointment_id)['reviewable'] === false
                    && collect($past)->firstWhere('id', $rated->appointment_id)['feedback']['rating'] === 4,
            )
        );
});

test('a visit that is no longer going ahead is history, not upcoming', function () {
    $owner = DogOwner::factory()->create();
    $service = Service::factory()->create();
    $kept = reviewVisit($owner, $service, 'Confirmed');
    $kept->update(['appointment_date' => today()->addWeek()->toDateString()]);
    $calledOff = reviewVisit($owner, $service, 'Cancelled');
    $calledOff->update(['appointment_date' => today()->addWeek()->toDateString()]);

    $this->actingAs($owner)
        ->get(route('owner.appointments.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('upcoming', 1)
            ->where('upcoming.0.id', $kept->appointment_id)
            ->has('past', 1)
            ->where('past.0.id', $calledOff->appointment_id)
            ->where('summary.upcoming', 1)
            ->where('summary.cancelled', 1)
        );
});

test('the history list can be filtered to completed or cancelled visits', function () {
    $owner = DogOwner::factory()->create();
    $service = Service::factory()->create();
    $completed = reviewVisit($owner, $service, 'Completed');
    $cancelled = reviewVisit($owner, $service, 'Cancelled');

    $this->actingAs($owner)
        ->get(route('owner.appointments.index', ['history' => 'completed']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('past', 1)
            ->where('past.0.id', $completed->appointment_id)
            ->where('historyFilter', 'completed')
        );

    $this->actingAs($owner)
        ->get(route('owner.appointments.index', ['history' => 'cancelled']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('past', 1)
            ->where('past.0.id', $cancelled->appointment_id)
            ->where('historyFilter', 'cancelled')
        );

    // An unknown filter falls back to showing the whole record.
    $this->actingAs($owner)
        ->get(route('owner.appointments.index', ['history' => 'nonsense']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('past', 2)
            ->where('historyFilter', 'all')
        );
});

test('a service shows the average of its published reviews only', function () {
    $category = ServiceCategory::factory()->create(['category_name' => 'Consultation']);
    $service = Service::factory()->create(['category_id' => $category->category_id]);

    $first = DogOwner::factory()->create(['first_name' => 'Kevin', 'last_name' => 'Ortiz']);
    $second = DogOwner::factory()->create(['first_name' => 'Mara', 'last_name' => 'Lim']);

    RatingFeedback::create([
        'appointment_id' => reviewVisit($first, $service)->appointment_id,
        'owner_id' => $first->owner_id,
        'rating' => 4,
        'comment' => 'Quick and thorough.',
        'is_published' => true,
    ]);

    RatingFeedback::create([
        'appointment_id' => reviewVisit($second, $service)->appointment_id,
        'owner_id' => $second->owner_id,
        'rating' => 5,
        'comment' => 'Wonderful with our anxious dog.',
        'is_published' => true,
    ]);

    // A draft the clinic has taken down must not move the average, and must
    // not reach another client's menu.
    RatingFeedback::create([
        'appointment_id' => reviewVisit($second, $service)->appointment_id,
        'owner_id' => $second->owner_id,
        'rating' => 1,
        'comment' => 'Unpublished draft.',
        'is_published' => false,
    ]);

    $this->actingAs(DogOwner::factory()->create())
        ->get(route('owner.services.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('categories.0.services.0.rating', 4.5)
            ->where('categories.0.services.0.rating_count', 2)
            ->has('categories.0.services.0.reviews', 2)
            ->where('categories.0.services.0.reviews.0.client', 'Mara L.')
        );
});

test('a service with no reviews reports no rating rather than zero stars', function () {
    $category = ServiceCategory::factory()->create(['category_name' => 'Grooming']);
    Service::factory()->create(['category_id' => $category->category_id]);

    $this->actingAs(DogOwner::factory()->create())
        ->get(route('owner.services.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('categories.0.services.0.rating', null)
            ->where('categories.0.services.0.rating_count', 0)
            ->has('categories.0.services.0.reviews', 0)
        );
});
