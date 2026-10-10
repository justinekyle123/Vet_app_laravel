<?php

use App\Models\Appointment;
use App\Models\AppointmentStatus;
use App\Models\ClinicInfo;
use App\Models\Dog;
use App\Models\DogOwner;
use App\Models\Service;
use App\Models\Staff;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

test('an admin can view the staff list', function () {
    Staff::factory()->admin()->create();
    Staff::factory()->veterinarian()->create();
    DogOwner::factory()->create();

    $this->actingAs(Staff::factory()->admin()->create())
        ->get(route('admin.staff.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Staff')
            // Three staff rows total (2 seeded above + the acting admin); the
            // dog owner has no staff record and must not appear.
            ->has('staff.data', 3)
            ->where('staff.total', 3)
        );
});

test('an admin cannot delete their own account', function () {
    $admin = Staff::factory()->admin()->create();

    $this->actingAs($admin)
        ->from(route('admin.staff.index'))
        ->delete(route('admin.staff.destroy', $admin))
        ->assertRedirect(route('admin.staff.index'))
        ->assertSessionHas('error', 'You cannot delete your own account.');

    expect(Staff::where('staff_id', $admin->staff_id)->exists())->toBeTrue();
});

test('an admin can still delete another staff member', function () {
    $target = Staff::factory()->veterinarian()->create();

    $this->actingAs(Staff::factory()->admin()->create())
        ->delete(route('admin.staff.destroy', $target))
        ->assertRedirect(route('admin.staff.index'))
        ->assertSessionHas('status', 'staff-deleted');

    expect(Staff::where('staff_id', $target->staff_id)->exists())->toBeFalse();
});

test('an admin can reset a staff password', function () {
    $staff = Staff::factory()->veterinarian()->create();

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

test('veterinarian profiles cannot manage staff passwords', function () {
    $target = Staff::factory()->veterinarian()->create();

    $this->actingAs(Staff::factory()->veterinarian()->create())
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

/*
 * Administrators provision the clinic's care team: a veterinarian or groomer
 * with the profile details dog owners read before booking.
 */

test('an admin can open the add-staff page', function () {
    $this->actingAs(Staff::factory()->admin()->create())
        ->get(route('admin.staff.create'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/StaffCreate')
            ->has('roles', 2)
            ->where('roles.0.value', 'veterinarian')
            ->where('roles.1.value', 'groomer')
        );
});

test('an admin can add a veterinarian with their details', function () {
    Storage::fake('public');
    ClinicInfo::factory()->create();

    $this->actingAs(Staff::factory()->admin()->create())
        ->post(route('admin.staff.store'), [
            'role' => 'veterinarian',
            'first_name' => 'Clara',
            'last_name' => 'Mendoza',
            'email' => 'clara@example.com',
            'phone_number' => '09171234567',
            'specialization' => 'Internal medicine',
            'experience_years' => 8,
            'qualifications' => 'Licensed veterinarian',
            'license_number' => 'VET-12345',
            'background' => 'Companion-animal medicine and preventive care.',
            'image' => UploadedFile::fake()->create('clara.jpg', 100, 'image/jpeg'),
            'is_active' => true,
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('admin.staff.index'));

    $staff = Staff::where('email', 'clara@example.com')->firstOrFail();

    expect($staff->role->value)->toBe('veterinarian')
        ->and($staff->specialization)->toBe('Internal medicine')
        ->and($staff->experience_years)->toBe(8)
        ->and($staff->qualifications)->toBe('Licensed veterinarian')
        ->and($staff->license_number)->toBe('VET-12345')
        ->and($staff->is_active)->toBeTrue()
        // Care-team profiles carry no login credential.
        ->and($staff->password_hash)->toBeNull();

    expect($staff->image_path)->not->toBeEmpty();
    Storage::disk('public')->assertExists($staff->image_path);
});

test('an admin can add a groomer without medical-only fields', function () {
    ClinicInfo::factory()->create();

    $this->actingAs(Staff::factory()->admin()->create())
        ->post(route('admin.staff.store'), [
            'role' => 'groomer',
            'first_name' => 'Nina',
            'last_name' => 'Salvador',
            'email' => 'nina@example.com',
            'specialization' => 'Bath, trim, and coat care',
        ])
        ->assertSessionHasNoErrors();

    $staff = Staff::where('email', 'nina@example.com')->firstOrFail();

    expect($staff->role->value)->toBe('groomer')
        ->and($staff->license_number)->toBeNull();
});

test('the form only creates vets and groomers, never administrators', function () {
    ClinicInfo::factory()->create();

    $this->actingAs(Staff::factory()->admin()->create())
        ->from(route('admin.staff.create'))
        ->post(route('admin.staff.store'), [
            'role' => 'admin',
            'first_name' => 'Sneaky',
            'last_name' => 'Admin',
            'email' => 'sneaky@example.com',
        ])
        ->assertSessionHasErrors('role');

    expect(Staff::where('email', 'sneaky@example.com')->exists())->toBeFalse();
});

test('a staff profile needs a name, email, and role', function () {
    $this->actingAs(Staff::factory()->admin()->create())
        ->from(route('admin.staff.create'))
        ->post(route('admin.staff.store'), [])
        ->assertSessionHasErrors([
            'first_name',
            'last_name',
            'email',
            'role',
        ]);
});

test('a staff email must be unique', function () {
    ClinicInfo::factory()->create();
    Staff::factory()->create(['email' => 'taken@example.com']);

    $this->actingAs(Staff::factory()->admin()->create())
        ->from(route('admin.staff.create'))
        ->post(route('admin.staff.store'), [
            'role' => 'groomer',
            'first_name' => 'Nina',
            'last_name' => 'Salvador',
            'email' => 'taken@example.com',
        ])
        ->assertSessionHasErrors('email');

    expect(Staff::where('email', 'taken@example.com')->count())->toBe(1);
});

test('an admin can open the edit page for a care-team profile', function () {
    $staff = Staff::factory()->veterinarian()->create([
        'first_name' => 'Clara',
        'last_name' => 'Mendoza',
        'specialization' => 'Internal medicine',
    ]);

    $this->actingAs(Staff::factory()->admin()->create())
        ->get(route('admin.staff.edit', $staff))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/StaffEdit')
            ->where('staff.id', $staff->staff_id)
            ->where('staff.first_name', 'Clara')
            ->where('staff.role', 'veterinarian')
            ->has('roles', 2)
        );
});

test('an admin can update a care-team profile', function () {
    Storage::fake('public');
    $staff = Staff::factory()->veterinarian()->create(['specialization' => 'Old']);

    $this->actingAs(Staff::factory()->admin()->create())
        ->patch(route('admin.staff.update', $staff), [
            'role' => 'groomer',
            'first_name' => 'Nina',
            'last_name' => 'Salvador',
            'email' => 'nina@example.com',
            'specialization' => 'Coat care',
            'experience_years' => 5,
            'is_active' => true,
            'image' => UploadedFile::fake()->create('nina.jpg', 100, 'image/jpeg'),
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('admin.staff.index'));

    $updated = $staff->fresh();

    expect($updated->role->value)->toBe('groomer')
        ->and($updated->first_name)->toBe('Nina')
        ->and($updated->specialization)->toBe('Coat care')
        ->and($updated->experience_years)->toBe(5);

    expect($updated->image_path)->not->toBeEmpty();
    Storage::disk('public')->assertExists($updated->image_path);
});

test('updating a profile leaves its own email valid', function () {
    $staff = Staff::factory()->create(['email' => 'same@example.com']);

    $this->actingAs(Staff::factory()->admin()->create())
        ->patch(route('admin.staff.update', $staff), [
            'role' => $staff->role->value,
            'first_name' => 'Still',
            'last_name' => 'Same',
            'email' => 'same@example.com',
        ])
        ->assertSessionHasNoErrors();

    expect($staff->fresh()->first_name)->toBe('Still');
});

test('an admin can delete a care-team profile', function () {
    $staff = Staff::factory()->groomer()->create();

    $this->actingAs(Staff::factory()->admin()->create())
        ->delete(route('admin.staff.destroy', $staff))
        ->assertRedirect(route('admin.staff.index'));

    expect(Staff::where('staff_id', $staff->staff_id)->exists())->toBeFalse();
});

test('deleting a profile keeps past appointments on record', function () {
    $owner = DogOwner::factory()->create();
    $dog = Dog::factory()->create(['owner_id' => $owner->owner_id]);
    $staff = Staff::factory()->veterinarian()->create();

    $appointment = Appointment::create([
        'owner_id' => $owner->owner_id,
        'dog_id' => $dog->dog_id,
        'service_id' => Service::factory()->create()->service_id,
        'staff_id' => $staff->staff_id,
        'appointment_date' => '2026-10-06',
        'appointment_time' => '10:00:00',
        'status_id' => AppointmentStatus::firstOrCreate(['status_name' => 'Completed'])->status_id,
    ]);

    $this->actingAs(Staff::factory()->admin()->create())
        ->delete(route('admin.staff.destroy', $staff));

    // The visit survives with its staff reference cleared, not cascaded away.
    expect($appointment->fresh())->not->toBeNull()
        ->and($appointment->fresh()->staff_id)->toBeNull();
});

test('veterinarian profiles cannot edit or delete staff', function () {
    $target = Staff::factory()->groomer()->create();

    $this->actingAs(Staff::factory()->veterinarian()->create())
        ->get(route('admin.staff.edit', $target))
        ->assertForbidden();

    $this->actingAs(Staff::factory()->veterinarian()->create())
        ->delete(route('admin.staff.destroy', $target))
        ->assertForbidden();

    expect(Staff::where('staff_id', $target->staff_id)->exists())->toBeTrue();
});

test('veterinarian profiles cannot add staff accounts', function () {
    $this->actingAs(Staff::factory()->veterinarian()->create())
        ->get(route('admin.staff.create'))
        ->assertForbidden();

    $this->actingAs(Staff::factory()->veterinarian()->create())
        ->post(route('admin.staff.store'), [
            'role' => 'veterinarian',
            'first_name' => 'Sneaky',
            'last_name' => 'Vet',
            'email' => 'sneaky-vet@example.com',
        ])
        ->assertForbidden();
});
