<?php

use App\Models\Dog;
use App\Models\DogOwner;
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

test('staff can update an owner', function () {
    $owner = DogOwner::factory()->create(['address' => 'Old Town']);

    $this->actingAs(Staff::factory()->admin()->create())
        ->patch(route('owners.update', $owner), [
            'first_name' => $owner->first_name,
            'last_name' => $owner->last_name,
            'email' => $owner->email,
            'phone_number' => $owner->phone_number,
            'address' => 'New Town',
            'is_active' => true,
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('owners.show', $owner));

    expect($owner->fresh()->address)->toBe('New Town');
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
