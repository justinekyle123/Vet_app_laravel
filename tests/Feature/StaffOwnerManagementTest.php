<?php

use App\Models\Owner;
use App\Models\Pet;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('front desk staff can browse dog owners', function () {
    Owner::factory()->count(3)->create();

    $this->actingAs(User::factory()->frontDesk()->create())
        ->get(route('owners.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Staff/Owners/Index')
            ->has('owners.data', 3)
        );
});

test('the owners list can be filtered by status and search', function () {
    Owner::factory()->create(['first_name' => 'Active', 'last_name' => 'Client']);
    Owner::factory()->create(['first_name' => 'Gone', 'last_name' => 'Client', 'is_active' => false]);

    $this->actingAs(User::factory()->admin()->create())
        ->get(route('owners.index'))
        ->assertInertia(fn (Assert $page) => $page->has('owners.data', 1));

    $this->actingAs(User::factory()->admin()->create())
        ->get(route('owners.index', ['status' => 'all']))
        ->assertInertia(fn (Assert $page) => $page->has('owners.data', 2));

    $this->actingAs(User::factory()->admin()->create())
        ->get(route('owners.index', ['search' => 'Gone', 'status' => 'all']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('owners.data', 1)
            ->where('owners.data.0.first_name', 'Gone')
        );
});

test('dog owners cannot reach the staff owners area', function () {
    $this->actingAs(User::factory()->owner()->create())
        ->get(route('owners.index'))
        ->assertForbidden();
});

test('staff can create an owner record', function () {
    $this->actingAs(User::factory()->frontDesk()->create())
        ->post(route('owners.store'), [
            'first_name' => 'Jane',
            'last_name' => 'Doe',
            'email' => 'jane@example.com',
            'phone' => '5550100',
            'is_active' => true,
        ])
        ->assertSessionHasNoErrors();

    $owner = Owner::where('email', 'jane@example.com')->firstOrFail();

    expect($owner->first_name)->toBe('Jane')
        ->and($owner->is_active)->toBeTrue();
});

test('creating an owner requires a name', function () {
    $this->actingAs(User::factory()->frontDesk()->create())
        ->from(route('owners.create'))
        ->post(route('owners.store'), [])
        ->assertSessionHasErrors(['first_name', 'last_name']);
});

test('staff can view an owner with their pets', function () {
    $owner = Owner::factory()->create();
    Pet::factory()->for($owner)->create(['name' => 'Rex']);

    $this->actingAs(User::factory()->frontDesk()->create())
        ->get(route('owners.show', $owner))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Staff/Owners/Show')
            ->where('owner.id', $owner->id)
            ->has('pets', 1)
            ->where('pets.0.name', 'Rex')
        );
});

test('staff can update an owner', function () {
    $owner = Owner::factory()->create(['city' => 'Old Town']);

    $this->actingAs(User::factory()->frontDesk()->create())
        ->patch(route('owners.update', $owner), [
            'first_name' => $owner->first_name,
            'last_name' => $owner->last_name,
            'email' => $owner->email,
            'city' => 'New Town',
            'is_active' => true,
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('owners.show', $owner));

    expect($owner->fresh()->city)->toBe('New Town');
});

test('staff can deactivate and reactivate an owner', function () {
    $owner = Owner::factory()->create(['is_active' => true]);
    $staff = User::factory()->frontDesk()->create();

    $this->actingAs($staff)
        ->patch(route('owners.deactivate', $owner))
        ->assertSessionHasNoErrors();

    expect($owner->fresh()->is_active)->toBeFalse();

    $this->actingAs($staff)
        ->patch(route('owners.activate', $owner))
        ->assertSessionHasNoErrors();

    expect($owner->fresh()->is_active)->toBeTrue();
});
