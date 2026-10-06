<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Http\Requests\Owner\StoreAppointmentRequest;
use App\Models\Appointment;
use App\Models\AppointmentStatus;
use App\Models\DogOwner;
use App\Models\Service;
use App\Services\Portal\BookingAvailability;
use App\Services\Portal\OwnerAppointments;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The owner's own visits, split into what is coming up and what has happened,
 * plus the online booking the services page sends here.
 */
class AppointmentController extends Controller
{
    public function index(Request $request, OwnerAppointments $appointments): Response
    {
        /** @var DogOwner $owner */
        $owner = $request->user();

        return Inertia::render('Owner/Appointments', [
            'upcoming' => $appointments->upcoming($owner),
            'past' => $appointments->past($owner),
        ]);
    }

    /**
     * Request a visit from the services page.
     *
     * The booking lands as "Requested" rather than "Confirmed": an owner picks
     * a service, day, and time, and the desk confirms it. The slot is re-checked
     * here so a request cannot slip into a window that filled up since the
     * calendar was loaded.
     */
    public function store(
        StoreAppointmentRequest $request,
        BookingAvailability $availability,
    ): RedirectResponse {
        /** @var DogOwner $owner */
        $owner = $request->user();
        $data = $request->validated();

        $service = Service::query()->findOrFail($data['service_id']);

        if (! $availability->isBookable($service, $data['appointment_date'], $data['appointment_time'])) {
            throw ValidationException::withMessages([
                'appointment_time' => 'That time is no longer free. Please pick another slot.',
            ]);
        }

        $owner->appointments()->create([
            'dog_id' => $data['dog_id'],
            'service_id' => $service->service_id,
            'appointment_date' => $data['appointment_date'],
            'appointment_time' => $data['appointment_time'],
            'status_id' => $this->requestedStatusId(),
            'notes' => $data['notes'] ?? null,
        ]);

        return redirect()
            ->route('owner.appointments.index')
            ->with('status', 'appointment-requested');
    }

    /**
     * Cancel one of the owner's own visits.
     *
     * Only a visit the clinic has not carried out yet — requested or
     * confirmed — can be cancelled; a completed, cancelled, or missed record
     * is history and is left alone. The check is scoped to the signed-in
     * owner, so another client's appointment is invisible rather than
     * forbidden.
     */
    public function cancel(Request $request, Appointment $appointment): RedirectResponse
    {
        /** @var DogOwner $owner */
        $owner = $request->user();

        abort_unless($appointment->owner_id === $owner->owner_id, 404);

        if (! in_array($appointment->status?->status_name, AppointmentStatus::CANCELLABLE, true)) {
            throw ValidationException::withMessages([
                'appointment' => 'Only a requested or confirmed visit can be cancelled.',
            ]);
        }

        $appointment->update([
            'status_id' => AppointmentStatus::firstOrCreate(['status_name' => 'Cancelled'])->status_id,
        ]);

        return redirect()
            ->route('owner.appointments.index')
            ->with('status', 'appointment-cancelled');
    }

    /**
     * The "Requested" status id. Created on demand so a database seeded without
     * the lookup rows still accepts a booking.
     */
    private function requestedStatusId(): int
    {
        return AppointmentStatus::firstOrCreate(['status_name' => 'Requested'])->status_id;
    }
}
