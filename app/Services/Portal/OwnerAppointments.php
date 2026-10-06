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
 */
class OwnerAppointments
{
    /** Eager-loaded relations and the columns each one needs. */
    private const RELATIONS = [
        'dog:dog_id,dog_name',
        'service:service_id,service_name,duration_minutes,price',
        'staff:staff_id,first_name,last_name',
        'status:status_id,status_name',
    ];

    /**
     * Bookings from today onwards, soonest first.
     *
     * @return list<array<string, mixed>>
     */
    public function upcoming(DogOwner $owner, int $limit = 20): array
    {
        return $this->query($owner)
            ->whereDate('appointment_date', '>=', today())
            ->orderBy('appointment_date')
            ->orderBy('appointment_time')
            ->limit($limit)
            ->get()
            ->map(fn (Appointment $appointment) => $this->present($appointment))
            ->all();
    }

    /**
     * Bookings before today, most recent first.
     *
     * @return list<array<string, mixed>>
     */
    public function past(DogOwner $owner, int $limit = 20): array
    {
        return $this->query($owner)
            ->whereDate('appointment_date', '<', today())
            ->orderByDesc('appointment_date')
            ->orderByDesc('appointment_time')
            ->limit($limit)
            ->get()
            ->map(fn (Appointment $appointment) => $this->present($appointment))
            ->all();
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

        return [
            'id' => $appointment->appointment_id,
            'date' => $appointment->appointment_date?->toDateString(),
            // `time` columns come back as HH:MM:SS; the UI only shows HH:MM.
            'time' => substr((string) $appointment->appointment_time, 0, 5),
            'status' => $status,
            // The portal offers a Cancel action only while the clinic can still
            // call the visit off.
            'cancellable' => in_array($status, AppointmentStatus::CANCELLABLE, true),
            'dog' => $appointment->dog?->dog_name,
            'dog_id' => $appointment->dog_id,
            'service' => $appointment->service?->service_name,
            'duration_minutes' => $appointment->service?->duration_minutes,
            'price' => $appointment->service?->price,
            'staff' => $appointment->staff?->fullName(),
            'notes' => $appointment->notes,
        ];
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
