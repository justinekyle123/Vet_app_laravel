<?php

use App\Models\Appointment;
use App\Models\AppointmentStatus;
use App\Models\ClinicInfo;
use App\Models\Dog;
use App\Models\DogOwner;
use App\Models\RatingFeedback;
use App\Models\Service;
use App\Models\Staff;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

/*
 * The landing page reads the clinic's own data, so a visitor sees the menu the
 * desk books from and the contact details the clinic maintains.
 */

test('the landing page lists the active services with their category', function () {
    $service = Service::factory()->create([
        'service_name' => 'Wellness Exam',
        'price' => 650,
        'duration_minutes' => 30,
    ]);
    Service::factory()->inactive()->create(['service_name' => 'Retired Service']);

    $this->get('/')->assertInertia(fn (Assert $page) => $page
        ->component('Welcome')
        ->where('canLogin', true)
        ->has('services', 1)
        ->where('services.0.service_name', 'Wellness Exam')
        ->where('services.0.category', $service->category->category_name)
        ->where('services.0.duration_minutes', 30)
        ->where('services.0.price', '650.00')
    );
});

test('the landing page carries the clinic details with trimmed times', function () {
    ClinicInfo::factory()->create([
        'clinic_name' => 'MyVet Animal Clinic',
        'contact_number' => '09170000000',
        'opening_time' => '08:00:00',
        'closing_time' => '18:00:00',
        'days_open' => 'Monday-Saturday',
    ]);

    $this->get('/')->assertInertia(fn (Assert $page) => $page
        ->component('Welcome')
        ->where('clinic.clinic_name', 'MyVet Animal Clinic')
        ->where('clinic.opening_time', '08:00')
        ->where('clinic.closing_time', '18:00')
        ->where('clinic.days_open', 'Monday-Saturday')
        ->where('clinic.contact_number', '09170000000')
    );
});

test('the landing page renders before any services exist', function () {
    $this->get('/')->assertInertia(fn (Assert $page) => $page
        ->component('Welcome')
        ->has('services', 0)
        ->where('clinic.clinic_name', 'MyVet Animal Clinic')
    );
});

/*
 * The headline numbers are counted from the clinic's records, not written
 * into the copy: a pet is counted once it has a completed visit, and the
 * rating is the average of what owners have actually published.
 */

test('the landing page counts the pets seen and averages published ratings', function () {
    $owner = DogOwner::factory()->create();
    $completed = AppointmentStatus::firstOrCreate(['status_name' => 'Completed'])->status_id;
    $cancelled = AppointmentStatus::firstOrCreate(['status_name' => 'Cancelled'])->status_id;

    $visit = function (Dog $dog, int $statusId) use ($owner): Appointment {
        return Appointment::create([
            'owner_id' => $owner->owner_id,
            'dog_id' => $dog->dog_id,
            'service_id' => Service::factory()->create(['duration_minutes' => 30])->service_id,
            'appointment_date' => '2026-10-06',
            'appointment_time' => '09:00',
            'status_id' => $statusId,
        ]);
    };

    $seen = Dog::factory()->create(['owner_id' => $owner->owner_id]);
    $alsoSeen = Dog::factory()->create(['owner_id' => $owner->owner_id]);
    $bookedOnly = Dog::factory()->create(['owner_id' => $owner->owner_id]);

    // The first dog is seen twice — still one pet cared for.
    $firstVisit = $visit($seen, $completed);
    $visit($seen, $completed);
    $secondVisit = $visit($alsoSeen, $completed);
    // This one was only ever booked, then cancelled, so it does not count.
    $cancelledVisit = $visit($bookedOnly, $cancelled);

    RatingFeedback::create([
        'appointment_id' => $firstVisit->appointment_id,
        'owner_id' => $owner->owner_id,
        'rating' => 5,
        'is_published' => true,
    ]);
    RatingFeedback::create([
        'appointment_id' => $secondVisit->appointment_id,
        'owner_id' => $owner->owner_id,
        'rating' => 4,
        'is_published' => true,
    ]);
    // An unpublished draft must not move the average or the count.
    RatingFeedback::create([
        'appointment_id' => $cancelledVisit->appointment_id,
        'owner_id' => $owner->owner_id,
        'rating' => 1,
        'is_published' => false,
    ]);

    $this->get('/')->assertInertia(fn (Assert $page) => $page
        ->component('Welcome')
        ->where('stats.pets_cared_for', 2)
        ->where('stats.rating', 4.5)
        ->where('stats.rating_count', 2)
    );
});

test('the seeded history gives the landing page real numbers to show', function () {
    $this->seed();

    $this->get('/')->assertInertia(fn (Assert $page) => $page
        ->component('Welcome')
        ->where('stats.pets_cared_for', 26)
        ->where('stats.rating', 4.6)
        ->where('stats.rating_count', 25)
    );
});

test('the landing page reports no rating before any is published', function () {
    $this->get('/')->assertInertia(fn (Assert $page) => $page
        ->component('Welcome')
        ->where('stats.pets_cared_for', 0)
        ->where('stats.rating', null)
        ->where('stats.rating_count', 0)
    );
});

/*
 * Photographs: a service or staff row stores either a path on the public disk
 * or a full URL, and the page renders whatever it resolves to.
 */

test('an image path resolves to a url and an empty one stays null', function () {
    $service = Service::factory()->create(['image_path' => null]);

    expect($service->imageUrl())->toBeNull();

    $service->image_path = 'services/wellness-exam.jpg';
    expect($service->imageUrl())->toBe(
        Storage::disk('public')->url('services/wellness-exam.jpg'),
    );

    $service->image_path = 'https://cdn.test/wellness-exam.jpg';
    expect($service->imageUrl())->toBe('https://cdn.test/wellness-exam.jpg');
});

test('the landing page carries a photo for services and the care team', function () {
    Service::factory()->create(['image_path' => 'https://cdn.test/groom.jpg']);

    Staff::factory()->veterinarian()->create([
        'first_name' => 'Clara',
        'last_name' => 'Mendoza',
        'specialization' => 'Internal medicine',
        'image_path' => 'staff/clara.jpg',
    ]);
    // Administrators are not part of the client-facing care team.
    Staff::factory()->admin()->create();

    $this->get('/')->assertInertia(fn (Assert $page) => $page
        ->component('Welcome')
        ->where('services.0.image', 'https://cdn.test/groom.jpg')
        ->has('team', 1)
        ->where('team.0.name', 'Clara Mendoza')
        ->where('team.0.role', 'Veterinarian')
        ->where('team.0.specialization', 'Internal medicine')
        ->where('team.0.image', Storage::disk('public')->url('staff/clara.jpg'))
    );
});

/*
 * The seeded menu backs the landing page's service grid, so it has to stay
 * deep enough to fill the featured row and to have something left over for
 * "view all services".
 */

test('the seeder fills the menu with eight or more distinct services', function () {
    $this->seed();

    $services = Service::query()->where('is_active', true)->get();

    expect($services->count())->toBeGreaterThanOrEqual(8)
        ->and($services->pluck('service_name')->unique()->count())
        ->toBe($services->count())
        ->and($services->pluck('category_id')->unique()->count())->toBe(5);
});

test('the landing page menu is grouped by category', function () {
    $this->seed();

    $menuCount = Service::query()->where('is_active', true)->count();

    $this->get('/')->assertInertia(fn (Assert $page) => $page
        ->component('Welcome')
        ->has('services', $menuCount)
        ->where('services.0.category', 'Consultation')
        ->where('services.0.service_name', 'Wellness Exam')
    );
});

test('the seeded care team is every client-facing member, vets first', function () {
    $this->seed();

    $this->get('/')->assertInertia(fn (Assert $page) => $page
        ->component('Welcome')
        ->has('team', 4)
        ->where('team.0.name', 'Clara Mendoza')
        ->where('team.0.role', 'Veterinarian')
        ->where('team.1.role', 'Veterinarian')
        ->where('team.2.role', 'Groomer')
        ->where('team.3.role', 'Front Desk')
        ->where('team.0.image', 'https://picsum.photos/seed/myvet-mendoza/600/800.jpg')
    );
});
