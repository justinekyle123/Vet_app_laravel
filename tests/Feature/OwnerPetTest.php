<?php

use App\Models\Owner;
use App\Models\Pet;
use App\Models\User;

test('an owner can add a pet to their account', function () {
    $user = User::factory()->owner()->create();
    $owner = Owner::provisionFor($user);

    $this->actingAs($user)
        ->post(route('owner.pets.store'), [
            'name' => 'Rex',
            'species' => 'Dog',
            'breed' => 'Labrador',
            'sex' => 'male',
            'weight_kg' => 24.5,
            'is_neutered' => true,
            'is_active' => true,
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('owner.account.edit'));

    $pet = $owner->pets()->firstOrFail();

    expect($pet->name)->toBe('Rex')
        ->and($pet->breed)->toBe('Labrador')
        ->and($pet->sex)->toBe('male');
});

test('adding a pet requires a name and species', function () {
    $user = User::factory()->owner()->create();
    Owner::provisionFor($user);

    $this->actingAs($user)
        ->from(route('owner.account.edit'))
        ->post(route('owner.pets.store'), [])
        ->assertSessionHasErrors(['name', 'species'])
        ->assertRedirect(route('owner.account.edit'));
});

test('an owner can edit their own pet', function () {
    $user = User::factory()->owner()->create();
    $owner = Owner::provisionFor($user);
    $pet = Pet::factory()->for($owner)->create(['name' => 'Rex']);

    $this->actingAs($user)
        ->patch(route('owner.pets.update', $pet), [
            'name' => 'Rexy',
            'species' => 'Dog',
            'is_active' => true,
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('owner.account.edit'));

    expect($pet->fresh()->name)->toBe('Rexy');
});

test('an owner cannot edit another owner\'s pet', function () {
    $pet = Pet::factory()->create();

    $this->actingAs(User::factory()->owner()->create())
        ->patch(route('owner.pets.update', $pet), [
            'name' => 'Stolen',
            'species' => 'Dog',
        ])
        ->assertForbidden();

    expect($pet->fresh()->name)->not->toBe('Stolen');
});

test('staff cannot add pets', function () {
    $this->actingAs(User::factory()->admin()->create())
        ->post(route('owner.pets.store'), [
            'name' => 'Rex',
            'species' => 'Dog',
        ])
        ->assertForbidden();
});
