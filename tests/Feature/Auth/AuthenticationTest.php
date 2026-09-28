<?php

use App\Models\DogOwner;
use App\Models\Staff;

test('login screen can be rendered', function () {
    $response = $this->get('/login');

    $response->assertStatus(200);
});

test('dog owners can authenticate using the login screen', function () {
    $owner = DogOwner::factory()->create();

    $response = $this->post('/login', [
        'email' => $owner->email,
        'password' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));
});

test('staff can authenticate using the login screen', function () {
    $staff = Staff::factory()->frontDesk()->create();

    $response = $this->post('/login', [
        'email' => $staff->email,
        'password' => 'password',
    ]);

    $this->assertAuthenticatedAs($staff, 'staff');
    $response->assertRedirect(route('dashboard', absolute: false));
});

test('accounts can not authenticate with an invalid password', function () {
    $owner = DogOwner::factory()->create();

    $this->post('/login', [
        'email' => $owner->email,
        'password' => 'wrong-password',
    ]);

    $this->assertGuest();
});

test('accounts can logout', function () {
    $owner = DogOwner::factory()->create();

    $response = $this->actingAs($owner)->post('/logout');

    $this->assertGuest();
    $response->assertRedirect('/');
});

test('logging out clears a staff session too', function () {
    $staff = Staff::factory()->admin()->create();

    $this->actingAs($staff, 'staff')->post('/logout');

    $this->assertGuest('staff');
});
