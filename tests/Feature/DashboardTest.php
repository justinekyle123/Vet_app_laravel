<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('the root dashboard redirects each role to its own area', function (
    string $factoryState,
    string $routeName,
) {
    $this->actingAs(User::factory()->{$factoryState}()->create())
        ->get('/dashboard')
        ->assertRedirect(route($routeName));
})->with([
    'admin' => ['admin', 'admin.dashboard'],
    'front desk' => ['frontDesk', 'front_desk.dashboard'],
    'owner' => ['owner', 'owner.dashboard'],
]);

test('the admin dashboard renders account stats', function () {
    User::factory()->admin()->create();
    User::factory()->frontDesk()->create();
    User::factory()->owner()->count(2)->create();

    $this->actingAs(User::factory()->admin()->create())
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
    $this->actingAs(User::factory()->frontDesk()->create())
        ->get(route('front_desk.dashboard'))
        ->assertInertia(fn (Assert $page) => $page->component('FrontDesk/Dashboard'));
});

test('the owner dashboard renders for owners', function () {
    $this->actingAs(User::factory()->owner()->create())
        ->get(route('owner.dashboard'))
        ->assertInertia(fn (Assert $page) => $page->component('Owner/Dashboard'));
});
