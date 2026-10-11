<?php

namespace App\Http\Requests\Owner;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreReviewRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * The rating is the whole point of the form, so it is required; the written
     * comment is optional, and a client who only wants to tap a star count is
     * not forced to write anything.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'rating.required' => 'Choose a rating from one to five stars.',
            'rating.min' => 'Choose a rating from one to five stars.',
            'rating.max' => 'Choose a rating from one to five stars.',
        ];
    }
}
