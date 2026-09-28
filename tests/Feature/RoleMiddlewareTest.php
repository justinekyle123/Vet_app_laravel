<?php

use App\Enums\StaffRole;
use App\Models\DogOwner;
use App\Models\Staff;

test('guests are redirected away from protected areas', function () {
    $this->get('/admin')->assertRedirect('/login');
});

test('an owner cannot reach the admin area', function () {
    $this->actingAs(DogOwner::factory()->create())
        ->get('/admin')
        ->assertForbidden();
});

test('an admin can reach the admin area', function () {
    $this->actingAs(Staff::factory()->admin()->create())
        ->get('/admin')
        ->assertOk();
});

test('front desk staff can reach the front desk area', function () {
    $this->actingAs(Staff::factory()->frontDesk()->create())
        ->get('/front-desk')
        ->assertOk();
});

test('a veterinarian uses the same desk area', function () {
    $this->actingAs(Staff::factory()->veterinarian()->create())
        ->get('/front-desk')
        ->assertOk();
});

test('an owner cannot reach the front desk area', function () {
    $this->actingAs(DogOwner::factory()->create())
        ->get('/front-desk')
        ->assertForbidden();
});

test('an owner can reach the client portal', function () {
    $this->actingAs(DogOwner::factory()->create())
        ->get('/portal')
        ->assertOk();
});

test('staff cannot reach the owner-only portal', function () {
    $this->actingAs(Staff::factory()->admin()->create())
        ->get('/portal')
        ->assertForbidden();
});

test('front desk staff cannot reach the admin area', function () {
    $this->actingAs(Staff::factory()->frontDesk()->create())
        ->get('/admin')
        ->assertForbidden();
});

test('new registrations sign in as dog owners', function () {
    $this->post('/register', [
        'name' => 'New Owner',
        'email' => 'new-owner@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $owner = DogOwner::where('email', 'new-owner@example.com')->firstOrFail();

    expect($owner->isOwner())->toBeTrue()
        ->and($owner->hasRole('owner'))->toBeTrue();
});

test('role helpers answer for the assigned role', function () {
    $admin = Staff::factory()->admin()->create();
    $desk = Staff::factory()->frontDesk()->create();

    expect($admin->hasRole(StaffRole::Admin))->toBeTrue()
        ->and($admin->hasRole('owner'))->toBeFalse()
        ->and($admin->hasAnyRole('front_desk', 'admin'))->toBeTrue()
        ->and($desk->isFrontDesk())->toBeTrue()
        ->and($desk->isAdmin())->toBeFalse();
});
