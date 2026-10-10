<?php

namespace App\Services\Admin;

use App\Models\Appointment;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

/**
 * The administrator's notification feed for the console topbar.
 *
 * The only thing the clinic is notified about is a new booking request: an
 * appointment still sitting in the "Requested" state that is due today or
 * later. Like the owner portal, the schema has no per-user "read" flag, so what
 * has already been seen is tracked per browser session, as the newest
 * appointment id seen rather than a timestamp: `created_at` is written by the
 * database, whose clock can differ from PHP's.
 */
class AdminNotifications
{
    /** Session key holding the newest appointment id the admin has seen. */
    public const SEEN_ID_SESSION_KEY = 'admin.notifications_seen_id';

    /** How many requests the dropdown keeps in memory. */
    public const DROPDOWN_LIMIT = 8;

    public const STATUS = 'Requested';

    /**
     * The booking requests awaiting confirmation, soonest first.
     *
     * @return Collection<int, Appointment>
     */
    public function latest(int $limit = self::DROPDOWN_LIMIT): Collection
    {
        return $this->query()
            ->orderBy('appointment_date')
            ->orderBy('appointment_time')
            ->limit($limit)
            ->get();
    }

    /**
     * How many requests have arrived since the administrator last looked.
     *
     * Appointment ids are monotonic, so anything newer than the bookmark is
     * unseen. With no bookmark a fresh session counts every request, which
     * still shows the badge.
     */
    public function unreadCount(): int
    {
        $seenId = (int) session(self::SEEN_ID_SESSION_KEY, 0);

        return $this->query()
            ->where('appointment_id', '>', $seenId)
            ->count();
    }

    /**
     * Mark every request as seen, by moving the session bookmark to the newest
     * appointment id in the clinic.
     */
    public function markAllRead(Request $request): void
    {
        $latestId = (int) Appointment::query()->max('appointment_id');

        $request->session()->put(self::SEEN_ID_SESSION_KEY, $latestId);
    }

    /**
     * The shape the console bell consumes.
     *
     * @return list<array<string, mixed>>
     */
    public function shared(int $limit = self::DROPDOWN_LIMIT): array
    {
        return $this->latest($limit)
            ->map(fn (Appointment $appointment): array => [
                'id' => $appointment->appointment_id,
                'date' => $appointment->appointment_date?->toDateString(),
                'time' => substr((string) $appointment->appointment_time, 0, 5),
                'dog' => $appointment->dog?->dog_name,
                'owner' => $appointment->owner?->fullName(),
                'service' => $appointment->service?->service_name,
                'status' => $appointment->status?->status_name,
            ])
            ->all();
    }

    /**
     * Upcoming visits still awaiting confirmation.
     *
     * @return \Illuminate\Database\Eloquent\Builder<Appointment>
     */
    private function query()
    {
        return Appointment::query()
            ->with([
                'dog:dog_id,dog_name',
                'owner:owner_id,first_name,last_name',
                'service:service_id,service_name',
            ])
            ->whereHas('status', fn ($status) => $status->where('status_name', self::STATUS))
            ->whereDate('appointment_date', '>=', today());
    }
}
