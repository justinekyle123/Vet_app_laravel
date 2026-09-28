<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateClinicInfoRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * The fields mirror the `clinic_info` columns exactly, so nothing here can
     * write a value the schema has nowhere to keep.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'clinic_name' => ['required', 'string', 'max:150'],
            'address_line' => ['required', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:100'],
            'province' => ['required', 'string', 'max:100'],
            'zip_code' => ['nullable', 'string', 'max:10'],
            'contact_number' => ['required', 'string', 'max:20'],
            'email' => ['required', 'email', 'max:150'],
            'opening_time' => ['required', 'date_format:H:i'],
            'closing_time' => ['required', 'date_format:H:i'],
            'days_open' => ['required', 'string', 'max:100'],
            'logo_url' => ['nullable', 'string', 'max:255'],
        ];
    }
}
