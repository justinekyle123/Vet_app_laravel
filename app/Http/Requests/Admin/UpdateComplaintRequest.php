<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateComplaintRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * Everything but the status is optional, so the console can send just the
     * part an administrator changed.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'status' => ['sometimes', Rule::in(['Open', 'In Progress', 'Resolved', 'Closed'])],
            'priority' => ['sometimes', Rule::in(['Low', 'Medium', 'High'])],
            'resolution_notes' => ['nullable', 'string', 'max:2000'],
            // The console offers a one-click "take this one" rather than a
            // staff picker, so the id is the signed-in administrator's own.
            'assign_to_me' => ['sometimes', 'boolean'],
        ];
    }
}
