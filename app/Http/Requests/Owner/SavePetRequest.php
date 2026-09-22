<?php

namespace App\Http\Requests\Owner;

use App\Models\Pet;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SavePetRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * Used for both creating and updating a pet, so the microchip uniqueness
     * check ignores the pet being edited when there is one on the route.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $pet = $this->route('pet');

        return [
            'name' => ['required', 'string', 'max:255'],
            'species' => ['required', 'string', 'max:255'],
            'breed' => ['nullable', 'string', 'max:255'],
            'sex' => ['nullable', Rule::in(['male', 'female', 'unknown'])],
            'color' => ['nullable', 'string', 'max:255'],
            'birth_date' => ['nullable', 'date', 'before_or_equal:today'],
            'weight_kg' => ['nullable', 'numeric', 'min:0', 'max:999'],
            'microchip_number' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique(Pet::class)->ignore($pet?->id),
            ],
            'is_neutered' => ['boolean'],
            'allergies' => ['nullable', 'string', 'max:2000'],
            'is_active' => ['boolean'],
        ];
    }
}
