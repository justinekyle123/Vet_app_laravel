<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\AppointmentStatus;
use App\Models\Payment;
use App\Services\Payments\PortalPayments;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The administrator's working view: today's bookings, what is coming up, the
 * money the clinic has taken, and the operational tasks it manages.
 *
 * The page is driven entirely by query parameters so a desk can bookmark or
 * share a view: `status` narrows to one appointment state and `q` searches the
 * client, dog, and service. Totals deliberately ignore the filters, so the
 * headline numbers do not move as the desk narrows the list.
 *
 * Every visit carries its own money story (`settlement`), and the payments
 * themselves are listed newest first, so the desk can answer "has this one
 * been paid for?" without opening anything else.
 */
class OperationsDashboardController extends Controller
{
    private const UPCOMING_LIMIT = 15;

    /** How many payments the transactions list keeps. */
    private const TRANSACTION_LIMIT = 10;

    /** How many unpaid visits the "who owes" list keeps. */
    private const DEBT_LIMIT = 6;

    /**
     * How far back an unpaid completed visit still counts as money owed. Older
     * debts are the accountant's problem, not the desk's.
     */
    private const OUTSTANDING_WINDOW_DAYS = 90;

    private const ALL_STATUSES = 'all';

    private const STATUS_ORDER = ['Requested', 'Confirmed', 'Completed', 'Cancelled', 'No-show'];

    /** The states a visit can still be paid for from. */
    private const OPEN_STATUSES = ['Confirmed', 'Completed'];

    private const RELATIONS = [
        'dog:dog_id,dog_name',
        'owner:owner_id,first_name,last_name,email,phone_number',
        'service:service_id,service_name,duration_minutes,price',
        'staff:staff_id,first_name,last_name',
        'status:status_id,status_name',
        'payments:payment_id,appointment_id,amount,payment_status,method_id',
        'payments.method:method_id,method_name',
    ];

    /**
     * The payment bookkeeping, shared with the owner portal so a visit's
     * balance means the same thing on both sides of the desk.
     */
    public function __construct(private PortalPayments $payments) {}

    public function __invoke(Request $request): Response
    {
        $statusNames = $this->statusNames();
        $requested = (string) $request->query('status', self::ALL_STATUSES);
        $status = in_array($requested, $statusNames, true) ? $requested : self::ALL_STATUSES;
        $search = trim((string) $request->query('q', ''));

        $today = $this->query($status, $search)
            ->whereDate('appointment_date', today())
            ->orderBy('appointment_time')
            ->get();

        $upcoming = $this->query($status, $search)
            ->whereDate('appointment_date', '>', today())
            ->orderBy('appointment_date')
            ->orderBy('appointment_time')
            ->limit(self::UPCOMING_LIMIT)
            ->get();

        // The visits the clinic can still be paid for, read once and used for
        // both the money totals and the list of who owes what.
        $open = $this->openVisits();

        return Inertia::render('FrontDesk/Dashboard', [
            'today' => $today->map(fn (Appointment $appointment) => $this->present($appointment))->all(),
            'upcoming' => $upcoming->map(fn (Appointment $appointment) => $this->present($appointment))->all(),
            'filter' => [
                'status' => $status,
                'q' => $search,
            ],
            'statusOptions' => [
                ['value' => self::ALL_STATUSES, 'label' => 'All'],
                ...array_map(fn (string $name): array => ['value' => $name, 'label' => $name], $statusNames),
            ],
            'upcomingLimit' => self::UPCOMING_LIMIT,
            'stats' => $this->stats(),
            'transactions' => $this->transactions(),
            'money' => $this->money($open),
            'debts' => $this->debts($open),
            'transactionLimit' => self::TRANSACTION_LIMIT,
        ]);
    }

    /**
     * The headline numbers. These are counted from the full day regardless of
     * the active filters, so they behave like a scoreboard rather than a
     * reflection of the current search.
     *
     * @return array<string, int>
     */
    private function stats(): array
    {
        return [
            'today' => Appointment::query()->whereDate('appointment_date', today())->count(),
            'upcoming' => Appointment::query()->whereDate('appointment_date', '>', today())->count(),
            'requested' => Appointment::query()
                ->whereDate('appointment_date', '>=', today())
                ->whereHas('status', fn ($status) => $status->where('status_name', 'Requested'))
                ->count(),
            'confirmed_today' => $this->todayIn('Confirmed'),
            'completed_today' => $this->todayIn('Completed'),
            'cancelled_today' => $this->todayIn(['Cancelled', 'No-show']),
        ];
    }

    /**
     * The visits the clinic can still take money for: everything booked ahead,
     * plus completed visits from the last {@see self::OUTSTANDING_WINDOW_DAYS}
     * days. A client who walked out without settling is exactly who the desk
     * needs to see; older debts are the accountant's business, not the desk's,
     * so they are left out rather than folded into a figure nobody can act on.
     *
     * @return Collection<int, Appointment>
     */
    private function openVisits(): Collection
    {
        return Appointment::query()
            ->whereIn('status_id', $this->statusIds(self::OPEN_STATUSES))
            ->whereDate('appointment_date', '>=', today()->subDays(self::OUTSTANDING_WINDOW_DAYS))
            ->with([
                'dog:dog_id,dog_name',
                'owner:owner_id,first_name,last_name',
                'service:service_id,service_name,price',
                'status:status_id,status_name',
                'payments:payment_id,appointment_id,amount,payment_status,method_id',
            ])
            ->get();
    }

    /**
     * The money the clinic is looking after: what has come in today, and what
     * the open visits still owe.
     *
     * @param  Collection<int, Appointment>  $open
     * @return array<string, mixed>
     */
    private function money(Collection $open): array
    {
        $collectedToday = (float) Payment::query()
            ->where('payment_status', Payment::STATUS_PAID)
            ->whereDate('paid_at', today())
            ->sum('amount');

        $outstanding = 0.0;
        $partPaid = 0;
        $owing = 0;

        foreach ($open as $visit) {
            $settlement = $this->payments->settlement($visit);

            $outstanding += (float) $settlement['balance'];
            $owing += $settlement['balance'] > 0 ? 1 : 0;
            $partPaid += $settlement['state'] === 'part' ? 1 : 0;
        }

        return [
            'collected_today' => $this->amount($collectedToday),
            'outstanding' => $this->amount($outstanding),
            'part_paid' => $partPaid,
            'owing' => $owing,
            'window_days' => self::OUTSTANDING_WINDOW_DAYS,
        ];
    }

    /**
     * Who still owes the clinic, soonest visit first, so an overdue balance
     * does not sit below next month's bookings.
     *
     * @param  Collection<int, Appointment>  $open
     * @return list<array<string, mixed>>
     */
    private function debts(Collection $open): array
    {
        return $open
            ->map(function (Appointment $appointment): array {
                $settlement = $this->payments->settlement($appointment);

                return [
                    'id' => $appointment->appointment_id,
                    'owner' => $appointment->owner?->fullName(),
                    'owner_id' => $appointment->owner_id,
                    'dog' => $appointment->dog?->dog_name,
                    'service' => $appointment->service?->service_name,
                    'visit_on' => $appointment->appointment_date?->toDateString(),
                    'visit_time' => substr((string) $appointment->appointment_time, 0, 5),
                    'status' => $appointment->status?->status_name,
                    'price' => $settlement['price'],
                    'paid' => $settlement['paid'],
                    'balance' => $settlement['balance'],
                    'state' => $settlement['state'],
                    'advance' => $settlement['advance'],
                ];
            })
            ->filter(fn (array $row): bool => (float) $row['balance'] > 0)
            ->sortBy([
                ['visit_on', 'asc'],
                ['id', 'asc'],
            ])
            ->take(self::DEBT_LIMIT)
            ->values()
            ->all();
    }

    /**
     * The payments the portal has taken, newest first — the transactions the
     * desk is asked about at the counter.
     *
     * @return list<array<string, mixed>>
     */
    private function transactions(): array
    {
        return Payment::query()
            ->where('payment_status', Payment::STATUS_PAID)
            ->with([
                'method:method_id,method_name',
                'appointment:appointment_id,owner_id,dog_id,service_id,appointment_date,appointment_time,status_id',
                'appointment.dog:dog_id,dog_name',
                'appointment.owner:owner_id,first_name,last_name',
                'appointment.service:service_id,service_name,price',
                'appointment.status:status_id,status_name',
                'appointment.payments:payment_id,appointment_id,amount,payment_status,method_id',
                'appointment.payments.method:method_id,method_name',
            ])
            ->orderByDesc('payment_id')
            ->limit(self::TRANSACTION_LIMIT)
            ->get()
            ->map(fn (Payment $payment): array => $this->payments->paymentSummary($payment))
            ->all();
    }

    /**
     * Money as the page carries it: a bare two-decimal string, so the
     * client-side currency formatter reads it as one number.
     */
    private function amount(float $value): string
    {
        return number_format($value, 2, '.', '');
    }

    /**
     * The status ids behind a list of names. A name the clinic has never used
     * simply matches nothing.
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
     * How many of today's visits sit in one of the given states.
     *
     * @param  string|list<string>  $statuses
     */
    private function todayIn(string|array $statuses): int
    {
        return Appointment::query()
            ->whereDate('appointment_date', today())
            ->whereHas('status', fn ($status) => $status->whereIn('status_name', (array) $statuses))
            ->count();
    }

    /**
     * @return Builder<Appointment>
     */
    private function query(string $status, string $search): Builder
    {
        return Appointment::query()
            ->with(self::RELATIONS)
            ->when(
                $status !== self::ALL_STATUSES,
                fn (Builder $query) => $query->whereHas(
                    'status',
                    fn ($relation) => $relation->where('status_name', $status),
                ),
            )
            ->when($search !== '', function (Builder $query) use ($search) {
                $term = '%'.$search.'%';

                $query->where(function (Builder $query) use ($term) {
                    $query->whereHas('owner', function (Builder $owner) use ($term) {
                        $owner->where('first_name', 'like', $term)
                            ->orWhere('last_name', 'like', $term)
                            ->orWhere('email', 'like', $term)
                            ->orWhere('phone_number', 'like', $term);
                    })
                        ->orWhereHas('dog', fn (Builder $dog) => $dog->where('dog_name', 'like', $term))
                        ->orWhereHas('service', fn (Builder $service) => $service->where('service_name', 'like', $term));
                });
            });
    }

    /** @return list<string> */
    private function statusNames(): array
    {
        $existing = AppointmentStatus::query()->pluck('status_name')->all();
        $known = array_values(array_intersect(self::STATUS_ORDER, $existing));
        $extra = array_values(array_diff($existing, $known));

        return [...$known, ...$extra];
    }

    /** @return array<string, mixed> */
    private function present(Appointment $appointment): array
    {
        $status = $appointment->status?->status_name;
        $settlement = $this->payments->settlement($appointment);

        // Any money on a visit makes it the client's to call off: the clinic
        // does not cancel something somebody has already paid for.
        $hasPayment = $settlement['state'] !== 'unpaid';

        return [
            'id' => $appointment->appointment_id,
            'date' => $appointment->appointment_date?->toDateString(),
            'time' => substr((string) $appointment->appointment_time, 0, 5),
            'status' => $status,
            'dog' => $appointment->dog?->dog_name,
            'owner' => $appointment->owner?->fullName(),
            'owner_id' => $appointment->owner_id,
            'owner_phone' => $appointment->owner?->phone_number,
            'owner_email' => $appointment->owner?->email,
            'service' => $appointment->service?->service_name,
            'duration_minutes' => $appointment->service?->duration_minutes,
            'price' => $appointment->service?->price,
            'staff' => $appointment->staff?->fullName(),
            'notes' => $appointment->notes,
            'requested_at' => $appointment->created_at?->toIso8601String(),
            // The money on this visit: price, paid, balance, and whether it may
            // be part-paid (paying ahead) or is due in full (after the visit).
            'settlement' => $settlement,
            // What the desk is allowed to do next, so the page does not have to
            // re-derive the state machine.
            'can_confirm' => $status === 'Requested',
            // A visit can only be closed out once it is actually due, so a
            // future booking does not offer the action at all.
            'can_complete' => $status === 'Confirmed' && ! $this->isScheduledInFuture($appointment),
            'can_no_show' => $status === 'Confirmed',
            'can_cancel' => in_array($status, ['Requested', 'Confirmed'], true) && ! $hasPayment,
            // Why cancel is out of reach, for the page to say instead of
            // silently hiding the button.
            'cancel_blocked_by_payment' => $hasPayment,
        ];
    }

    /** True when the visit's date and time are still ahead of now. */
    private function isScheduledInFuture(Appointment $appointment): bool
    {
        if ($appointment->appointment_date === null) {
            return false;
        }

        $time = (string) ($appointment->appointment_time ?: '00:00:00');

        return $appointment->appointment_date->copy()->setTimeFromTimeString($time)->isFuture();
    }
}
