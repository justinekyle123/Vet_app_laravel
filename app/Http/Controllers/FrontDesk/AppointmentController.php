<?php

namespace App\Http\Controllers\FrontDesk;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\AppointmentStatus;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;

/**
 * The desk's control over a visit's state: confirming the requests that arrive
 * from the owner portal, and cancelling a visit that will not go ahead.
 *
 * Transitions are whitelisted rather than free-form. A completed or no-show
 * visit is history, and re-opening it would rewrite the record the clinic
 * reports on; a cancelled one should be asked for again, not revived.
 */
class AppointmentController extends Controller
{
    /** States a visit may be confirmed from. */
    private const CONFIRMABLE = ['Requested'];

    /** States a visit may be cancelled from. */
    private const CANCELLABLE = ['Requested', 'Confirmed'];

    /**
     * Confirm a visit the owner requested online.
     */
    public function confirm(Appointment $appointment): RedirectResponse
    {
        return $this->transition($appointment, 'Confirmed', self::CONFIRMABLE);
    }

    /**
     * Cancel a visit that is not going ahead, releasing its slot.
     */
    public function cancel(Appointment $appointment): RedirectResponse
    {
        return $this->transition($appointment, 'Cancelled', self::CANCELLABLE);
    }

    /**
     * Move a visit to a new state when its current state allows it.
     *
     * @param  list<string>  $from  the states this move is valid from
     */
    private function transition(
        Appointment $appointment,
        string $to,
        array $from,
    ): RedirectResponse {
        $current = $appointment->status?->status_name;

        if ($current === null) {
            throw ValidationException::withMessages([
                'appointment' => 'This visit has no status on record.',
            ]);
        }

        if (! in_array($current, $from, true)) {
            throw ValidationException::withMessages([
                'appointment' => $current === $to
                    ? "This visit is already {$to}."
                    : "A {$current} visit cannot be marked as {$to}.",
            ]);
        }

        $appointment->update(['status_id' => $this->statusId($to)]);

        return back()->with('status', 'appointment-'.strtolower($to));
    }

    /**
     * The status id for a state name. Created on demand so a database seeded
     * without the lookup rows still accepts the change.
     */
    private function statusId(string $name): int
    {
        return AppointmentStatus::firstOrCreate(['status_name' => $name])->status_id;
    }
}
