<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class SaveFaqRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * Used for both writing a new question and editing one. A question is
     * filed under a category the clinic already has, or under one typed into
     * `new_category` — exactly one of the two is required.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'question' => ['required', 'string', 'max:255'],
            'answer' => ['required', 'string', 'max:2000'],
            'faq_category_id' => [
                'nullable',
                'integer',
                'exists:faq_categories,faq_category_id',
                'required_without:new_category',
            ],
            // The faq_categories table stores a name only, so a brand new
            // category is just a name here; the controller creates it.
            'new_category' => ['nullable', 'string', 'max:100', 'required_without:faq_category_id'],
            'is_published' => ['boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'faq_category_id.required_without' => 'Choose a category, or name a new one.',
            'new_category.required_without' => 'Choose a category, or name a new one.',
        ];
    }
}
