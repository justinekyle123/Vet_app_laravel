<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;

test('an admin can view the staff list', function () {
    User::factory()->admin()->create();
    User::factory()->frontDesk()->create();
    User::factory()->owner()->create();

    $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.staff.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Staff')
            // Three staff rows total (2 seeded above + the acting admin); the
            // dog owner must not appear.
            ->has('staff', 3)
        );
});

test('an admin can reset a staff password', function () {
    $staff = User::factory()->frontDesk()->create();

    $this->actingAs(User::factory()->admin()->create())
        ->patch(route('admin.staff.password', $staff), [
            'password' => 'brand-new-password',
            'password_confirmation' => 'brand-new-password',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('admin.staff.index'));

    expect(Hash::check('brand-new-password', $staff->fresh()->password))->toBeTrue();
});

test('a password confirmation mismatch is rejected', function () {
    $staff = User::factory()->admin()->create();

    $this->actingAs(User::factory()->admin()->create())
        ->from(route('admin.staff.index'))
        ->patch(route('admin.staff.password', $staff), [
            'password' => 'brand-new-password',
            'password_confirmation' => 'something-else',
        ])
        ->assertSessionHasErrors('password')
        ->assertRedirect(route('admin.staff.index'));
});

test('front desk staff cannot manage staff passwords', function () {
    $target = User::factory()->frontDesk()->create();

    $this->actingAs(User::factory()->frontDesk()->create())
        ->patch(route('admin.staff.password', $target), [
            'password' => 'brand-new-password',
            'password_confirmation' => 'brand-new-password',
        ])
        ->assertForbidden();
});

test('an owner account cannot be targeted by the staff reset', function () {
    $owner = User::factory()->owner()->create();

    $this->actingAs(User::factory()->admin()->create())
        ->patch(route('admin.staff.password', $owner), [
            'password' => 'brand-new-password',
            'password_confirmation' => 'brand-new-password',
        ])
        ->assertForbidden();
});
