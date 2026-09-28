<?php

namespace Database\Factories;

use App\Models\Dog;
use App\Models\DogOwner;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Dog>
 */
class DogFactory extends Factory
{
    protected $model = Dog::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'owner_id' => DogOwner::factory(),
            'dog_name' => fake()->firstName(),
            'breed_id' => null,
            'sex' => fake()->randomElement(['Male', 'Female', 'Unknown']),
            'birth_date' => fake()->dateTimeBetween('-12 years', '-3 months')->format('Y-m-d'),
            'is_vaccinated' => fake()->boolean(),
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
