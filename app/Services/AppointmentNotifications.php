<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Notification;
use App\Services\Sms\SmsGateway;

/**
 * The messages the clinic sends an owner when a booking changes state.
 *
 * Rows land in the clinic's own `notifications` log, which is exactly what the
 * owner portal's bell reads from, so a decision made at the console surfaces on
 * the client's next visit. When the Android SMS Gateway is configured the same
 * message is also texted to the owner's mobile, and the logged channel records
 * which of the two deliveries actually carried it.
 */
class AppointmentNotifications
{
    /** The delivery channel recorded when a text was actually sent. */
    private const SMS_CHANNEL = 'SMS';

    /** The delivery channel recorded when only the portal received it. */
    private const PUSH_CHANNEL = 'Push';

    public function __construct(private SmsGateway $sms) {}

    /**
     * The owner's requested visit has been accepted.
     */
    public function confirmed(Appointment $appointment): void
    {
        $this->deliver($appointment, sprintf(
            'Good news: your %s on %s at %s is confirmed.',
            $this->subject($appointment),
            $this->date($appointment),
            $this->time($appointment),
        ));
    }

    /**
     * The owner's requested visit could not be accepted.
     */
    public function declined(Appointment $appointment): void
    {
        $this->deliver($appointment, sprintf(
            'Sorry: your %s request for %s at %s could not be accepted. Call the clinic to rebook.',
            $this->subject($appointment),
            $this->date($appointment),
            $this->time($appointment),
        ));
    }

    /**
     * A visit that had been confirmed has been called off by the clinic.
     */
    public function cancelled(Appointment $appointment): void
    {
        $this->deliver($appointment, sprintf(
            'Your %s on %s at %s has been cancelled by the clinic.',
            $this->subject($appointment),
            $this->date($appointment),
            $this->time($appointment),
        ));
    }

    /**
     * A confirmed visit has been called off, and the clinic is holding money
     * for the client: the message says how much and where to collect it, so a
     * refund is never something the owner has to chase up.
     */
    public function cancelledWithRefund(Appointment $appointment, float $refunded): void
    {
        $this->deliver($appointment, sprintf(
            'Your %s on %s at %s has been cancelled by the clinic. We are refunding %s — collect it at the front desk, or call the clinic to have it sent back through the channel you paid with.',
            $this->subject($appointment),
            $this->date($appointment),
            $this->time($appointment),
            $this->money($refunded),
        ));
    }

    /**
     * A request that could not be accepted, with the deposit it carried going
     * back to the client the same way.
     */
    public function declinedWithRefund(Appointment $appointment, float $refunded): void
    {
        $this->deliver($appointment, sprintf(
            'Sorry: your %s request for %s at %s could not be accepted. We are refunding %s — collect it at the front desk, or call the clinic to have it sent back through the channel you paid with.',
            $this->subject($appointment),
            $this->date($appointment),
            $this->time($appointment),
            $this->money($refunded),
        ));
    }

    /**
     * The owner has paid for their visit from the portal.
     *
     * A part payment says what is still owed, so the client is never left
     * thinking a split visit is settled.
     */
    public function paid(
        Appointment $appointment,
        float $amount,
        float $remaining = 0,
        bool $settled = true,
    ): void {
        $paid = $this->money($amount);

        if (! $settled && $remaining > 0) {
            $this->deliver($appointment, sprintf(
                'Thank you: we have received %s towards your %s on %s at %s. %s is still due.',
                $paid,
                $this->subject($appointment),
                $this->date($appointment),
                $this->time($appointment),
                $this->money($remaining),
            ));

            return;
        }

        $this->deliver($appointment, sprintf(
            'Thank you: your %s payment for the %s on %s at %s has been received in full.',
            $paid,
            $this->subject($appointment),
            $this->date($appointment),
            $this->time($appointment),
        ));
    }

    /** An amount as the message quotes it. */
    private function money(float $value): string
    {
        return '$'.number_format($value, 2);
    }

    /**
     * Text the owner (when possible) and log one row against the owner and the
     * visit it concerns.
     *
     * The text is attempted first so the logged channel and status describe the
     * delivery that actually happened. A failed or skipped text still leaves the
     * message in the portal, recorded as a "Sent" push, so the owner is never
     * left without the update.
     */
    private function deliver(Appointment $appointment, string $message): void
    {
        if ($this->sms->isConfigured()) {
            $sent = $this->sms->send($appointment->owner?->phone_number, $message);

            Notification::create([
                'owner_id' => $appointment->owner_id,
                'appointment_id' => $appointment->appointment_id,
                'channel' => self::SMS_CHANNEL,
                'message' => $message,
                'status' => $sent ? 'Sent' : 'Failed',
                'sent_at' => $sent ? now() : null,
            ]);

            return;
        }

        Notification::create([
            'owner_id' => $appointment->owner_id,
            'appointment_id' => $appointment->appointment_id,
            'channel' => self::PUSH_CHANNEL,
            'message' => $message,
            'status' => 'Sent',
            'sent_at' => now(),
        ]);
    }

    /** What the visit is, for the sentence. */
    private function subject(Appointment $appointment): string
    {
        return $appointment->service?->service_name ?? 'appointment';
    }

    private function date(Appointment $appointment): string
    {
        return $appointment->appointment_date?->format('M j, Y') ?? 'the scheduled day';
    }

    private function time(Appointment $appointment): string
    {
        return substr((string) $appointment->appointment_time, 0, 5) ?: 'the scheduled time';
    }
}
