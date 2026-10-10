<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\AppointmentStatus;
use App\Services\AppointmentNotifications;
use Closure;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

/**
 * Administrator appointment state transitions.
 *
 * Only the transitions a desk actually needs are exposed: accept a request,
 * decline or call one off, close a confirmed visit as completed, or record a
 * no-show. Each returns a flash status the console turns into a toast, and the
 * two that change whether the client still has a booking also log a portal
 * notification.
 */
class OperationsAppointmentController extends Controller
{
    private const CONFIRMABLE = ['Requested'];
    private const CANCELLABLE = ['Requested', 'Confirmed'];
    private const COMPLETABLE = ['Confirmed'];
    private const MISSABLE = ['Confirmed'];

    public function confirm(
        Appointment $appointment,
        AppointmentNotifications $notifications,
    ): RedirectResponse {
        $response = $this->transition($appointment, 'Confirmed', self::CONFIRMABLE);

        $notifications->confirmed($appointment);

        return $response;
    }

    public function cancel(
        Appointment $appointment,
        AppointmentNotifications $notifications,
    ): RedirectResponse {
        // Read the state before it is changed, so the message can tell a
        // declined request apart from a cancelled confirmed visit.
        $previous = $appointment->status?->status_name;

        $response = $this->transition($appointment, 'Cancelled', self::CANCELLABLE);

        if ($previous === 'Confirmed') {
            $notifications->cancelled($appointment);
        } else {
            $notifications->declined($appointment);
        }

        return $response;
    }

    public function complete(Appointment $appointment): RedirectResponse
    {
        return $this->transition($appointment, 'Completed', self::COMPLETABLE, function () use ($appointment) {
            /*
             * A visit cannot be closed out before it is due: the appointment
             * date and time must already have arrived (or passed).
             */
            if ($this->isScheduledInFuture($appointment)) {
                throw ValidationException::withMessages([
                    'appointment' => 'This visit is scheduled for '
                        .$this->scheduledLabel($appointment)
                        .' and cannot be completed before then.',
                ]);
            }
        });
    }

    public function noShow(Appointment $appointment): RedirectResponse
    {
        return $this->transition($appointment, 'No-show', self::MISSABLE);
    }

    /**
     * @param list<string> $from
     * @param (callable(): void)|null $guard Extra check run once the status transition is known to be valid.
     */
    private function transition(
        Appointment $appointment,
        string $to,
        array $from,
        ?Closure $guard = null,
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

        if ($guard !== null) {
            $guard();
        }

        $appointment->update(['status_id' => $this->statusId($to)]);

        return back()->with('status', 'appointment-'.strtolower($to));
    }

    /**
     * The exact moment a visit is due, or null when the record has no date.
     */
    private function scheduledAt(Appointment $appointment): ?Carbon
    {
        if ($appointment->appointment_date === null) {
            return null;
        }

        $time = (string) ($appointment->appointment_time ?: '00:00:00');

        return $appointment->appointment_date->copy()->setTimeFromTimeString($time);
    }

    private function isScheduledInFuture(Appointment $appointment): bool
    {
        return $this->scheduledAt($appointment)?->isFuture() ?? false;
    }

    /** "Oct 12, 2026 at 10:00" for the refusal message. */
    private function scheduledLabel(Appointment $appointment): string
    {
        $date = $appointment->appointment_date?->format('M j, Y') ?? 'an unscheduled day';
        $time = substr((string) $appointment->appointment_time, 0, 5);

        return $time === '' ? $date : "{$date} at {$time}";
    }

    private function statusId(string $name): int
    {
        return AppointmentStatus::firstOrCreate(['status_name' => $name])->status_id;
    }
}
