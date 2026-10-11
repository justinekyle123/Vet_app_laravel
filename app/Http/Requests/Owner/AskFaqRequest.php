<?php

namespace App\Http\Requests\Owner;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class AskFaqRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * The chat only reads published questions and writes nothing, so the limit
     * is there to keep a pasted wall of text out of the matcher, not to protect
     * a record.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'message' => ['required', 'string', 'max:500'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'message.required' => 'Type your question first.',
        ];
    }
}
