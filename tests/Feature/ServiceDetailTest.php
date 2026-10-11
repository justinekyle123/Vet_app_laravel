<?php

use App\Models\Appointment;
use App\Models\AppointmentStatus;
use App\Models\Dog;
use App\Models\DogOwner;
use App\Models\RatingFeedback;
use App\Models\Service;
use App\Models\ServiceCategory;
use Inertia\Testing\AssertableInertia as Assert;

/*
 * One service in full: the page a client reads before they decide to book it.
 *
 * The rating is broken down rather than smoothed into a single number, and
 * every review behind it came from a visit the clinic actually carried out —
 * an average nobody can inspect is not something to base a booking on.
 */

/** A visit for the given owner, so a review has something to hang off. */
function detailVisit(
    DogOwner $owner,
    Service $service,
    string $statusName = 'Completed',
    ?string $date = null,
): Appointment {
    return Appointment::create([
        'owner_id' => $owner->owner_id,
        'dog_id' => Dog::factory()->create(['owner_id' => $owner->owner_id])->dog_id,
        'service_id' => $service->service_id,
        'appointment_date' => $date ?? today()->subDays(4)->toDateString(),
        'appointment_time' => '10:00:00',
        'status_id' => AppointmentStatus::firstOrCreate(['status_name' => $statusName])->status_id,
    ]);
}

/** One client's review of the given service, from its own visit. */
function detailReview(
    DogOwner $owner,
    Service $service,
    int $rating,
    ?string $comment = null,
    bool $published = true,
    ?string $date = null,
): RatingFeedback {
    return RatingFeedback::create([
        'appointment_id' => detailVisit($owner, $service, 'Completed', $date)->appointment_id,
        'owner_id' => $owner->owner_id,
        'rating' => $rating,
        'comment' => $comment,
        'is_published' => $published,
    ]);
}

test('a client can read a service in full', function () {
    $category = ServiceCategory::factory()->create(['category_name' => 'Grooming']);
    $service = Service::factory()->create([
        'category_id' => $category->category_id,
        'service_name' => 'Full Groom',
        'description' => 'Bath, trim, and nail care.',
        'duration_minutes' => 90,
    ]);

    $this->actingAs(DogOwner::factory()->create())
        ->get(route('owner.services.show', $service))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Owner/ServiceShow')
            ->where('service.id', $service->service_id)
            ->where('service.service_name', 'Full Groom')
            ->where('service.description', 'Bath, trim, and nail care.')
            ->where('service.category', 'Grooming')
            // The role names who the visit is booked against, so the page can
            // show the client the team members they may actually meet.
            ->where('service.provider_role', 'groomer')
            ->where('service.duration_minutes', 90)
            ->has('service.image')
            ->has('team')
            ->has('dogs')
            ->has('reviews.data', 0)
            ->where('service.rating', null)
            ->where('service.satisfied', null)
        );
});

test('the rating is broken down, not just averaged', function () {
    $service = Service::factory()->create();
    $clients = DogOwner::factory()->count(4)->create();

    // Two fives, one four, one one: a 3.8 average, with three of the four
    // clients happy with it.
    detailReview($clients[0], $service, 5, 'Gentle with our nervous dog.');
    detailReview($clients[1], $service, 5, 'Done in the time promised.');
    detailReview($clients[2], $service, 4);
    detailReview($clients[3], $service, 1, 'We waited a long time.');

    $this->actingAs(DogOwner::factory()->create())
        ->get(route('owner.services.show', $service))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('service.rating', 3.8)
            ->where('service.count', 4)
            ->where('service.rating_count', 4)
            ->where('service.distribution.5', 2)
            ->where('service.distribution.4', 1)
            ->where('service.distribution.3', 0)
            ->where('service.distribution.2', 0)
            ->where('service.distribution.1', 1)
            ->where('service.satisfied', 75)
            ->has('reviews.data', 4)
        );
});

test('a review the clinic has pulled moves nothing', function () {
    $service = Service::factory()->create();
    $client = DogOwner::factory()->create();

    detailReview($client, $service, 5, 'Lovely with Rex.');
    detailReview($client, $service, 1, 'Taken down after it was sorted out.', published: false);

    $this->actingAs(DogOwner::factory()->create())
        ->get(route('owner.services.show', $service))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('service.rating', fn ($rating): bool => (float) $rating === 5.0)
            ->where('service.count', 1)
            ->where('service.distribution.1', 0)
            ->where('service.satisfied', 100)
            ->has('reviews.data', 1)
            ->where('reviews.data.0.comment', 'Lovely with Rex.')
        );
});

test('reviews are listed newest first and paged in, not cut off', function () {
    $service = Service::factory()->create();
    $client = DogOwner::factory()->create();

    foreach (range(1, 7) as $number) {
        detailReview($client, $service, 5, "Review {$number}");
    }

    $this->actingAs(DogOwner::factory()->create())
        ->get(route('owner.services.show', $service))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('reviews.data', 5)
            ->where('reviews.total', 7)
            ->where('reviews.data.0.comment', 'Review 7')
        );

    // Asking for more reads the same ordering again from the top, so it can
    // never arrive out of order or with a gap.
    $this->actingAs(DogOwner::factory()->create())
        ->get(route('owner.services.show', [$service, 'reviews_per_page' => 8]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('reviews.data', 7)
            ->where('reviews.data.0.comment', 'Review 7')
            ->where('reviews.data.6.comment', 'Review 1')
        );
});

test('every review carries the visit it came from, under a shortened name', function () {
    $service = Service::factory()->create();
    $client = DogOwner::factory()->create([
        'first_name' => 'Mara',
        'last_name' => 'Lim',
    ]);

    $visitDate = today()->subDays(20)->toDateString();

    detailReview($client, $service, 4, 'Good visit.', date: $visitDate);

    $this->actingAs(DogOwner::factory()->create())
        ->get(route('owner.services.show', $service))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('reviews.data.0.visited_on', $visitDate)
            ->where('reviews.data.0.comment', 'Good visit.')
            // First name and an initial: never the client's full name.
            ->where('reviews.data.0.client', 'Mara L.')
        );
});

test('a retired service is not something to read about', function () {
    $service = Service::factory()->inactive()->create();

    $this->actingAs(DogOwner::factory()->create())
        ->get(route('owner.services.show', $service))
        ->assertNotFound();
});

test('related services come from the same category and never include itself', function () {
    $grooming = ServiceCategory::factory()->create(['category_name' => 'Grooming']);
    $visits = ServiceCategory::factory()->create(['category_name' => 'Visits']);

    $service = Service::factory()->create([
        'category_id' => $grooming->category_id,
        'service_name' => 'Full Groom',
    ]);

    Service::factory()->create([
        'category_id' => $grooming->category_id,
        'service_name' => 'Nail Trim',
    ]);
    Service::factory()->create([
        'category_id' => $grooming->category_id,
        'service_name' => 'Retired Trim',
        'is_active' => false,
    ]);
    Service::factory()->create([
        'category_id' => $visits->category_id,
        'service_name' => 'Booster',
    ]);

    $this->actingAs(DogOwner::factory()->create())
        ->get(route('owner.services.show', $service))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('related', 1)
            ->where('related.0.service_name', 'Nail Trim')
        );
});

test('the page only remembers the client\'s own completed visits', function () {
    $service = Service::factory()->create();
    $owner = DogOwner::factory()->create();
    $other = DogOwner::factory()->create();

    $theirs = today()->subDays(30)->toDateString();

    // The client's own completed visit, a cancelled request of theirs that must
    // not count, and a more recent visit that belongs to someone else.
    detailVisit($owner, $service, 'Completed', $theirs);
    detailVisit($owner, $service, 'Cancelled', today()->subDays(2)->toDateString());
    detailVisit($other, $service, 'Completed', today()->toDateString());

    $this->actingAs($owner)
        ->get(route('owner.services.show', $service))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('service.last_visit', $theirs)
        );
});
