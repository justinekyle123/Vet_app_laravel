<?php

namespace App\Services\Reports;

use App\Enums\StaffRole;
use App\Models\Appointment;
use App\Models\ClinicInfo;
use App\Models\Dog;
use App\Models\DogBreed;
use App\Models\DogOwner;
use App\Models\Payment;
use App\Models\RatingFeedback;
use App\Models\Staff;
use App\Services\Payments\PortalPayments;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

/**
 * Every figure a clinic report contains, worked out once from live records and
 * shared by the page, the PDF, and the spreadsheet.
 *
 * One service builds the numbers so the three outputs cannot disagree: the
 * page, the printed copy, and the file the accountant opens are the same
 * report in three shapes. Nothing is cached or stored — a report is always as
 * fresh as the records behind it, and the window it covers is the only input.
 *
 * Money is reported on two clocks, which is deliberate and labelled as such on
 * the page: what the clinic *took* is counted on the day the payment came in
 * (`paid_at`), while what the clinic *completed* is counted on the day of the
 * visit. A deposit taken last month for today's visit is last month's money.
 */
final class ClinicReport
{
    /** The visit states a report breaks down, in the order the desk reads them. */
    public const STATUSES = ['Requested', 'Confirmed', 'Completed', 'Cancelled', 'No-show'];

    /** The states a visit is still going to happen in, or has happened in. */
    private const LIVE_STATUSES = ['Requested', 'Confirmed', 'Completed'];

    /** How many months of sign-up history the all-time panel shows. */
    public const SIGNUP_MONTHS = 6;

    /** How many rows a "top" list keeps. */
    private const TOP_ROWS = 6;

    public function __construct(private PortalPayments $payments) {}

    /**
     * The whole report for one window.
     *
     * @return array<string, mixed>
     */
    public function build(ReportRange $range): array
    {
        $visits = $this->visits($range);
        $received = $this->receivedPayments($range);

        return [
            'range' => $range->toArray(),
            'generated_at' => CarbonImmutable::now()->format('M j, Y g:i A'),
            'headline' => $this->headline($range),
            'previous' => $this->headline($range->previous()),
            'appointments' => $this->appointments($range, $visits),
            'revenue' => $this->revenue($visits, $received),
            'services' => $this->byService($visits),
            'staff' => $this->byStaff($visits),
            'clients' => $this->clients($range, $visits),
            'ratings' => $this->ratings($range),
            'all_time' => $this->allTime(),
        ];
    }

    /**
     * The visits dated inside the window, with everything a row needs to be
     * read and totalled without a query per visit.
     *
     * @return Collection<int, Appointment>
     */
    private function visits(ReportRange $range): Collection
    {
        return $this->visitQuery($range)->get();
    }

    /**
     * @return Builder<Appointment>
     */
    private function visitQuery(ReportRange $range): Builder
    {
        return Appointment::query()
            // DateTime bounds, so the comparison holds whether the column
            // stores a bare date or the datetime Eloquent writes for a cast.
            ->whereBetween('appointment_date', [$range->from, $range->to->endOfDay()])
            ->with([
                'dog:dog_id,dog_name',
                'owner:owner_id,first_name,last_name',
                'service:service_id,service_name,price,duration_minutes',
                'staff:staff_id,first_name,last_name',
                'status:status_id,status_name',
                'payments:payment_id,appointment_id,amount,payment_status',
            ]);
    }

    /**
     * The visits in the window, one row each, in the shape a spreadsheet wants
     * them. This is the detail behind the figures above: the report itself
     * sends totals to the page, and this is what the clinic reads when it wants
     * to check the totals.
     *
     * @return list<array<string, mixed>>
     */
    public function visitRows(ReportRange $range): array
    {
        return $this->visits($range)
            ->sortBy(fn (Appointment $visit) => ($visit->appointment_date?->toDateString() ?? '').' '.$visit->appointment_time)
            ->map(function (Appointment $visit): array {
                $settlement = $this->payments->settlement($visit);

                return [
                    'date' => $visit->appointment_date?->toDateString() ?? '',
                    'time' => substr((string) $visit->appointment_time, 0, 5),
                    'client' => $visit->owner?->fullName() ?? 'Unknown client',
                    'dog' => $visit->dog?->dog_name ?? '',
                    'service' => $visit->service?->service_name ?? '',
                    'provider' => $visit->staff?->fullName() ?? '',
                    'status' => $visit->status?->status_name ?? '',
                    'price' => (float) $settlement['price'],
                    'paid' => (float) $settlement['paid'],
                    'balance' => (float) $settlement['balance'],
                    'refunded' => (float) $settlement['refunded'],
                ];
            })
            ->values()
            ->all();
    }

    /**
     * Every payment that came in during the window, one row each.
     *
     * @return list<array<string, mixed>>
     */
    public function paymentRows(ReportRange $range): array
    {
        return $this->receivedPayments($range)
            ->sortBy('paid_at')
            ->map(fn (Payment $payment): array => [
                'paid_on' => $payment->paid_at?->toDateString() ?? '',
                'visit_on' => $payment->appointment?->appointment_date?->toDateString() ?? '',
                'client' => $payment->appointment?->owner?->fullName() ?? 'Unknown client',
                'dog' => $payment->appointment?->dog?->dog_name ?? '',
                'service' => $payment->appointment?->service?->service_name ?? '',
                'channel' => $payment->method?->method_name ?? 'Other',
                'amount' => (float) $payment->amount,
                'status' => $payment->payment_status,
                'reference' => $payment->reference ?? '',
            ])
            ->values()
            ->all();
    }

    /**
     * The money that came in during the window, on the day it came in.
     *
     * @return Collection<int, Payment>
     */
    private function receivedPayments(ReportRange $range): Collection
    {
        return Payment::query()
            ->whereBetween('paid_at', [$range->from, $range->to->endOfDay()])
            ->with([
                'method:method_id,method_name',
                'appointment:appointment_id,owner_id,dog_id,service_id,appointment_date',
                'appointment.owner:owner_id,first_name,last_name',
                'appointment.dog:dog_id,dog_name',
                'appointment.service:service_id,service_name',
            ])
            ->get();
    }

    /**
     * The numbers a report leads with, for the window and for the one before
     * it, so every headline figure can be given a direction.
     *
     * @return array{appointments: int, completed: int, received: string, new_owners: int, average_rating: float|null}
     */
    private function headline(ReportRange $range): array
    {
        $visits = $this->visitQuery($range);

        $received = $this->money(
            Payment::query()
                ->whereBetween('paid_at', [$range->from, $range->to->endOfDay()])
                ->where('payment_status', Payment::STATUS_PAID)
                ->sum('amount')
        );

        $rating = RatingFeedback::query()
            ->whereBetween('created_at', [$range->from, $range->to->endOfDay()])
            ->avg('rating');

        return [
            'appointments' => (clone $visits)->count(),
            'completed' => (clone $visits)
                ->whereHas('status', fn ($status) => $status->where('status_name', 'Completed'))
                ->count(),
            'received' => $this->amount($received),
            'new_owners' => DogOwner::query()
                ->whereBetween('created_at', [$range->from, $range->to->endOfDay()])
                ->count(),
            'average_rating' => $rating === null ? null : round((float) $rating, 1),
        ];
    }

    /**
     * Volumes: how many visits, where they ended up, and when they happened.
     *
     * @param  Collection<int, Appointment>  $visits
     * @return array<string, mixed>
     */
    private function appointments(ReportRange $range, Collection $visits): array
    {
        $counts = collect(self::STATUSES)
            ->mapWithKeys(fn (string $status): array => [
                $status => $visits->filter(fn (Appointment $visit) => $visit->status?->status_name === $status)->count(),
            ]);

        $total = $visits->count();
        $completed = $counts['Completed'];
        $cancelled = $counts['Cancelled'];
        $noShow = $counts['No-show'];

        // Of the visits that reached an end, how many were actually carried
        // out. A visit still sitting in "Requested" has not been decided yet,
        // so it is left out of the rate rather than counted against the clinic.
        $settled = $completed + $cancelled + $noShow;

        return [
            'total' => $total,
            'completed' => $completed,
            'cancelled' => $cancelled,
            'no_show' => $noShow,
            'requested' => $counts['Requested'],
            'confirmed' => $counts['Confirmed'],
            'by_status' => collect(self::STATUSES)
                ->map(fn (string $status): array => [
                    'status' => $status,
                    'count' => $counts[$status],
                    'share' => $this->percent($counts[$status], $total),
                ])
                ->all(),
            'completed_rate' => $this->percent($completed, $settled),
            'cancellation_rate' => $this->percent($cancelled + $noShow, $total),
            'by_day' => $this->byDay($range, $visits),
            'by_weekday' => $this->byWeekday($visits),
            'by_hour' => $this->byHour($visits),
        ];
    }

    /**
     * One row per day in the window, including the days with nothing on them,
     * so a chart keeps an even time axis and a quiet day reads as a quiet day
     * rather than as a missing one.
     *
     * @param  Collection<int, Appointment>  $visits
     * @return list<array{date: string, label: string, booked: int, completed: int}>
     */
    private function byDay(ReportRange $range, Collection $visits): array
    {
        $grouped = $visits->groupBy(fn (Appointment $visit) => $visit->appointment_date?->toDateString() ?? '');

        $days = [];

        for ($date = $range->from; $date->lessThanOrEqualTo($range->to); $date = $date->addDay()) {
            $key = $date->toDateString();
            $day = $grouped->get($key, collect());

            $days[] = [
                'date' => $key,
                'label' => $date->format('M j'),
                'booked' => $day->count(),
                'completed' => $day
                    ->filter(fn (Appointment $visit) => $visit->status?->status_name === 'Completed')
                    ->count(),
            ];
        }

        return $days;
    }

    /**
     * Which weekdays the clinic is busiest on.
     *
     * @param  Collection<int, Appointment>  $visits
     * @return list<array{label: string, count: int}>
     */
    private function byWeekday(Collection $visits): array
    {
        $names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        $counts = $visits
            ->filter(fn (Appointment $visit) => $visit->appointment_date !== null)
            ->countBy(fn (Appointment $visit) => $visit->appointment_date->dayOfWeek);

        return collect($names)
            ->map(fn (string $name, int $day): array => [
                'label' => $name,
                'count' => (int) $counts->get($day, 0),
            ])
            ->values()
            ->all();
    }

    /**
     * Which hours the clinic is busiest in, over its own opening hours so the
     * axis is the clinic's day rather than a generic 24 hours.
     *
     * @param  Collection<int, Appointment>  $visits
     * @return list<array{label: string, count: int}>
     */
    private function byHour(Collection $visits): array
    {
        $clinic = ClinicInfo::current();
        $opens = (int) substr((string) $clinic->opening_time, 0, 2);
        $closes = (int) substr((string) $clinic->closing_time, 0, 2);

        $counts = $visits->countBy(
            fn (Appointment $visit) => (int) substr((string) $visit->appointment_time, 0, 2)
        );

        $hours = [];

        for ($hour = $opens; $hour < max($closes, $opens + 1); $hour++) {
            $hours[] = [
                'label' => CarbonImmutable::today()->setTime($hour, 0)->format('g A'),
                'count' => (int) $counts->get($hour, 0),
            ];
        }

        return $hours;
    }

    /**
     * The money: what came in during the window, what went back, what is still
     * owed on the visits in it, and which channel each peso arrived through.
     *
     * @param  Collection<int, Appointment>  $visits
     * @param  Collection<int, Payment>  $received
     * @return array<string, mixed>
     */
    private function revenue(Collection $visits, Collection $received): array
    {
        $standing = $received->where('payment_status', Payment::STATUS_PAID);
        $refunded = $received->where('payment_status', Payment::STATUS_REFUNDED);

        $taken = $this->money($standing->sum('amount'));
        $handedBack = $this->money($refunded->sum('amount'));

        // What the clinic actually did: the visits carried out in the window,
        // valued at the price of the service each one was for.
        $completed = $visits->filter(fn (Appointment $visit) => $visit->status?->status_name === 'Completed');
        $billed = $this->money($completed->sum(fn (Appointment $visit) => (float) ($visit->service?->price ?? 0)));

        // Money the clinic is still owed for the work in this window. A visit
        // that was called off is not owed anything, and a refunded visit
        // reads as owing its price again because the money has gone back.
        $owing = $visits
            ->filter(fn (Appointment $visit) => in_array($visit->status?->status_name, self::LIVE_STATUSES, true))
            ->map(fn (Appointment $visit) => $this->payments->balance($visit))
            ->filter(fn (float $balance) => $balance > 0);

        return [
            'taken' => $this->amount($taken),
            'taken_count' => $standing->count(),
            'refunded' => $this->amount($handedBack),
            'refunded_count' => $refunded->count(),
            'net' => $this->amount($this->money($taken - $handedBack)),
            'billed' => $this->amount($billed),
            'completed_visits' => $completed->count(),
            'average_visit' => $this->amount($completed->isEmpty() ? 0 : $this->money($billed / $completed->count())),
            'outstanding' => $this->amount($this->money($owing->sum())),
            'outstanding_visits' => $owing->count(),
            'by_channel' => $this->byChannel($received),
        ];
    }

    /**
     * Where the money came from, channel by channel. Every channel the clinic
     * offers is listed even when nothing came through it, so a month without a
     * bank transfer reads as zero rather than as a missing row.
     *
     * @param  Collection<int, Payment>  $received
     * @return list<array{channel: string, taken: string, refunded: string, count: int, share: float}>
     */
    private function byChannel(Collection $received): array
    {
        $grouped = $received->groupBy(fn (Payment $payment) => $payment->method?->method_name ?? 'Other');

        $taken = $this->money(
            $received->where('payment_status', Payment::STATUS_PAID)->sum('amount')
        );

        // The channels the clinic's portal offers, plus anything a payment was
        // recorded under before a channel was retired.
        $channels = collect(array_column(config('payments.methods', []), 'name'))
            ->merge($grouped->keys())
            ->unique()
            ->values();

        return $channels
            ->map(function (string $channel) use ($grouped, $taken): array {
                /** @var Collection<int, Payment> $payments */
                $payments = $grouped->get($channel, collect());
                $paid = $this->money($payments->where('payment_status', Payment::STATUS_PAID)->sum('amount'));

                return [
                    'channel' => $channel,
                    'taken' => $this->amount($paid),
                    'refunded' => $this->amount(
                        $this->money($payments->where('payment_status', Payment::STATUS_REFUNDED)->sum('amount'))
                    ),
                    'count' => $payments->count(),
                    'share' => $this->percent($paid, $taken),
                ];
            })
            ->sortByDesc(fn (array $row) => (float) $row['taken'])
            ->values()
            ->all();
    }

    /**
     * The services the window was made of, busiest by money first.
     *
     * @param  Collection<int, Appointment>  $visits
     * @return list<array{service: string, bookings: int, completed: int, lost: int, revenue: string, share: float}>
     */
    private function byService(Collection $visits): array
    {
        $grouped = $visits->groupBy(fn (Appointment $visit) => $visit->service?->service_name ?? 'Removed service');

        $revenue = $this->money(
            $visits
                ->filter(fn (Appointment $visit) => $visit->status?->status_name === 'Completed')
                ->sum(fn (Appointment $visit) => (float) ($visit->service?->price ?? 0))
        );

        return $grouped
            ->map(function (Collection $rows, string $service) use ($revenue): array {
                $completed = $rows->filter(fn (Appointment $visit) => $visit->status?->status_name === 'Completed');
                $own = $this->money($completed->sum(fn (Appointment $visit) => (float) ($visit->service?->price ?? 0)));

                return [
                    'service' => $service,
                    'bookings' => $rows->count(),
                    'completed' => $completed->count(),
                    // Called off or missed: the work the clinic did not get to.
                    'lost' => $rows
                        ->filter(fn (Appointment $visit) => in_array($visit->status?->status_name, ['Cancelled', 'No-show'], true))
                        ->count(),
                    'revenue' => $this->amount($own),
                    'share' => $this->percent($own, $revenue),
                ];
            })
            ->sortByDesc(fn (array $row) => (float) $row['revenue'])
            ->take(self::TOP_ROWS)
            ->values()
            ->all();
    }

    /**
     * How the work was spread across the care team. A visit with nobody
     * assigned yet is reported as unassigned rather than dropped, because that
     * is exactly the kind of thing a report should surface.
     *
     * @param  Collection<int, Appointment>  $visits
     * @return list<array{staff: string, visits: int, completed: int}>
     */
    private function byStaff(Collection $visits): array
    {
        $grouped = $visits->groupBy(fn (Appointment $visit) => $visit->staff?->fullName() ?? 'Unassigned');

        return $grouped
            ->map(fn (Collection $rows, string $staff): array => [
                'staff' => $staff,
                'visits' => $rows->count(),
                'completed' => $rows
                    ->filter(fn (Appointment $visit) => $visit->status?->status_name === 'Completed')
                    ->count(),
            ])
            ->sortByDesc('visits')
            ->take(self::TOP_ROWS)
            ->values()
            ->all();
    }

    /**
     * Who the clinic looked after: how many came for the first time, how many
     * came back, and who spent the most.
     *
     * @param  Collection<int, Appointment>  $visits
     * @return array<string, mixed>
     */
    private function clients(ReportRange $range, Collection $visits): array
    {
        $served = $visits->pluck('owner_id')->filter()->unique();

        // A client is "returning" if the clinic has seen them before this
        // window, and in this window for the first time otherwise.
        $returning = $served->isEmpty() ? 0 : Appointment::query()
            ->whereIn('owner_id', $served->all())
            ->where('appointment_date', '<', $range->from)
            ->distinct()
            ->count('owner_id');

        $spend = $visits
            ->filter(fn (Appointment $visit) => $visit->status?->status_name === 'Completed')
            ->groupBy(fn (Appointment $visit) => $visit->owner?->fullName() ?? 'Unknown client')
            ->map(fn (Collection $rows, string $owner): array => [
                'owner' => $owner,
                'visits' => $rows->count(),
                'spend' => $this->amount($this->money($rows->sum(fn (Appointment $visit) => (float) ($visit->service?->price ?? 0)))),
            ])
            ->sortByDesc(fn (array $row) => (float) $row['spend'])
            ->take(self::TOP_ROWS)
            ->values()
            ->all();

        return [
            'served' => $served->count(),
            'first_visit' => $served->count() - $returning,
            'returning' => $returning,
            'new_owners' => DogOwner::query()
                ->whereBetween('created_at', [$range->from, $range->to->endOfDay()])
                ->count(),
            'new_dogs' => Dog::query()
                ->whereBetween('created_at', [$range->from, $range->to->endOfDay()])
                ->count(),
            'total_owners' => DogOwner::count(),
            'active_owners' => DogOwner::where('is_active', true)->count(),
            'total_dogs' => Dog::count(),
            'active_dogs' => Dog::where('is_active', true)->count(),
            'top_spenders' => $spend,
        ];
    }

    /**
     * What clients said about the visits, and how it was spread.
     *
     * @return array{average: float|null, count: int, distribution: list<array{stars: int, count: int}>}
     */
    private function ratings(ReportRange $range): array
    {
        $reviews = RatingFeedback::query()
            ->whereBetween('created_at', [$range->from, $range->to->endOfDay()])
            ->get(['rating']);

        $average = $reviews->avg('rating');

        return [
            'average' => $average === null ? null : round((float) $average, 1),
            'count' => $reviews->count(),
            'distribution' => collect([5, 4, 3, 2, 1])
                ->map(fn (int $stars): array => [
                    'stars' => $stars,
                    'count' => $reviews->where('rating', $stars)->count(),
                ])
                ->all(),
        ];
    }

    /**
     * The clinic as it stands, regardless of the window: accounts, the client
     * book, the dogs on file, and how the register has grown. The window
     * filters the work; this is the state of the practice.
     *
     * @return array<string, mixed>
     */
    private function allTime(): array
    {
        $start = CarbonImmutable::now()->startOfMonth()->subMonths(self::SIGNUP_MONTHS - 1);

        $signups = DogOwner::query()
            ->where('created_at', '>=', $start)
            ->get(['created_at'])
            ->countBy(fn (DogOwner $owner) => $owner->created_at->format('Y-m'));

        $breedNames = DogBreed::query()->pluck('breed_name', 'breed_id');

        $breeds = Dog::query()
            ->selectRaw('breed_id, COUNT(*) as aggregate')
            ->groupBy('breed_id')
            ->orderByDesc('aggregate')
            ->get()
            ->map(fn (Dog $dog): array => [
                'label' => $dog->breed_id === null
                    ? 'Unspecified'
                    : (string) ($breedNames[$dog->breed_id] ?? 'Unspecified'),
                'count' => (int) $dog->aggregate,
            ])
            ->all();

        return [
            'accounts' => [
                'total' => Staff::count() + DogOwner::count(),
                'admins' => Staff::where('role', StaffRole::Admin)->count(),
                'staff' => Staff::count(),
                'owners' => DogOwner::count(),
            ],
            'signups' => collect(range(0, self::SIGNUP_MONTHS - 1))
                ->map(function (int $offset) use ($start, $signups): array {
                    $month = $start->copy()->addMonths($offset);

                    return [
                        'label' => $month->format('M'),
                        'count' => (int) $signups->get($month->format('Y-m'), 0),
                    ];
                })
                ->all(),
            'breeds' => $breeds,
        ];
    }

    /** A whole-number percentage of a total, floored at zero. */
    private function percent(int|float $part, int|float $whole): float
    {
        return $whole > 0 ? round(($part / $whole) * 100, 1) : 0.0;
    }

    /** An amount as a number with two decimals, for arithmetic. */
    private function money(float|int|string $value): float
    {
        return round((float) $value, 2);
    }

    /**
     * An amount as the pages carry it: a bare two-decimal string with no
     * thousands separator, so the client-side money formatter reads it as one
     * number and a spreadsheet cell can be written as a real number.
     */
    private function amount(float $value): string
    {
        return number_format($value, 2, '.', '');
    }
}
