<?php

namespace App\Http\Requests\Admin;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules;

class ResetStaffPasswordRequest extends FormRequest
{
    /**
     * Only staff accounts can be targeted here. This keeps the endpoint from
     * being used to take over a dog owner's account.
     */
    public function authorize(): bool
    {
        $target = $this->route('user');

        return $target instanceof User
            && $target->hasAnyRole(UserRole::Admin, UserRole::FrontDesk);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ];
    }
}
