<?php

namespace Database\Factories;

use App\Enums\StaffRole;
use App\Models\ClinicInfo;
use App\Models\Staff;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * @extends Factory<Staff>
 */
class StaffFactory extends Factory
{
    protected $model = Staff::class;

    /**
     * Define the model's default state.
     *
     * The schema requires a clinic, so one is created on demand.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'clinic_id' => ClinicInfo::factory(),
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'email' => fake()->unique()->safeEmail(),
            'password_hash' => Hash::make('password'),
            'phone_number' => fake()->numerify('##########'),
            'role' => StaffRole::Veterinarian,
            'is_active' => true,
        ];
    }

    public function admin(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => StaffRole::Admin,
        ]);
    }

    public function veterinarian(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => StaffRole::Veterinarian,
        ]);
    }

    public function groomer(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => StaffRole::Groomer,
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
