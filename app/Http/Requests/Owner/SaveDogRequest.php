<?php

namespace App\Http\Requests\Owner;

use App\Models\Dog;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveDogRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * Used for both adding a dog and editing one. The schema stores a breed
     * id rather than free text, and restricts sex to the three values in the
     * column's ENUM.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $dog = $this->route('dog');

        return [
            'dog_name' => ['required', 'string', 'max:100'],
            'breed_id' => ['nullable', 'integer', 'exists:dog_breeds,breed_id'],
            'sex' => ['required', Rule::in(['Male', 'Female', 'Unknown'])],
            'color' => ['nullable', 'string', 'max:50'],
            'birth_date' => ['nullable', 'date', 'before_or_equal:today'],
            'weight_kg' => ['nullable', 'numeric', 'min:0', 'max:999.99'],
            'is_vaccinated' => ['boolean'],
            'photo_url' => ['nullable', 'string', 'max:255'],
            'is_active' => ['boolean'],
        ];
    }
}
