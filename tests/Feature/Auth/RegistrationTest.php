<?php

use App\Models\DogOwner;
use App\Models\Staff;

test('registration screen can be rendered', function () {
    $response = $this->get('/register');

    $response->assertStatus(200);
});

test('new owners can register', function () {
    $response = $this->post('/register', [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $this->assertAuthenticated();

    $owner = DogOwner::where('email', 'test@example.com')->firstOrFail();

    expect($owner->first_name)->toBe('Test')
        ->and($owner->last_name)->toBe('User');
});

test('an address already used by staff cannot register again', function () {
    Staff::factory()->create(['email' => 'taken@example.com']);

    $this->from('/register')->post('/register', [
        'name' => 'Test User',
        'email' => 'taken@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ])->assertSessionHasErrors('email');
});
