<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\AppointmentStatus;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;

/** Administrator appointment state transitions. */
class OperationsAppointmentController extends Controller
{
    private const CONFIRMABLE = ['Requested'];
    private const CANCELLABLE = ['Requested', 'Confirmed'];

    public function confirm(Appointment $appointment): RedirectResponse
    {
        return $this->transition($appointment, 'Confirmed', self::CONFIRMABLE);
    }

    public function cancel(Appointment $appointment): RedirectResponse
    {
        return $this->transition($appointment, 'Cancelled', self::CANCELLABLE);
    }

    /** @param list<string> $from */
    private function transition(Appointment $appointment, string $to, array $from): RedirectResponse
    {
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

    private function statusId(string $name): int
    {
        return AppointmentStatus::firstOrCreate(['status_name' => $name])->status_id;
    }
}
