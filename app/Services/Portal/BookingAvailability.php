<?php

namespace App\Services\Portal;

use App\Models\Appointment;
use App\Models\ClinicInfo;
use App\Models\Service;
use Carbon\CarbonImmutable;

/**
 * Works out when the clinic can take an online booking.
 *
 * The schema has a `time_slots` table, but nothing populates it on a fresh
 * install, so availability is derived instead: the clinic's own opening hours
 * decide the grid and existing visits decide which cells are still free. That
 * keeps the portal bookable from day one and needs no extra seeding.
 */
class BookingAvailability
{
    /** How far ahead the calendar lets clients book. */
    public const HORIZON_DAYS = 60;

    /** The grid the clinic's day is divided into, in minutes. */
    private const SLOT_STEP_MINUTES = 30;

    /** A visit in one of these states no longer holds its slot. */
    private const RELEASED_STATUSES = ['Cancelled', 'No-show'];

    /** ISO weekday numbers used when `days_open` cannot be read. */
    private const DEFAULT_OPEN_WEEKDAYS = [1, 2, 3, 4, 5, 6];

    /**
     * The days and times a service can be booked, across the whole window.
     *
     * @return array{
     *     windowDays: int,
     *     dates: list<string>,
     *     times: array<string, list<array{value: string, label: string}>>
     * }
     */
    public function calendar(Service $service): array
    {
        $clinic = ClinicInfo::current();
        $openWeekdays = $this->openWeekdays($clinic->days_open);

        $first = CarbonImmutable::today();
        $last = $first->addDays(self::HORIZON_DAYS);
        $booked = $this->bookedBlocks($first, $last);

        $dates = [];
        $times = [];

        for ($date = $first; $date->lessThanOrEqualTo($last); $date = $date->addDay()) {
            if (! in_array($date->isoWeekday(), $openWeekdays, true)) {
                continue;
            }

            $key = $date->toDateString();
            $slots = $this->slots($service, $clinic, $date, $booked[$key] ?? []);

            if ($slots === []) {
                continue;
            }

            $dates[] = $key;
            $times[$key] = $slots;
        }

        return [
            'windowDays' => self::HORIZON_DAYS,
            'dates' => $dates,
            'times' => $times,
        ];
    }

    /**
     * Whether a date and time is still inside the booking window and free.
     */
    public function isBookable(Service $service, string $date, string $time): bool
    {
        $clinic = ClinicInfo::current();

        if (! $this->isOpenForBooking($clinic, $date)) {
            return false;
        }

        $day = CarbonImmutable::parse($date);
        $booked = $this->bookedBlocks($day, $day);

        $slots = $this->slots($service, $clinic, $day, $booked[$date] ?? []);

        return in_array($time, array_column($slots, 'value'), true);
    }

    /**
     * Whether the date falls on a clinic day and inside the booking window.
     */
    private function isOpenForBooking(ClinicInfo $clinic, string $date): bool
    {
        $day = CarbonImmutable::parse($date);

        if (! in_array($day->isoWeekday(), $this->openWeekdays($clinic->days_open), true)) {
            return false;
        }

        return $day->greaterThanOrEqualTo(CarbonImmutable::today())
            && $day->lessThanOrEqualTo(CarbonImmutable::today()->addDays(self::HORIZON_DAYS));
    }

    /**
     * The free slots in one day, skipping what has already gone and what clashes
     * with a visit the clinic already holds.
     *
     * @param  list<array{start: int, end: int}>  $booked
     * @return list<array{value: string, label: string}>
     */
    private function slots(
        Service $service,
        ClinicInfo $clinic,
        CarbonImmutable $date,
        array $booked,
    ): array {
        $duration = max(5, (int) ($service->duration_minutes ?? 30));
        $opens = $this->minutes((string) $clinic->opening_time);
        $closes = $this->minutes((string) $clinic->closing_time);
        $now = CarbonImmutable::now();

        $slots = [];

        // A slot only counts when the whole service fits before closing time.
        for ($start = $opens; $start + $duration <= $closes; $start += self::SLOT_STEP_MINUTES) {
            $end = $start + $duration;

            // Today's earlier slots have already gone.
            if ($date->isToday() && $start <= ($now->hour * 60 + $now->minute)) {
                continue;
            }

            foreach ($booked as $block) {
                if ($start < $block['end'] && $end > $block['start']) {
                    continue 2;
                }
            }

            $slots[] = [
                'value' => $this->clock($start),
                'label' => $this->clockLabel($start),
            ];
        }

        return $slots;
    }

    /**
     * Every visit still holding a slot in the range, keyed by date and reduced
     * to minute offsets so overlap checks are plain arithmetic.
     *
     * @return array<string, list<array{start: int, end: int}>>
     */
    private function bookedBlocks(CarbonImmutable $from, CarbonImmutable $to): array
    {
        return Appointment::query()
            // DateTime bounds, so the comparison holds whether the column stores
            // a bare date or the datetime Eloquent writes for a date cast.
            ->whereBetween('appointment_date', [$from->startOfDay(), $to->endOfDay()])
            ->whereHas(
                'status',
                fn ($status) => $status->whereNotIn('status_name', self::RELEASED_STATUSES),
            )
            ->with('service:service_id,duration_minutes')
            ->get()
            ->groupBy(fn (Appointment $appointment) => $appointment->appointment_date?->toDateString() ?? '')
            ->map(fn ($group) => $group
                ->map(function (Appointment $appointment): array {
                    $start = $this->minutes((string) $appointment->appointment_time);

                    return [
                        'start' => $start,
                        'end' => $start + max(5, (int) ($appointment->service?->duration_minutes ?? 30)),
                    ];
                })
                ->values()
                ->all())
            ->all();
    }

    /**
     * Read `days_open` ("Monday-Saturday", "Monday, Wednesday, Friday") into
     * ISO weekday numbers. A value the parser does not recognise falls back to
     * the clinic's usual Monday-to-Saturday week rather than locking clients
     * out of the calendar.
     *
     * @return list<int>
     */
    private function openWeekdays(?string $daysOpen): array
    {
        $names = [
            'monday' => 1,
            'tuesday' => 2,
            'wednesday' => 3,
            'thursday' => 4,
            'friday' => 5,
            'saturday' => 6,
            'sunday' => 7,
        ];

        $open = [];

        foreach (explode(',', (string) $daysOpen) as $part) {
            $part = strtolower(trim($part));

            if ($part === '') {
                continue;
            }

            if (preg_match('/^([a-z]+)\s*-\s*([a-z]+)$/', $part, $matches)) {
                $start = $names[$matches[1]] ?? null;
                $end = $names[$matches[2]] ?? null;

                if ($start !== null && $end !== null) {
                    for ($day = $start; $day <= $end; $day++) {
                        $open[] = $day;
                    }

                    continue;
                }
            }

            if (isset($names[$part])) {
                $open[] = $names[$part];
            }
        }

        return $open === []
            ? self::DEFAULT_OPEN_WEEKDAYS
            : array_values(array_unique($open));
    }

    /** Minutes past midnight for a "HH:MM" or "HH:MM:SS" value. */
    private function minutes(string $time): int
    {
        [$hours, $minutes] = array_pad(explode(':', $time), 2, '0');

        return ((int) $hours) * 60 + (int) $minutes;
    }

    /** "HH:MM" for a minute offset, the shape the API and database store. */
    private function clock(int $minutes): string
    {
        return sprintf('%02d:%02d', intdiv($minutes, 60), $minutes % 60);
    }

    /** "9:00 AM" for a minute offset, as the slot button shows it. */
    private function clockLabel(int $minutes): string
    {
        return CarbonImmutable::today()
            ->setTime(intdiv($minutes, 60), $minutes % 60)
            ->format('g:i A');
    }
}
