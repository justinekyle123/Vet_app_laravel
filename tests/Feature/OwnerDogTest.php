<?php

use App\Models\Dog;
use App\Models\DogOwner;
use App\Models\Staff;

test('an owner can add a dog to their account', function () {
    $owner = DogOwner::factory()->create();

    $this->actingAs($owner)
        ->post(route('owner.dogs.store'), [
            'dog_name' => 'Rex',
            'sex' => 'Male',
            'color' => 'Brown',
            'is_vaccinated' => true,
            'is_active' => true,
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('owner.account.edit'));

    $dog = $owner->dogs()->firstOrFail();

    expect($dog->dog_name)->toBe('Rex')
        ->and($dog->color)->toBe('Brown')
        ->and($dog->sex)->toBe('Male')
        ->and($dog->is_vaccinated)->toBeTrue();
});

test('adding a dog requires a name and a sex', function () {
    $owner = DogOwner::factory()->create();

    $this->actingAs($owner)
        ->from(route('owner.account.edit'))
        ->post(route('owner.dogs.store'), [])
        ->assertSessionHasErrors(['dog_name', 'sex'])
        ->assertRedirect(route('owner.account.edit'));
});

test('an owner can edit their own dog', function () {
    $owner = DogOwner::factory()->create();
    $dog = Dog::factory()->create([
        'owner_id' => $owner->owner_id,
        'dog_name' => 'Rex',
    ]);

    $this->actingAs($owner)
        ->patch(route('owner.dogs.update', $dog), [
            'dog_name' => 'Rexy',
            'sex' => 'Male',
            'is_active' => true,
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('owner.account.edit'));

    expect($dog->fresh()->dog_name)->toBe('Rexy');
});

test('an owner cannot edit another owner\'s dog', function () {
    $dog = Dog::factory()->create(['dog_name' => 'Rex']);

    $this->actingAs(DogOwner::factory()->create())
        ->patch(route('owner.dogs.update', $dog), [
            'dog_name' => 'Stolen',
            'sex' => 'Male',
        ])
        ->assertForbidden();

    expect($dog->fresh()->dog_name)->not->toBe('Stolen');
});

test('staff cannot add dogs', function () {
    $this->actingAs(Staff::factory()->admin()->create())
        ->post(route('owner.dogs.store'), [
            'dog_name' => 'Rex',
            'sex' => 'Male',
        ])
        ->assertForbidden();
});
