<?php

namespace App\Http\Requests\Owner;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreComplaintRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * A complaint needs something to call it and something to say. Pointing it
     * at one of the client's own visits is optional, and is how the clinic gets
     * the context to answer properly.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'subject' => ['required', 'string', 'max:150'],
            'description' => ['required', 'string', 'max:2000'],
            'priority' => ['sometimes', Rule::in(['Low', 'Medium', 'High'])],
            // Ownership is checked in the controller: the visit must belong to
            // the client raising the complaint.
            'appointment_id' => ['nullable', 'integer', 'exists:appointments,appointment_id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'subject.required' => 'Give your complaint a short title.',
            'description.required' => 'Tell the clinic what happened.',
        ];
    }
}
