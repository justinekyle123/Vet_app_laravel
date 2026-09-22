<?php

namespace Database\Factories;

use App\Models\Owner;
use App\Models\Pet;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Pet>
 */
class PetFactory extends Factory
{
    protected $model = Pet::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'owner_id' => Owner::factory(),
            'name' => fake()->firstName(),
            'species' => 'Dog',
            'breed' => fake()->word(),
            'sex' => fake()->randomElement(['male', 'female']),
            'birth_date' => fake()->dateTimeBetween('-12 years', '-3 months')->format('Y-m-d'),
            'is_active' => true,
        ];
    }
}
