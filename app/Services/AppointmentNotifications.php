<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Notification;

/**
 * The messages the clinic logs for an owner when a booking changes state.
 *
 * Rows land in the clinic's own `notifications` log, which is exactly what the
 * owner portal's bell reads from, so a decision made at the console surfaces on
 * the client's next visit without any extra delivery channel.
 */
class AppointmentNotifications
{
    /** The delivery channel recorded for an in-console message. */
    private const CHANNEL = 'Push';

    /**
     * The owner's requested visit has been accepted.
     */
    public function confirmed(Appointment $appointment): void
    {
        $this->record($appointment, sprintf(
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
        $this->record($appointment, sprintf(
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
        $this->record($appointment, sprintf(
            'Your %s on %s at %s has been cancelled by the clinic.',
            $this->subject($appointment),
            $this->date($appointment),
            $this->time($appointment),
        ));
    }

    /**
     * Log one delivered message against the owner and the visit it concerns.
     */
    private function record(Appointment $appointment, string $message): void
    {
        Notification::create([
            'owner_id' => $appointment->owner_id,
            'appointment_id' => $appointment->appointment_id,
            'channel' => self::CHANNEL,
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
