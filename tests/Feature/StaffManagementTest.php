<?php

use App\Models\DogOwner;
use App\Models\Staff;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;

test('an admin can view the staff list', function () {
    Staff::factory()->admin()->create();
    Staff::factory()->frontDesk()->create();
    DogOwner::factory()->create();

    $this->actingAs(Staff::factory()->admin()->create())
        ->get(route('admin.staff.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Staff')
            // Three staff rows total (2 seeded above + the acting admin); the
            // dog owner has no staff record and must not appear.
            ->has('staff', 3)
        );
});

test('an admin can reset a staff password', function () {
    $staff = Staff::factory()->frontDesk()->create();

    $this->actingAs(Staff::factory()->admin()->create())
        ->patch(route('admin.staff.password', $staff), [
            'password' => 'brand-new-password',
            'password_confirmation' => 'brand-new-password',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('admin.staff.index'));

    expect(Hash::check('brand-new-password', $staff->fresh()->password_hash))->toBeTrue();
});

test('a password confirmation mismatch is rejected', function () {
    $staff = Staff::factory()->admin()->create();

    $this->actingAs(Staff::factory()->admin()->create())
        ->from(route('admin.staff.index'))
        ->patch(route('admin.staff.password', $staff), [
            'password' => 'brand-new-password',
            'password_confirmation' => 'something-else',
        ])
        ->assertSessionHasErrors('password')
        ->assertRedirect(route('admin.staff.index'));
});

test('front desk staff cannot manage staff passwords', function () {
    $target = Staff::factory()->frontDesk()->create();

    $this->actingAs(Staff::factory()->frontDesk()->create())
        ->patch(route('admin.staff.password', $target), [
            'password' => 'brand-new-password',
            'password_confirmation' => 'brand-new-password',
        ])
        ->assertForbidden();
});

test('a dog owner password is never touched by the staff reset', function () {
    $admin = Staff::factory()->admin()->create();
    $owner = DogOwner::factory()->create();
    $original = $owner->password_hash;

    // The route binds a staff row, so an owner id can only ever reach a staff
    // record. Whatever the binding resolves to, the owner's credential stays.
    $this->actingAs($admin)
        ->patch(route('admin.staff.password', $owner), [
            'password' => 'brand-new-password',
            'password_confirmation' => 'brand-new-password',
        ]);

    expect($owner->fresh()->password_hash)->toBe($original);
});
