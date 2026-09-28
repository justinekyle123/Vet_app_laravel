<?php

use App\Models\DogOwner;

test('profile page is displayed', function () {
    $owner = DogOwner::factory()->create();

    $response = $this
        ->actingAs($owner)
        ->get('/profile');

    $response->assertOk();
});

test('profile information can be updated', function () {
    $owner = DogOwner::factory()->create();

    $response = $this
        ->actingAs($owner)
        ->patch('/profile', [
            'first_name' => 'Test',
            'last_name' => 'User',
            'email' => 'test@example.com',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect('/profile');

    $owner->refresh();

    $this->assertSame('Test', $owner->first_name);
    $this->assertSame('User', $owner->last_name);
    $this->assertSame('test@example.com', $owner->email);
});

test('account can delete itself', function () {
    $owner = DogOwner::factory()->create();

    $response = $this
        ->actingAs($owner)
        ->delete('/profile', [
            'password' => 'password',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect('/');

    $this->assertGuest();
    $this->assertNull($owner->fresh());
});

test('correct password must be provided to delete an account', function () {
    $owner = DogOwner::factory()->create();

    $response = $this
        ->actingAs($owner)
        ->from('/profile')
        ->delete('/profile', [
            'password' => 'wrong-password',
        ]);

    $response
        ->assertSessionHasErrors('password')
        ->assertRedirect('/profile');

    $this->assertNotNull($owner->fresh());
});
