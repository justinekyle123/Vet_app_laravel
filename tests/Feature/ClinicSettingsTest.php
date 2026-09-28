<?php

use App\Models\ClinicInfo;
use App\Models\Staff;
use Inertia\Testing\AssertableInertia as Assert;

/** A complete, valid settings payload. */
function clinicPayload(array $overrides = []): array
{
    return array_merge([
        'clinic_name' => 'Happy Paws Vet',
        'address_line' => '1 Bark Street',
        'city' => 'Springfield',
        'province' => 'Pampanga',
        'zip_code' => '2000',
        'contact_number' => '5550100',
        'email' => 'hello@happypaws.test',
        'opening_time' => '08:00',
        'closing_time' => '19:00',
        'days_open' => 'Monday-Saturday',
        'logo_url' => '',
    ], $overrides);
}

test('the settings screen falls back to defaults before anything is saved', function () {
    $this->actingAs(Staff::factory()->admin()->create())
        ->get(route('admin.settings.edit'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Settings')
            ->where('settings.clinic_name', 'MyVet Animal Clinic')
            ->where('settings.opening_time', '08:00')
            ->where('settings.days_open', 'Monday-Saturday')
        );
});

test('an admin can save clinic settings', function () {
    $this->actingAs(Staff::factory()->admin()->create())
        ->patch(route('admin.settings.update'), clinicPayload())
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('admin.settings.edit'));

    $clinic = ClinicInfo::current();

    expect($clinic->clinic_name)->toBe('Happy Paws Vet')
        ->and($clinic->city)->toBe('Springfield')
        ->and($clinic->email)->toBe('hello@happypaws.test')
        ->and(substr((string) $clinic->closing_time, 0, 5))->toBe('19:00');
});

test('saved settings come back on the next visit', function () {
    ClinicInfo::current()->update(['clinic_name' => 'Happy Paws Vet']);

    $this->actingAs(Staff::factory()->admin()->create())
        ->get(route('admin.settings.edit'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('settings.clinic_name', 'Happy Paws Vet')
        );
});

test('clinic settings are validated', function () {
    $this->actingAs(Staff::factory()->admin()->create())
        ->from(route('admin.settings.edit'))
        ->patch(route('admin.settings.update'), clinicPayload([
            'clinic_name' => '',
            'email' => 'not-an-email',
            'opening_time' => 'half past eight',
            'days_open' => '',
        ]))
        ->assertSessionHasErrors([
            'clinic_name',
            'email',
            'opening_time',
            'days_open',
        ]);
});

test('front desk staff cannot change clinic settings', function () {
    $this->actingAs(Staff::factory()->frontDesk()->create())
        ->patch(route('admin.settings.update'), clinicPayload([
            'clinic_name' => 'Hijacked Clinic',
        ]))
        ->assertForbidden();
});
