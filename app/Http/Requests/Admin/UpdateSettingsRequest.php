<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingsRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * Every key here must exist in Setting::defaults(); anything else is
     * discarded when the values are stored.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'clinic_name' => ['required', 'string', 'max:255'],
            'contact_email' => ['nullable', 'email', 'max:255'],
            'contact_phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'opening_hours' => ['nullable', 'string', 'max:255'],
            'appointment_duration' => ['required', 'integer', 'min:5', 'max:600'],
            'tax_rate' => ['required', 'numeric', 'min:0', 'max:100'],
        ];
    }
}
