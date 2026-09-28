<?php

namespace App\Http\Requests\Admin;

use App\Models\Service;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveServiceRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * Used for both creating a service and editing one, so the name uniqueness
     * check ignores the service being edited.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $service = $this->route('service');

        return [
            'service_name' => [
                'required',
                'string',
                'max:150',
                Rule::unique(Service::class, 'service_name')->ignore($service?->service_id, 'service_id'),
            ],
            // The schema makes a service's category mandatory.
            'category_id' => ['required', 'integer', 'exists:service_categories,category_id'],
            'description' => ['nullable', 'string', 'max:1000'],
            'duration_minutes' => ['required', 'integer', 'min:5', 'max:600'],
            'price' => ['required', 'numeric', 'min:0', 'max:99999999'],
            'is_active' => ['boolean'],
        ];
    }
}
