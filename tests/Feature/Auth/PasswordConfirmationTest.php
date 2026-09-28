<?php

use App\Models\DogOwner;

test('confirm password screen can be rendered', function () {
    $owner = DogOwner::factory()->create();

    $response = $this->actingAs($owner)->get('/confirm-password');

    $response->assertStatus(200);
});

test('password can be confirmed', function () {
    $owner = DogOwner::factory()->create();

    $response = $this->actingAs($owner)->post('/confirm-password', [
        'password' => 'password',
    ]);

    $response->assertRedirect();
    $response->assertSessionHasNoErrors();
});

test('password is not confirmed with invalid password', function () {
    $owner = DogOwner::factory()->create();

    $response = $this->actingAs($owner)->post('/confirm-password', [
        'password' => 'wrong-password',
    ]);

    $response->assertSessionHasErrors();
});
