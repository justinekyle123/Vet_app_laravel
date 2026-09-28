<?php

namespace Database\Factories;

use App\Models\ClinicInfo;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ClinicInfo>
 */
class ClinicInfoFactory extends Factory
{
    protected $model = ClinicInfo::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'clinic_name' => 'MyVet Animal Clinic',
            'address_line' => fake()->streetAddress(),
            'city' => fake()->city(),
            'province' => fake()->state(),
            'zip_code' => fake()->postcode(),
            'contact_number' => fake()->numerify('##########'),
            'email' => 'clinic@example.com',
            'opening_time' => '08:00:00',
            'closing_time' => '18:00:00',
            'days_open' => 'Monday-Saturday',
        ];
    }
}
