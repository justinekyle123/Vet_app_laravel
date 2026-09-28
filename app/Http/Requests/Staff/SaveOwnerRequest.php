<?php

namespace App\Http\Requests\Staff;

use App\Models\DogOwner;
use App\Models\Staff;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveOwnerRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * Used for both creating a walk-in owner and editing an existing one. The
     * address must be free in the staff table too, because it doubles as a
     * sign-in identifier.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $owner = $this->route('owner');

        return [
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:150',
                Rule::unique(DogOwner::class, 'email')->ignore($owner?->owner_id, 'owner_id'),
                Rule::unique(Staff::class, 'email'),
            ],
            'phone_number' => ['required', 'string', 'max:20'],
            'address' => ['nullable', 'string', 'max:255'],
            'is_active' => ['boolean'],
        ];
    }
}
