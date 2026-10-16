<?php

namespace App\Services\Appointments;

use App\Models\Appointment;

/**
 * What the console may do next with a visit.
 *
 * The state machine lives here rather than in each page, so the operations
 * dashboard, the client's own record, and the endpoints that actually change a
 * booking all agree: the same visit offers the same actions wherever an
 * administrator happens to be looking, and a page never shows a button the
 * endpoint would refuse.
 */
class BookingActions
{
    /** The states a visit can still be accepted from. */
    private const CONFIRMABLE = ['Requested'];

    /** The states a visit can still be called off from. */
    private const CANCELLABLE = ['Requested', 'Confirmed'];

    /** The states a visit can be closed out — completed or missed — from. */
    private const CLOSABLE = ['Confirmed'];

    /**
     * The actions available on one visit.
     *
     * @return array{
     *     can_confirm: bool,
     *     can_complete: bool,
     *     can_no_show: bool,
     *     can_cancel: bool
     * }
     */
    public function for(Appointment $appointment): array
    {
        $status = $appointment->status?->status_name;

        return [
            'can_confirm' => in_array($status, self::CONFIRMABLE, true),
            // A visit can only be closed out once it is actually due, so a
            // future booking does not offer the action at all.
            'can_complete' => in_array($status, self::CLOSABLE, true)
                && ! $this->isScheduledInFuture($appointment),
            'can_no_show' => in_array($status, self::CLOSABLE, true),
            'can_cancel' => in_array($status, self::CANCELLABLE, true),
        ];
    }

    /** True when the visit's date and time are still ahead of the clinic. */
    public function isScheduledInFuture(Appointment $appointment): bool
    {
        if ($appointment->appointment_date === null) {
            return false;
        }

        $time = (string) ($appointment->appointment_time ?: '00:00:00');

        return $appointment->appointment_date
            ->copy()
            ->setTimeFromTimeString($time)
            ->isFuture();
    }
}
