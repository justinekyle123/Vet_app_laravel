<?php

use App\Models\Setting;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('the settings screen falls back to defaults before anything is saved', function () {
    $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.settings.edit'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Settings')
            ->where('settings.clinic_name', 'MyVet Animal Clinic')
            ->where('settings.appointment_duration', '30')
            ->where('settings.tax_rate', '0')
        );
});

test('an admin can save clinic settings', function () {
    $this->actingAs(User::factory()->admin()->create())
        ->patch(route('admin.settings.update'), [
            'clinic_name' => 'Happy Paws Vet',
            'contact_email' => 'hello@happypaws.test',
            'contact_phone' => '5550100',
            'address' => '1 Bark Street',
            'city' => 'Springfield',
            'postal_code' => '12345',
            'opening_hours' => 'Mon–Sat, 8:00am–7:00pm',
            'appointment_duration' => 45,
            'tax_rate' => '7.5',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('admin.settings.edit'));

    $settings = Setting::values();

    expect($settings['clinic_name'])->toBe('Happy Paws Vet')
        ->and($settings['city'])->toBe('Springfield')
        ->and($settings['appointment_duration'])->toBe('45')
        ->and($settings['tax_rate'])->toBe('7.5');
});

test('saved settings come back on the next visit', function () {
    Setting::putValues(['clinic_name' => 'Happy Paws Vet']);

    $this->actingAs(User::factory()->admin()->create())
        ->get(route('admin.settings.edit'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('settings.clinic_name', 'Happy Paws Vet')
            ->where('settings.city', '')
        );
});

test('settings outside the managed set are ignored', function () {
    Setting::putValues(['not_a_real_setting' => 'sneaky']);

    expect(Setting::query()->where('key', 'not_a_real_setting')->exists())
        ->toBeFalse();
});

test('clinic settings are validated', function () {
    $this->actingAs(User::factory()->admin()->create())
        ->from(route('admin.settings.edit'))
        ->patch(route('admin.settings.update'), [
            'clinic_name' => '',
            'contact_email' => 'not-an-email',
            'appointment_duration' => 0,
            'tax_rate' => 500,
        ])
        ->assertSessionHasErrors([
            'clinic_name',
            'contact_email',
            'appointment_duration',
            'tax_rate',
        ]);
});

test('front desk staff cannot change clinic settings', function () {
    $this->actingAs(User::factory()->frontDesk()->create())
        ->patch(route('admin.settings.update'), [
            'clinic_name' => 'Hijacked Clinic',
            'appointment_duration' => 30,
            'tax_rate' => 0,
        ])
        ->assertForbidden();
});
