<?php

namespace App\Services\Admin;

use App\Models\Appointment;
use App\Models\Payment;
use App\Services\Payments\PortalPayments;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

/**
 * The administrator's notification feed for the console topbar.
 *
 * Two things the clinic wants telling about straight away: a new booking
 * request, and money arriving. A request is an appointment still sitting in
 * the "Requested" state that is due today or later; a payment is any settled
 * payment the portal took, whether the client paid ahead of the visit or after
 * it was carried out.
 *
 * Like the owner portal, the schema has no per-user "read" flag, so what has
 * already been seen is tracked per browser session — as the newest appointment
 * id and the newest payment id seen, rather than a timestamp: `created_at` is
 * written by the database, whose clock can differ from PHP's. Both keys are
 * monotonic, so anything newer than the bookmark is unseen.
 */
class AdminNotifications
{
    /** Session key holding the newest appointment id the admin has seen. */
    public const SEEN_ID_SESSION_KEY = 'admin.notifications_seen_id';

    /** Session key holding the newest payment id the admin has seen. */
    public const PAYMENTS_SEEN_ID_SESSION_KEY = 'admin.payments_seen_id';

    /** How many of each the dropdown keeps in memory. */
    public const DROPDOWN_LIMIT = 8;

    public const STATUS = 'Requested';

    public function __construct(private PortalPayments $payments) {}

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
     * The payments the portal has taken, newest first.
     *
     * @return Collection<int, Payment>
     */
    public function latestPayments(int $limit = self::DROPDOWN_LIMIT): Collection
    {
        return Payment::query()
            ->where('payment_status', Payment::STATUS_PAID)
            ->with(self::PAYMENT_RELATIONS)
            ->orderByDesc('payment_id')
            ->limit($limit)
            ->get();
    }

    /**
     * Everything waiting for the administrator's attention: requests plus
     * payments that arrived since they last looked.
     *
     * With no bookmark a fresh session counts all of it, which is what puts the
     * badge up on a first sign-in.
     */
    public function unreadCount(): int
    {
        $seenAppointment = (int) session(self::SEEN_ID_SESSION_KEY, 0);
        $seenPayment = (int) session(self::PAYMENTS_SEEN_ID_SESSION_KEY, 0);

        return $this->query()
            ->where('appointment_id', '>', $seenAppointment)
            ->count()
            + Payment::query()
                ->where('payment_status', Payment::STATUS_PAID)
                ->where('payment_id', '>', $seenPayment)
                ->count();
    }

    /**
     * Mark both feeds as seen, by moving the session bookmarks to the newest
     * appointment and payment ids in the clinic.
     */
    public function markAllRead(Request $request): void
    {
        $request->session()->put(
            self::SEEN_ID_SESSION_KEY,
            (int) Appointment::query()->max('appointment_id'),
        );

        $request->session()->put(
            self::PAYMENTS_SEEN_ID_SESSION_KEY,
            (int) Payment::query()->max('payment_id'),
        );
    }

    /**
     * The booking requests, in the shape the console bell consumes.
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
     * The payments, in the shape the console bell consumes: how much, through
     * which channel, for whose visit, and whether the visit is settled by it.
     *
     * @return list<array<string, mixed>>
     */
    public function sharedPayments(int $limit = self::DROPDOWN_LIMIT): array
    {
        return $this->latestPayments($limit)
            ->map(fn (Payment $payment): array => $this->payments->paymentSummary($payment))
            ->all();
    }

    /**
     * Upcoming visits still awaiting confirmation.
     *
     * @return Builder<Appointment>
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

    /**
     * Everything a payment needs to be read back as a sentence: the channel it
     * came through, and the visit it settled.
     *
     * @var list<string>
     */
    private const PAYMENT_RELATIONS = [
        'method:method_id,method_name',
        'appointment:appointment_id,owner_id,dog_id,service_id,appointment_date,appointment_time,status_id',
        'appointment.dog:dog_id,dog_name',
        'appointment.owner:owner_id,first_name,last_name',
        'appointment.service:service_id,service_name,price',
        'appointment.status:status_id,status_name',
        'appointment.payments:payment_id,appointment_id,amount,payment_status,method_id',
        'appointment.payments.method:method_id,method_name',
    ];
}
