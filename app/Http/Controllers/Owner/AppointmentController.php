<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Http\Requests\Owner\StoreAppointmentRequest;
use App\Http\Requests\Owner\StoreReviewRequest;
use App\Models\Appointment;
use App\Models\AppointmentStatus;
use App\Models\DogOwner;
use App\Models\Service;
use App\Services\Portal\BookingAvailability;
use App\Services\Portal\OwnerAppointments;
use App\Services\Portal\ServiceReviews;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use App\Services\Payments\PortalPayments;

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

        /*
         * The history filter is applied in the query rather than in the page,
         * so it spans the owner's whole record and not just the rows already
         * loaded. An unknown value falls back to showing everything.
         */
        $filter = (string) $request->query('history', 'all');

        if (! in_array($filter, OwnerAppointments::HISTORY_FILTERS, true)) {
            $filter = 'all';
        }

        return Inertia::render('Owner/Appointments', [
            'upcoming' => $appointments->upcoming($owner),
            'past' => $appointments->past($owner, filter: $filter),
            'historyFilter' => $filter,
            'summary' => $appointments->summary($owner),
        ]);
    }

    /**
     * Rate a visit the clinic has already carried out.
     *
     * Only the owner's own completed visits can be reviewed, only once, and
     * only by the client the visit belongs to: another client's appointment is
     * invisible here rather than forbidden.
     */
    public function review(
        StoreReviewRequest $request,
        Appointment $appointment,
        ServiceReviews $reviews,
    ): RedirectResponse {
        /** @var DogOwner $owner */
        $owner = $request->user();

        abort_unless($appointment->owner_id === $owner->owner_id, 404);

        if ($appointment->status?->status_name !== 'Completed') {
            throw ValidationException::withMessages([
                'rating' => 'Only a completed visit can be reviewed.',
            ]);
        }

        if ($appointment->feedback()->exists()) {
            throw ValidationException::withMessages([
                'rating' => 'This visit already has your review.',
            ]);
        }

        $data = $request->validated();
        $comment = trim((string) ($data['comment'] ?? ''));

        $reviews->record(
            $owner,
            $appointment,
            (int) $data['rating'],
            $comment === '' ? null : $comment,
        );

        return redirect()
            ->route('owner.appointments.index')
            ->with('status', 'review-submitted');
    }

    /**
     * Request a visit from the services page.
     *
     * The booking lands as "Requested" rather than "Confirmed": an owner picks
     * a service, day, and time, and the desk confirms it. The slot is re-checked
     * here so a request cannot slip into a window that filled up since the
     * calendar was loaded.
     *
     * A dog cannot be booked for the same service twice while an earlier visit
     * is still going ahead: the duplicate is refused until that visit is
     * completed or called off.
     *
     * The portal only takes a booking while online booking is open; the clinic
     * is reworking how one is placed, so for now the desk takes the booking
     * and this endpoint turns away anything sent from a page left open.
     */
    public function store(
        StoreAppointmentRequest $request,
        BookingAvailability $availability,
        OwnerAppointments $appointments,
        PortalPayments $payments,
    ): RedirectResponse {
        abort_unless(config('booking.online'), 404);

        /** @var DogOwner $owner */
        $owner = $request->user();
        $data = $request->validated();

        $service = Service::query()->findOrFail($data['service_id']);

        if ($appointments->hasUpcomingService($owner, (int) $data['dog_id'], $service->service_id)) {
            throw ValidationException::withMessages([
                'service_id' => "This dog already has an upcoming {$service->service_name} visit. You can book it again once that visit is completed.",
            ]);
        }

        if (! $availability->isBookable($service, $data['appointment_date'], $data['appointment_time'])) {
            throw ValidationException::withMessages([
                'appointment_time' => 'That time is no longer free. Please pick another slot.',
            ]);
        }

        $price = (float) $service->price;
        $paymentAmount = (float) $data['payment_amount'];

        if ($paymentAmount + 0.005 < $price / 2 || $paymentAmount > $price + 0.005) {
            throw ValidationException::withMessages([
                'payment_amount' => 'Pay at least 50% of the service price, or pay the full amount.',
            ]);
        }

        DB::transaction(function () use ($owner, $data, $service, $payments, $request, $paymentAmount): void {
            $appointment = $owner->appointments()->create([
                'dog_id' => $data['dog_id'],
                'service_id' => $service->service_id,
                'appointment_date' => $data['appointment_date'],
                'appointment_time' => $data['appointment_time'],
                'status_id' => $this->requestedStatusId(),
                'notes' => $data['notes'] ?? null,
            ]);

            $payments->pay(
                $appointment->load('service', 'status'),
                $data['payment_method'],
                $paymentAmount,
                $data['payment_reference'] ?? null,
                $request->file('payment_proof')->store('payment-proofs', 'public'),
            );
        });

        if ($request->input('booking_flow') === 'wizard') {
            return redirect()
                ->route('owner.booking')
                ->with('booking-requested', true);
        }

        return redirect()
            ->route('owner.appointments.index')
            ->with('status', 'appointment-requested');
    }

    public function reschedule(
        Request $request,
        Appointment $appointment,
        BookingAvailability $availability,
    ): RedirectResponse
    {
        /** @var DogOwner $owner */
        $owner = $request->user();

        abort_unless($appointment->owner_id === $owner->owner_id, 404);

        if (! in_array($appointment->status?->status_name, AppointmentStatus::SCHEDULED, true)) {
            throw ValidationException::withMessages([
                'appointment' => 'Only a requested or confirmed visit can be rescheduled.',
            ]);
        }

        $data = $request->validate([
            'appointment_date' => ['required', 'date', 'after_or_equal:today'],
            'appointment_time' => ['required', 'date_format:H:i'],
        ]);

        $appointment->loadMissing('service');

        if (! $availability->isBookable($appointment->service, $data['appointment_date'], $data['appointment_time'], $appointment->appointment_id)) {
            throw ValidationException::withMessages([
                'appointment_time' => 'That time is no longer free. Please pick another slot.',
            ]);
        }

        $appointment->update([
            'appointment_date' => $data['appointment_date'],
            'appointment_time' => $data['appointment_time'],
        ]);

        return redirect()
            ->route('owner.appointments.index')
            ->with('status', 'appointment-rescheduled');
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
