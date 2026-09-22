<?php

use App\Enums\UserRole;
use App\Models\User;

test('guests are redirected away from protected areas', function () {
    $this->get('/admin')->assertRedirect('/login');
});

test('an owner cannot reach the admin area', function () {
    $this->actingAs(User::factory()->owner()->create())
        ->get('/admin')
        ->assertForbidden();
});

test('an admin can reach the admin area', function () {
    $this->actingAs(User::factory()->admin()->create())
        ->get('/admin')
        ->assertOk();
});

test('front desk staff can reach the front desk area', function () {
    $this->actingAs(User::factory()->frontDesk()->create())
        ->get('/front-desk')
        ->assertOk();
});

test('an owner cannot reach the front desk area', function () {
    $this->actingAs(User::factory()->owner()->create())
        ->get('/front-desk')
        ->assertForbidden();
});

test('an owner can reach the client portal', function () {
    $this->actingAs(User::factory()->owner()->create())
        ->get('/portal')
        ->assertOk();
});

test('staff cannot reach the owner-only portal', function () {
    $this->actingAs(User::factory()->admin()->create())
        ->get('/portal')
        ->assertForbidden();
});

test('new registrations are assigned the owner role', function () {
    $this->post('/register', [
        'name' => 'New Owner',
        'email' => 'new-owner@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $user = User::where('email', 'new-owner@example.com')->firstOrFail();

    expect($user->role)->toBe(UserRole::Owner)
        ->and($user->isOwner())->toBeTrue();
});

test('role helpers answer for the assigned role', function () {
    $admin = User::factory()->admin()->create();
    $desk = User::factory()->frontDesk()->create();

    expect($admin->hasRole(UserRole::Admin))->toBeTrue()
        ->and($admin->hasRole('owner'))->toBeFalse()
        ->and($admin->hasAnyRole('front_desk', 'admin'))->toBeTrue()
        ->and($desk->isFrontDesk())->toBeTrue()
        ->and($desk->isAdmin())->toBeFalse();
});
