<?php

use App\Models\Owner;
use App\Models\Pet;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('registration creates a linked owner record', function () {
    $this->post('/register', [
        'name' => 'Jane Doe',
        'email' => 'jane@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $user = User::where('email', 'jane@example.com')->firstOrFail();
    $owner = Owner::where('user_id', $user->id)->firstOrFail();

    expect($owner->first_name)->toBe('Jane')
        ->and($owner->last_name)->toBe('Doe')
        ->and($owner->email)->toBe('jane@example.com');
});

test('an owner can view their account page with pets', function () {
    $user = User::factory()->owner()->create();
    $owner = Owner::provisionFor($user);
    Pet::factory()->for($owner)->create(['name' => 'Rex']);

    $this->actingAs($user)
        ->get(route('owner.account.edit'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Owner/Account')
            ->where('owner.email', $user->email)
            ->has('pets', 1)
            ->where('pets.0.name', 'Rex')
        );
});

test('an owner can update their contact details', function () {
    $user = User::factory()->owner()->create(['name' => 'Old Name']);
    $owner = Owner::provisionFor($user);

    $this->actingAs($user)
        ->patch(route('owner.account.update'), [
            'first_name' => 'Jane',
            'last_name' => 'Doe',
            'email' => 'jane@example.com',
            'phone' => '5550100',
            'alternate_phone' => '',
            'address' => '1 Clinic Road',
            'city' => 'Springfield',
            'postal_code' => '12345',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('owner.account.edit'));

    $owner->refresh();
    $user->refresh();

    expect($owner->first_name)->toBe('Jane')
        ->and($owner->last_name)->toBe('Doe')
        ->and($owner->phone)->toBe('5550100')
        ->and($owner->city)->toBe('Springfield')
        ->and($user->name)->toBe('Jane Doe')
        ->and($user->email)->toBe('jane@example.com')
        ->and($user->email_verified_at)->toBeNull();
});

test('staff cannot reach the owner account page', function () {
    foreach (['admin', 'frontDesk'] as $state) {
        $this->actingAs(User::factory()->{$state}()->create())
            ->get(route('owner.account.edit'))
            ->assertForbidden();
    }
});

test('the account email must stay unique across accounts', function () {
    User::factory()->create(['email' => 'taken@example.com']);

    $user = User::factory()->owner()->create();
    Owner::provisionFor($user);

    $this->actingAs($user)
        ->from(route('owner.account.edit'))
        ->patch(route('owner.account.update'), [
            'first_name' => 'Jane',
            'last_name' => 'Doe',
            'email' => 'taken@example.com',
        ])
        ->assertSessionHasErrors('email')
        ->assertRedirect(route('owner.account.edit'));
});
