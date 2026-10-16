<?php

namespace App\Services\Reports;

use Carbon\CarbonImmutable;
use Illuminate\Http\Request;

/**
 * The window a clinic report covers.
 *
 * The range is part of the URL rather than hidden state, so a report can be
 * bookmarked, shared, or handed to the accountant as a link — and the PDF and
 * spreadsheet exports carry the same query string, which is what keeps a
 * download identical to the page it came from.
 *
 * A hand-written URL is treated gently rather than rejected: an unreadable
 * date, a backwards pair, or an absurdly long window is quietly brought back
 * into shape, because a report page that refuses to load is less useful than
 * one that shows a sensible window and says which one it used.
 */
final class ReportRange
{
    /** The windows the page offers as one-click presets. */
    public const PRESETS = ['today', 'last_7', 'last_30', 'this_month', 'last_month', 'this_year', 'custom'];

    /** The longest window a report will cover: three years of days. */
    public const MAX_DAYS = 1096;

    private function __construct(
        public readonly CarbonImmutable $from,
        public readonly CarbonImmutable $to,
        public readonly string $preset,
    ) {}

    /**
     * Read the window out of a request. A date pair in the query wins, so a
     * custom window survives a round trip; otherwise the preset decides.
     */
    public static function fromRequest(Request $request, ?CarbonImmutable $now = null): self
    {
        $now = ($now ?? CarbonImmutable::now())->startOfDay();

        $from = self::date($request->query('from'));
        $to = self::date($request->query('to'));

        if ($from !== null || $to !== null) {
            // Half a pair is still a window: a date typed into one box is a
            // one-day report rather than a reason to fall back to the preset.
            return self::custom($from ?? $to, $to ?? $from);
        }

        $preset = (string) $request->query('preset', 'this_month');

        return match ($preset) {
            'today' => self::preset('today', $now, $now),
            'last_7' => self::preset('last_7', $now->subDays(6), $now),
            'last_30' => self::preset('last_30', $now->subDays(29), $now),
            'last_month' => self::preset(
                'last_month',
                $now->subMonthNoOverflow()->startOfMonth(),
                $now->subMonthNoOverflow()->endOfMonth()->startOfDay(),
            ),
            'this_year' => self::preset('this_year', $now->startOfYear(), $now),
            default => self::preset('this_month', $now->startOfMonth(), $now),
        };
    }

    /**
     * The same length of time immediately before this window — what a figure
     * is compared against so a number on the page has a direction.
     */
    public function previous(): self
    {
        $previousTo = $this->from->subDay();

        return new self($previousTo->subDays($this->days() - 1), $previousTo, 'custom');
    }

    /** How many days the window covers, counting both ends. */
    public function days(): int
    {
        return (int) $this->from->diffInDays($this->to) + 1;
    }

    /** The window the way the clinic writes a date range. */
    public function label(): string
    {
        if ($this->from->isSameDay($this->to)) {
            return $this->from->format('M j, Y');
        }

        if ($this->from->year !== $this->to->year) {
            return $this->from->format('M j, Y').' – '.$this->to->format('M j, Y');
        }

        return $this->from->format('M j').' – '.$this->to->format('M j, Y');
    }

    /**
     * The range as the page and the export links carry it.
     *
     * @return array{preset: string, from: string, to: string}
     */
    public function query(): array
    {
        return [
            'preset' => $this->preset,
            'from' => $this->from->toDateString(),
            'to' => $this->to->toDateString(),
        ];
    }

    /**
     * The range in the shape the page renders it.
     *
     * @return array{from: string, to: string, preset: string, label: string, days: int, is_custom: bool}
     */
    public function toArray(): array
    {
        return [
            'from' => $this->from->toDateString(),
            'to' => $this->to->toDateString(),
            'preset' => $this->preset,
            'label' => $this->label(),
            'days' => $this->days(),
            'is_custom' => $this->preset === 'custom',
        ];
    }

    private static function preset(string $preset, CarbonImmutable $from, CarbonImmutable $to): self
    {
        return self::custom($from, $to, $preset);
    }

    /**
     * Bring a pair of dates into a window the report can actually run over:
     * in order, and no longer than {@see self::MAX_DAYS}.
     */
    private static function custom(CarbonImmutable $from, CarbonImmutable $to, string $preset = 'custom'): self
    {
        if ($from->greaterThan($to)) {
            [$from, $to] = [$to, $from];
        }

        if ($from->diffInDays($to) + 1 > self::MAX_DAYS) {
            $from = $to->subDays(self::MAX_DAYS - 1);
        }

        return new self($from->startOfDay(), $to->startOfDay(), $preset);
    }

    /** A `YYYY-MM-DD` query value, or null when it is missing or unreadable. */
    private static function date(mixed $value): ?CarbonImmutable
    {
        if (! is_string($value) || ! preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
            return null;
        }

        $date = CarbonImmutable::createFromFormat('!Y-m-d', $value);

        // A value like 2026-02-31 parses by rolling over into March, which is
        // not what the URL asked for, so the round trip has to match.
        return $date !== null && $date->format('Y-m-d') === $value ? $date : null;
    }
}
