<?php

use App\Models\DogOwner;
use App\Models\Staff;
use Inertia\Testing\AssertableInertia as Assert;

test('the root dashboard redirects each role to its own area', function (
    callable $account,
    string $routeName,
) {
    $this->actingAs($account())
        ->get('/dashboard')
        ->assertRedirect(route($routeName));
})->with([
    'admin' => [fn () => Staff::factory()->admin()->create(), 'admin.dashboard'],
    'front desk' => [fn () => Staff::factory()->frontDesk()->create(), 'front_desk.dashboard'],
    'veterinarian' => [fn () => Staff::factory()->veterinarian()->create(), 'front_desk.dashboard'],
    'dog owner' => [fn () => DogOwner::factory()->create(), 'owner.dashboard'],
]);

test('the admin dashboard renders account stats', function () {
    Staff::factory()->admin()->create();
    Staff::factory()->frontDesk()->create();
    DogOwner::factory()->count(2)->create();

    $this->actingAs(Staff::factory()->admin()->create())
        ->get(route('admin.dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Dashboard')
            ->where('stats.admins', 2)
            ->where('stats.front_desk', 1)
            ->where('stats.owners', 2)
            ->where('stats.total_users', 5)
            ->has('recentUsers', 5)
        );
});

test('the front desk dashboard renders for staff', function () {
    $this->actingAs(Staff::factory()->frontDesk()->create())
        ->get(route('front_desk.dashboard'))
        ->assertInertia(fn (Assert $page) => $page->component('FrontDesk/Dashboard'));
});

test('the owner dashboard renders for owners', function () {
    $this->actingAs(DogOwner::factory()->create())
        ->get(route('owner.dashboard'))
        ->assertInertia(fn (Assert $page) => $page->component('Owner/Dashboard'));
});
