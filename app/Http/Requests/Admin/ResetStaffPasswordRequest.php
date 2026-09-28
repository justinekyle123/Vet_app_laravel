<?php

namespace App\Http\Requests\Admin;

use App\Models\Staff;
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
        return $this->route('staff') instanceof Staff;
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
