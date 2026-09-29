<?php

namespace App\Http\Requests\Owner;

use App\Models\DogOwner;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * A booking the owner makes from the services page.
 *
 * The dog must be one of the owner's own active dogs, and the service must
 * still be on the clinic's active menu. Whether the chosen slot is actually
 * free is decided against the live calendar in the controller, where a clash
 * can be reported against the time field.
 */
class StoreAppointmentRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var DogOwner $owner */
        $owner = $this->user();

        return [
            'service_id' => [
                'required',
                'integer',
                Rule::exists('services', 'service_id')->where('is_active', true),
            ],
            'dog_id' => [
                'required',
                'integer',
                Rule::exists('dogs', 'dog_id')
                    ->where('owner_id', $owner->owner_id)
                    ->where('is_active', true),
            ],
            'appointment_date' => ['required', 'date', 'after_or_equal:today'],
            'appointment_time' => ['required', 'date_format:H:i'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }
}
