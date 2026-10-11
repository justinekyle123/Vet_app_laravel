<?php

namespace App\Services\Portal;

use App\Models\Appointment;
use App\Models\AppointmentStatus;
use App\Models\DogOwner;
use Illuminate\Database\Eloquent\Builder;

/**
 * Reads an owner's own appointments for the portal.
 *
 * Shared by the portal dashboard and the appointments page so both show the
 * same record in the same shape, and both are scoped to the signed-in owner —
 * an owner can never load another client's bookings.
 *
 * A visit is split by what is still going to happen rather than by the calendar
 * alone: a cancelled booking dated next month is history, not an upcoming
 * visit, and it never disappears from the record.
 */
class OwnerAppointments
{
    /** Eager-loaded relations and the columns each one needs. */
    private const RELATIONS = [
        'dog:dog_id,dog_name',
        'service:service_id,service_name,duration_minutes,price',
        'staff:staff_id,first_name,last_name',
        'status:status_id,status_name',
        'feedback:feedback_id,appointment_id,rating,comment,created_at',
    ];

    /** The history filters the appointments page offers. */
    public const HISTORY_FILTERS = ['all', 'completed', 'cancelled'];

    /**
     * Visits that are still going ahead, soonest first.
     *
     * @return list<array<string, mixed>>
     */
    public function upcoming(DogOwner $owner, int $limit = 20): array
    {
        return $this->query($owner)
            ->whereDate('appointment_date', '>=', today())
            ->whereIn('status_id', $this->statusIds(AppointmentStatus::SCHEDULED))
            ->orderBy('appointment_date')
            ->orderBy('appointment_time')
            ->limit($limit)
            ->get()
            ->map(fn (Appointment $appointment) => $this->present($appointment))
            ->all();
    }

    /**
     * How many visits are still going ahead, for the page's summary.
     */
    public function upcomingCount(DogOwner $owner): int
    {
        return $this->query($owner)
            ->whereDate('appointment_date', '>=', today())
            ->whereIn('status_id', $this->statusIds(AppointmentStatus::SCHEDULED))
            ->count();
    }

    /**
     * Everything that has already happened or been called off, most recent
     * first. `$filter` narrows it to the completed visits or the cancelled and
     * missed ones.
     *
     * @return list<array<string, mixed>>
     */
    public function past(DogOwner $owner, int $limit = 20, string $filter = 'all'): array
    {
        $query = $this->query($owner)
            ->where(function (Builder $history) {
                // Either the day has passed, or the booking is no longer going
                // ahead — whichever came first.
                $history
                    ->whereDate('appointment_date', '<', today())
                    ->orWhereNotIn('status_id', $this->statusIds(AppointmentStatus::SCHEDULED));
            })
            ->orderByDesc('appointment_date')
            ->orderByDesc('appointment_time');

        if ($filter === 'completed') {
            $query->whereIn('status_id', $this->statusIds(['Completed']));
        } elseif ($filter === 'cancelled') {
            $query->whereIn('status_id', $this->statusIds(['Cancelled', 'No-show']));
        }

        return $query
            ->limit($limit)
            ->get()
            ->map(fn (Appointment $appointment) => $this->present($appointment))
            ->all();
    }

    /**
     * The numbers behind the appointments page header.
     *
     * @return array{upcoming: int, completed: int, cancelled: int, awaiting_review: int, spend: string}
     */
    public function summary(DogOwner $owner): array
    {
        $completedId = $this->statusIds(['Completed']);

        $spend = Appointment::query()
            ->where('appointments.owner_id', $owner->owner_id)
            ->whereIn('status_id', $completedId)
            ->join('services', 'services.service_id', '=', 'appointments.service_id')
            ->sum('services.price');

        return [
            'upcoming' => $this->upcomingCount($owner),
            'completed' => $this->query($owner)->whereIn('status_id', $completedId)->count(),
            'cancelled' => $this->query($owner)
                ->whereIn('status_id', $this->statusIds(['Cancelled', 'No-show']))
                ->count(),
            // Completed visits the client has not rated yet — the portal's
            // prompt to say how it went.
            'awaiting_review' => $this->query($owner)
                ->whereIn('status_id', $completedId)
                ->whereDoesntHave('feedback')
                ->count(),
            'spend' => number_format((float) $spend, 2, '.', ''),
        ];
    }

    /**
     * One appointment as the portal renders it.
     *
     * @return array<string, mixed>
     */
    public function present(Appointment $appointment): array
    {
        $appointment->loadMissing(self::RELATIONS);

        $status = $appointment->status?->status_name;
        $feedback = $appointment->feedback;

        return [
            'id' => $appointment->appointment_id,
            'date' => $appointment->appointment_date?->toDateString(),
            // `time` columns come back as HH:MM:SS; the UI only shows HH:MM.
            'time' => substr((string) $appointment->appointment_time, 0, 5),
            'status' => $status,
            // The portal offers a Cancel action only while the clinic can still
            // call the visit off.
            'cancellable' => in_array($status, AppointmentStatus::CANCELLABLE, true),
            // A completed visit the client has not reviewed yet can be rated
            // from here; one that already has a review shows it instead.
            'reviewable' => $status === 'Completed' && $feedback === null,
            'feedback' => $feedback === null ? null : [
                'rating' => $feedback->rating,
                'comment' => $feedback->comment,
                'date' => $feedback->created_at?->toDateString(),
            ],
            'dog' => $appointment->dog?->dog_name,
            'dog_id' => $appointment->dog_id,
            'service' => $appointment->service?->service_name,
            // Kept so a past visit can be booked again from its own row.
            'service_id' => $appointment->service_id,
            'duration_minutes' => $appointment->service?->duration_minutes,
            'price' => $appointment->service?->price,
            'staff' => $appointment->staff?->fullName(),
            'notes' => $appointment->notes,
        ];
    }

    /**
     * The status ids behind a list of status names. A name the clinic has never
     * used simply matches nothing.
     *
     * @param  list<string>  $names
     * @return list<int>
     */
    private function statusIds(array $names): array
    {
        return AppointmentStatus::query()
            ->whereIn('status_name', $names)
            ->pluck('status_id')
            ->all();
    }

    /**
     * @return Builder<Appointment>
     */
    private function query(DogOwner $owner)
    {
        return Appointment::query()
            ->where('owner_id', $owner->owner_id)
            ->with(self::RELATIONS);
    }
}
