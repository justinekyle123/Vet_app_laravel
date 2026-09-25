<?php

use App\Models\Service;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('an admin can view the service menu', function () {
    Service::factory()->count(2)->create();
    Service::factory()->inactive()->create();

    $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.services.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Services')
            ->has('services', 3)
        );
});

test('an admin can add a service', function () {
    $this->actingAs(User::factory()->admin()->create())
        ->post(route('admin.services.store'), [
            'name' => 'Wellness consultation',
            'description' => 'A routine nose-to-tail check-up.',
            'duration_minutes' => 45,
            'price' => '65.00',
            'is_active' => true,
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('admin.services.index'));

    $service = Service::where('name', 'Wellness consultation')->firstOrFail();

    expect($service->duration_minutes)->toBe(45)
        ->and((float) $service->price)->toBe(65.0)
        ->and($service->is_active)->toBeTrue();
});

test('a service needs a name, a duration, and a price', function () {
    $this->actingAs(User::factory()->admin()->create())
        ->from(route('admin.services.index'))
        ->post(route('admin.services.store'), [])
        ->assertSessionHasErrors(['name', 'duration_minutes', 'price']);
});

test('a service name must be unique', function () {
    Service::factory()->create(['name' => 'Vaccination']);

    $this->actingAs(User::factory()->admin()->create())
        ->from(route('admin.services.index'))
        ->post(route('admin.services.store'), [
            'name' => 'Vaccination',
            'duration_minutes' => 15,
            'price' => '40',
        ])
        ->assertSessionHasErrors('name');
});

test('an admin can update a service', function () {
    $service = Service::factory()->create(['name' => 'Old name']);

    $this->actingAs(User::factory()->admin()->create())
        ->patch(route('admin.services.update', $service), [
            'name' => 'New name',
            'duration_minutes' => 45,
            'price' => '80',
            'is_active' => true,
        ])
        ->assertSessionHasNoErrors();

    expect($service->fresh()->name)->toBe('New name');
});

test('an admin can retire and restore a service', function () {
    $service = Service::factory()->create(['is_active' => true]);
    $admin = User::factory()->admin()->create();

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
    $this->actingAs(User::factory()->frontDesk()->create())
        ->get(route('admin.services.index'))
        ->assertForbidden();

    $this->actingAs(User::factory()->frontDesk()->create())
        ->post(route('admin.services.store'), [
            'name' => 'Sneaky service',
            'duration_minutes' => 30,
            'price' => '10',
        ])
        ->assertForbidden();
});
