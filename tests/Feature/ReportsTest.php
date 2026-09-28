<?php

use App\Models\Dog;
use App\Models\DogOwner;
use App\Models\Staff;
use Inertia\Testing\AssertableInertia as Assert;

test('an admin sees clinic figures on the reports page', function () {
    Staff::factory()->admin()->create();
    Staff::factory()->frontDesk()->create();

    $active = DogOwner::factory()->create(['is_active' => true]);
    DogOwner::factory()->create(['is_active' => false]);
    Dog::factory()->create(['owner_id' => $active->owner_id, 'is_active' => true]);

    // The acting admin makes a second administrator account.
    $this->actingAs(Staff::factory()->admin()->create())
        ->get(route('admin.reports.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Reports')
            ->where('accounts.admins', 2)
            ->where('accounts.front_desk', 1)
            ->where('accounts.owners', 2)
            ->where('clients.total', 2)
            ->where('clients.active', 1)
            ->where('clients.inactive', 1)
            ->where('dogs.total', 1)
            ->where('dogs.active', 1)
            // The seeded dog has no breed on file.
            ->where('breeds.0.label', 'Unspecified')
            ->where('breeds.0.count', 1)
        );
});

test('the sign-up series always covers six months', function () {
    $this->actingAs(Staff::factory()->admin()->create());

    DogOwner::factory()->create();

    $this->get(route('admin.reports.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('signups', 6)
            // The newest month carries the owner just created; the older
            // months are empty rather than missing.
            ->where('signups.5.count', 1)
            ->where('signups.0.count', 0)
        );
});

test('an empty clinic reports zeroes instead of failing', function () {
    $this->actingAs(Staff::factory()->admin()->create())
        ->get(route('admin.reports.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('clients.total', 0)
            ->where('dogs.total', 0)
            ->has('breeds', 0)
        );
});

test('front desk staff cannot open reports', function () {
    $this->actingAs(Staff::factory()->frontDesk()->create())
        ->get(route('admin.reports.index'))
        ->assertForbidden();
});
