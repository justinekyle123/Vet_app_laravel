<?php

namespace App\Http\Requests;

use App\Models\DogOwner;
use App\Models\Staff;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * The authenticated account may be a dog owner or a staff member, so the
     * uniqueness check runs against whichever table it came from.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $user = $this->user();
        $isStaff = $user instanceof Staff;

        return [
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:150',
                Rule::unique(DogOwner::class, 'email')->ignore(
                    $isStaff ? null : $user?->owner_id,
                    'owner_id',
                ),
                Rule::unique(Staff::class, 'email')->ignore(
                    $isStaff ? $user?->staff_id : null,
                    'staff_id',
                ),
            ],
        ];
    }
}
