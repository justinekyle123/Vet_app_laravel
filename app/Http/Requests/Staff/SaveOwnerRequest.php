<?php

namespace App\Http\Requests\Staff;

use App\Models\Owner;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveOwnerRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * Used for both creating a walk-in owner and editing an existing one, so
     * the email uniqueness check ignores the owner being edited.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $owner = $this->route('owner');

        return [
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => [
                'nullable',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(Owner::class)->ignore($owner?->id),
            ],
            'phone' => ['nullable', 'string', 'max:255'],
            'alternate_phone' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'is_active' => ['boolean'],
        ];
    }
}
