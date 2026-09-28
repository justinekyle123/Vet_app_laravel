<?php

use App\Models\Dog;
use App\Models\DogOwner;
use App\Models\Staff;
use Inertia\Testing\AssertableInertia as Assert;

test('registration creates a client record', function () {
    $this->post('/register', [
        'name' => 'Jane Doe',
        'email' => 'jane@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $owner = DogOwner::where('email', 'jane@example.com')->firstOrFail();

    expect($owner->first_name)->toBe('Jane')
        ->and($owner->last_name)->toBe('Doe')
        ->and($owner->email)->toBe('jane@example.com');
});

test('an owner can view their account page with dogs', function () {
    $owner = DogOwner::factory()->create();
    Dog::factory()->create([
        'owner_id' => $owner->owner_id,
        'dog_name' => 'Rex',
    ]);

    $this->actingAs($owner)
        ->get(route('owner.account.edit'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Owner/Account')
            ->where('owner.email', $owner->email)
            ->has('dogs', 1)
            ->where('dogs.0.dog_name', 'Rex')
        );
});

test('an owner can update their contact details', function () {
    $owner = DogOwner::factory()->create();

    $this->actingAs($owner)
        ->patch(route('owner.account.update'), [
            'first_name' => 'Jane',
            'last_name' => 'Doe',
            'email' => 'jane@example.com',
            'phone_number' => '5550100',
            'address' => '1 Clinic Road',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('owner.account.edit'));

    $owner->refresh();

    expect($owner->first_name)->toBe('Jane')
        ->and($owner->last_name)->toBe('Doe')
        ->and($owner->phone_number)->toBe('5550100')
        ->and($owner->address)->toBe('1 Clinic Road')
        ->and($owner->email)->toBe('jane@example.com');
});

test('staff cannot reach the owner account page', function () {
    foreach (['admin', 'frontDesk'] as $state) {
        $this->actingAs(Staff::factory()->{$state}()->create())
            ->get(route('owner.account.edit'))
            ->assertForbidden();
    }
});

test('the account email must stay unique across both account tables', function () {
    Staff::factory()->create(['email' => 'taken@example.com']);

    $owner = DogOwner::factory()->create();

    $this->actingAs($owner)
        ->from(route('owner.account.edit'))
        ->patch(route('owner.account.update'), [
            'first_name' => 'Jane',
            'last_name' => 'Doe',
            'email' => 'taken@example.com',
            'phone_number' => '5550100',
        ])
        ->assertSessionHasErrors('email')
        ->assertRedirect(route('owner.account.edit'));
});
