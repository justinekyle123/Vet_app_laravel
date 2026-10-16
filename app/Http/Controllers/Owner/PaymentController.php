<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\DogOwner;
use App\Services\Payments\PortalPayments;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Online payment for the owner's own visits.
 *
 * The clinic takes this payment itself — there is no gateway and no card
 * details anywhere in the portal. A visit the desk has confirmed, or already
 * carried out, can be settled from the appointments page: the owner chooses
 * GCash, Maya, a card, or a bank transfer, and the payment is recorded against
 * the visit. The desk matches the money against its own wallet or bank
 * statement using the reference number when the client gives one.
 *
 * Paying ahead may be split — a deposit now, the rest at the desk — while a
 * visit the clinic has already carried out is due in full. That rule lives in
 * {@see PortalPayments}; this controller only checks the shape of the request.
 */
class PaymentController extends Controller
{
    /**
     * Record a payment for a visit the signed-in owner is paying for.
     *
     * `amount` is left out by the portal when the client is settling the whole
     * balance, which is the common case.
     */
    public function store(
        Request $request,
        Appointment $appointment,
        PortalPayments $payments,
    ): RedirectResponse {
        /** @var DogOwner $owner */
        $owner = $request->user();

        abort_unless($appointment->owner_id === $owner->owner_id, 404);

        if (! in_array($appointment->status?->status_name, PortalPayments::PAYABLE_STATUSES, true)) {
            throw ValidationException::withMessages([
                'payment' => 'Only a confirmed or completed visit can be paid from the portal.',
            ]);
        }

        $appointment->loadMissing('service');

        if ($payments->balance($appointment) <= 0) {
            throw ValidationException::withMessages([
                'payment' => 'This visit has already been paid.',
            ]);
        }

        $validated = $request->validate([
            'method' => ['required', 'string', Rule::in($payments->methodNames())],
            'amount' => ['nullable', 'numeric', 'min:0.01'],
            'reference' => ['nullable', 'string', 'max:60'],
            'payment_proof' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ], [
            'method.required' => 'Choose how you would like to pay.',
            'method.in' => 'That payment method is not one the clinic offers.',
            'amount.numeric' => 'Enter the amount as a number, for example 1500 or 1500.50.',
            'amount.min' => 'Enter how much you would like to pay.',
            'reference.max' => 'A reference number is at most 60 characters.',
            'payment_proof.required' => 'Upload a screenshot or photo of your payment confirmation.',
            'payment_proof.image' => 'The payment proof must be an image.',
            'payment_proof.max' => 'Payment proof must be 5 MB or smaller.',
        ]);

        /** @var UploadedFile $proof */
        $proof = $validated['payment_proof'];
        $proofPath = $proof->store('payment-proofs', 'public');

        $payment = $payments->pay(
            $appointment,
            $validated['method'],
            isset($validated['amount']) ? (float) $validated['amount'] : null,
            $validated['reference'] ?? null,
            $proofPath,
        );

        if ($payment === null) {
            throw ValidationException::withMessages([
                'payment' => 'This visit has already been paid.',
            ]);
        }

        // Back to the page the client paid from — the row now reads as paid —
        // with the banner confirming what was taken.
        return back()->with('status', 'payment-paid');
    }
}
