<?php

use App\Models\DogOwner;
use App\Models\Staff;
use Illuminate\Support\Facades\Hash;

test('password can be updated', function () {
    $owner = DogOwner::factory()->create();

    $response = $this
        ->actingAs($owner)
        ->from('/profile')
        ->put('/password', [
            'current_password' => 'password',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect('/profile');

    $this->assertTrue(Hash::check('new-password', $owner->refresh()->password_hash));
});

test('a staff member can update their own password', function () {
    $staff = Staff::factory()->admin()->create();

    $response = $this
        ->actingAs($staff, 'staff')
        ->from('/profile')
        ->put('/password', [
            'current_password' => 'password',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect('/profile');

    $this->assertTrue(Hash::check('new-password', $staff->refresh()->password_hash));
});

test('correct password must be provided to update password', function () {
    $owner = DogOwner::factory()->create();

    $response = $this
        ->actingAs($owner)
        ->from('/profile')
        ->put('/password', [
            'current_password' => 'wrong-password',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

    $response
        ->assertSessionHasErrors('current_password')
        ->assertRedirect('/profile');
});
