<?php

use App\Models\Owner;
use App\Models\Pet;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('an admin sees clinic figures on the reports page', function () {
    User::factory()->admin()->create();
    User::factory()->frontDesk()->create();
    User::factory()->owner()->create();

    $active = Owner::factory()->create(['is_active' => true]);
    Owner::factory()->create(['is_active' => false]);
    Pet::factory()->for($active)->create(['species' => 'dog', 'is_active' => true]);

    // The acting admin makes a second administrator account.
    $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.reports.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Reports')
            ->where('accounts.admins', 2)
            ->where('accounts.front_desk', 1)
            ->where('accounts.owners', 1)
            ->where('clients.total', 2)
            ->where('clients.active', 1)
            ->where('clients.inactive', 1)
            ->where('pets.total', 1)
            ->where('pets.active', 1)
            ->where('species.0.label', 'Dog')
            ->where('species.0.count', 1)
        );
});

test('the sign-up series always covers six months', function () {
    $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.reports.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('signups', 6)
            // The acting admin signed up today, so the newest month carries it
            // and the older months are empty rather than missing.
            ->where('signups.5.count', 1)
            ->where('signups.0.count', 0)
        );
});

test('an empty clinic reports zeroes instead of failing', function () {
    $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.reports.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('clients.total', 0)
            ->where('pets.total', 0)
            ->has('species', 0)
        );
});

test('front desk staff cannot open reports', function () {
    $this->actingAs(User::factory()->frontDesk()->create())
        ->get(route('admin.reports.index'))
        ->assertForbidden();
});
