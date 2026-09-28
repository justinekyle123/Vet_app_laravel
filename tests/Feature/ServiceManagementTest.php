<?php

use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\Staff;
use Inertia\Testing\AssertableInertia as Assert;

test('an admin can view the service menu', function () {
    Service::factory()->count(2)->create();
    Service::factory()->inactive()->create();

    $this->actingAs(Staff::factory()->admin()->create())
        ->get(route('admin.services.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Services')
            ->has('services', 3)
            ->has('categories')
        );
});

test('an admin can add a service', function () {
    $category = ServiceCategory::factory()->create();

    $this->actingAs(Staff::factory()->admin()->create())
        ->post(route('admin.services.store'), [
            'service_name' => 'Wellness consultation',
            'category_id' => $category->category_id,
            'description' => 'A routine nose-to-tail check-up.',
            'duration_minutes' => 45,
            'price' => '65.00',
            'is_active' => true,
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('admin.services.index'));

    $service = Service::where('service_name', 'Wellness consultation')->firstOrFail();

    expect($service->duration_minutes)->toBe(45)
        ->and((float) $service->price)->toBe(65.0)
        ->and($service->category_id)->toBe($category->category_id)
        ->and($service->is_active)->toBeTrue();
});

test('a service needs a name, a category, a duration, and a price', function () {
    $this->actingAs(Staff::factory()->admin()->create())
        ->from(route('admin.services.index'))
        ->post(route('admin.services.store'), [])
        ->assertSessionHasErrors([
            'service_name',
            'category_id',
            'duration_minutes',
            'price',
        ]);
});

test('a service name must be unique', function () {
    Service::factory()->create(['service_name' => 'Vaccination']);

    $this->actingAs(Staff::factory()->admin()->create())
        ->from(route('admin.services.index'))
        ->post(route('admin.services.store'), [
            'service_name' => 'Vaccination',
            'category_id' => ServiceCategory::factory()->create()->category_id,
            'duration_minutes' => 15,
            'price' => '40',
        ])
        ->assertSessionHasErrors('service_name');
});

test('an admin can update a service', function () {
    $service = Service::factory()->create(['service_name' => 'Old name']);

    $this->actingAs(Staff::factory()->admin()->create())
        ->patch(route('admin.services.update', $service), [
            'service_name' => 'New name',
            'category_id' => $service->category_id,
            'duration_minutes' => 45,
            'price' => '80',
            'is_active' => true,
        ])
        ->assertSessionHasNoErrors();

    expect($service->fresh()->service_name)->toBe('New name');
});

test('an admin can retire and restore a service', function () {
    $service = Service::factory()->create(['is_active' => true]);
    $admin = Staff::factory()->admin()->create();

    $this->actingAs($admin)
        ->patch(route('admin.services.toggle', $service))
        ->assertSessionHasNoErrors();

    expect($service->fresh()->is_active)->toBeFalse();

    $this->actingAs($admin)
        ->patch(route('admin.services.toggle', $service))
        ->assertSessionHasNoErrors();

    expect($service->fresh()->is_active)->toBeTrue();
});

test('front desk staff cannot manage services', function () {
    $this->actingAs(Staff::factory()->frontDesk()->create())
        ->get(route('admin.services.index'))
        ->assertForbidden();

    $this->actingAs(Staff::factory()->frontDesk()->create())
        ->post(route('admin.services.store'), [
            'service_name' => 'Sneaky service',
            'category_id' => ServiceCategory::factory()->create()->category_id,
            'duration_minutes' => 30,
            'price' => '10',
        ])
        ->assertForbidden();
});
