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
            'payment_method' => [
                'required',
                'string',
                Rule::in(array_column(config('payments.methods', []), 'name')),
            ],
            'payment_amount' => ['required', 'numeric', 'min:0.01'],
            'payment_reference' => ['nullable', 'string', 'max:60'],
            'payment_proof' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ];
    }

    /**
     * The wording for the money fields, matching the checkout they were filled
     * in on rather than the schema's field names.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'payment_method.required' => 'Choose how you would like to pay.',
            'payment_method.in' => 'That payment method is not one the clinic offers.',
            'payment_amount.required' => 'Enter how much you would like to pay.',
            'payment_amount.numeric' => 'Enter the amount as a number, for example 1500 or 1500.50.',
            'payment_amount.min' => 'Pay at least 50% of the service price, or the full amount.',
            'payment_reference.max' => 'A reference number is at most 60 characters.',
            'payment_proof.required' => 'Upload a screenshot or photo of your payment confirmation.',
            'payment_proof.image' => 'The payment proof must be an image.',
            'payment_proof.mimes' => 'The payment proof must be a JPG, PNG, or WEBP image.',
            'payment_proof.max' => 'Payment proof must be 5 MB or smaller.',
        ];
    }
}
