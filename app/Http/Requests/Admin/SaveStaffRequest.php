<?php

namespace App\Http\Requests\Admin;

use App\Enums\StaffRole;
use App\Models\Staff;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveStaffRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * Vets and groomers are care-team profiles, not application accounts: they
     * carry no email password here. Only the two client-facing roles are
     * created; administrator accounts are provisioned with the clinic, so there
     * is no way to grant admin from this form.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        // On edit the row being changed must not collide with itself on email.
        $staff = $this->route('staff');

        return [
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => [
                'required',
                'string',
                'email',
                'max:150',
                Rule::unique(Staff::class, 'email')->ignore($staff?->staff_id, 'staff_id'),
            ],
            'phone_number' => ['nullable', 'string', 'max:20'],
            'role' => [
                'required',
                Rule::in([
                    StaffRole::Veterinarian->value,
                    StaffRole::Groomer->value,
                ]),
            ],
            'specialization' => ['nullable', 'string', 'max:150'],
            'background' => ['nullable', 'string', 'max:2000'],
            'experience_years' => ['nullable', 'integer', 'min:0', 'max:70'],
            'qualifications' => ['nullable', 'string', 'max:2000'],
            'license_number' => ['nullable', 'string', 'max:50'],
            'image' => ['nullable', 'file', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
            'is_active' => ['boolean'],
        ];
    }
}
