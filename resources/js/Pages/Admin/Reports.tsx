import { primaryButtonClass, secondaryButtonClass } from '@/Components/buttonStyles';
import Icon from '@/Components/Icon';
import Panel, { EmptyState } from '@/Components/Panel';
import StatCard, { StatAccent } from '@/Components/StatCard';
import StaffLayout from '@/Layouts/StaffLayout';
import { currency } from '@/utils/format';
import { router } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

/* The window a report covers, as the server resolved it. */
interface ReportRangeSummary {
    from: string;
    to: string;
    preset: string;
    label: string;
    days: number;
    is_custom: boolean;
}

interface Headline {
    appointments: number;
    completed: number;
    received: string;
    new_owners: number;
    average_rating: number | null;
}

interface SeriesPoint {
    label: string;
    count: number;
}

interface DayPoint {
    date: string;
    label: string;
    booked: number;
    completed: number;
}

interface ReportFigures {
    range: ReportRangeSummary;
    generated_at: string;
    headline: Headline;
    previous: Headline;
    appointments: {
        total: number;
        completed: number;
        cancelled: number;
        no_show: number;
        requested: number;
        confirmed: number;
        by_status: { status: string; count: number; share: number }[];
        completed_rate: number;
        cancellation_rate: number;
        by_day: DayPoint[];
        by_weekday: SeriesPoint[];
        by_hour: SeriesPoint[];
    };
    revenue: {
        taken: string;
        taken_count: number;
        refunded: string;
        refunded_count: number;
        net: string;
        billed: string;
        completed_visits: number;
        average_visit: string;
        outstanding: string;
        outstanding_visits: number;
        by_channel: {
            channel: string;
            taken: string;
            refunded: string;
            count: number;
            share: number;
        }[];
    };
    services: {
        service: string;
        bookings: number;
        completed: number;
        lost: number;
        revenue: string;
        share: number;
    }[];
    staff: { staff: string; visits: number; completed: number }[];
    clients: {
        served: number;
        first_visit: number;
        returning: number;
        new_owners: number;
        new_dogs: number;
        total_owners: number;
        active_owners: number;
        total_dogs: number;
        active_dogs: number;
        top_spenders: { owner: string; visits: number; spend: string }[];
    };
    ratings: {
        average: number | null;
        count: number;
        distribution: { stars: number; count: number }[];
    };
    all_time: {
        accounts: { total: number; admins: number; staff: number; owners: number };
        signups: SeriesPoint[];
        breeds: SeriesPoint[];
    };
}

interface Preset {
    value: string;
    label: string;
}

interface ReportsProps {
    figures: ReportFigures;
    presets: Preset[];
    clinic: string;
}

/** The statuses, in the brand palette rather than the stock hues. */
const statusBars: Record<string, string> = {
    Requested: 'bg-[#E86A10]',
    Confirmed: 'bg-[#2a5a2a]',
    Completed: 'bg-[#1a3d1a]',
    Cancelled: 'bg-[#b3261e]',
    'No-show': 'bg-[#b3261e]/55',
};

/** Tallest value in a series, floored at 1 so ratios stay finite. */
function peakOf(series: { count: number }[]): number {
    return series.reduce((peak, point) => Math.max(peak, point.count), 1);
}

function share(value: number, total: number): number {
    return total > 0 ? Math.round((value / total) * 100) : 0;
}

/**
 * How a figure moved against the window before it, with the direction spelled
 * out. A window with nothing before it is described rather than divided by
 * zero, and a figure that did not move says so instead of showing `+0%`.
 */
function delta(now: number, before: number): string {
    if (before === 0) {
        return now === 0 ? 'nothing in either period' : 'new this period';
    }

    const rounded = Math.round(((now - before) / before) * 1000) / 10;

    if (rounded === 0) {
        return 'level with the previous period';
    }

    return `${rounded > 0 ? '▲' : '▼'} ${Math.abs(rounded)}% vs the previous period`;
}

/** Horizontal bar list, used for every ranked breakdown on the page. */
function BarList({
    rows,
    bar,
}: {
    rows: { label: string; value: string; count: number; share?: number; bar?: string }[];
    bar: string;
}) {
    const peak = rows.reduce((highest, row) => Math.max(highest, row.count), 1);

    return (
        <ul className="space-y-3.5">
            {rows.map((row) => (
                <li key={row.label}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium text-[#1a3d1a]">
                            {row.label}
                        </span>
                        <span className="text-[#1a3d1a]/60">
                            {row.value}
                            {row.share !== undefined && (
                                <span className="ml-1.5 text-xs text-[#1a3d1a]/45">
                                    {row.share}%
                                </span>
                            )}
                        </span>
                    </div>
                    <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-[#1a3d1a]/5">
                        <div
                            className={`h-full rounded-full transition-[width] duration-500 ${
                                row.bar ?? bar
                            }`}
                            style={{ width: `${(row.count / peak) * 100}%` }}
                        />
                    </div>
                </li>
            ))}
        </ul>
    );
}

/** Vertical bars for a labelled series — weekdays, hours of the day. */
function ColumnChart({
    data,
    bar = 'bg-[#1a3d1a]',
    height = '9rem',
}: {
    data: SeriesPoint[];
    bar?: string;
    height?: string;
}) {
    const peak = peakOf(data);

    return (
        <div>
            <div className="flex items-end gap-1.5 sm:gap-2" style={{ height }}>
                {data.map((point) => (
                    <div
                        key={point.label}
                        className="flex h-full flex-1 items-end"
                        title={`${point.label}: ${point.count}`}
                    >
                        <div
                            role="img"
                            aria-label={`${point.label}: ${point.count}`}
                            className={`relative w-full rounded-t-lg transition-[height] duration-500 hover:opacity-80 ${bar}`}
                            style={{
                                height: `${Math.max((point.count / peak) * 100, 3)}%`,
                            }}
                        >
                            {point.count > 0 && (
                                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-semibold text-[#1a3d1a]">
                                    {point.count}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-2 flex gap-1.5 sm:gap-2">
                {data.map((point) => (
                    <span
                        key={point.label}
                        className="flex-1 truncate text-center text-[0.68rem] text-[#1a3d1a]/55"
                    >
                        {point.label}
                    </span>
                ))}
            </div>
        </div>
    );
}

/**
 * Visits per day across the window: what was booked beside what was carried
 * out. A long window gets thinner bars rather than a truncated axis, so the
 * shape of the month is still readable.
 */
function DayChart({ data }: { data: DayPoint[] }) {
    const peak = data.reduce(
        (highest, day) => Math.max(highest, day.booked, day.completed),
        1,
    );
    const dense = data.length > 62;

    return (
        <div>
            <div className="flex items-end gap-[3px]" style={{ height: '11rem' }}>
                {data.map((day) => (
                    <div
                        key={day.date}
                        className="flex h-full flex-1 items-end justify-center gap-[2px]"
                        title={`${day.label}: ${day.booked} booked, ${day.completed} completed`}
                    >
                        <div
                            role="img"
                            aria-label={`${day.label}: ${day.booked} booked, ${day.completed} completed`}
                            className="w-full rounded-t bg-[#1a3d1a]/20"
                            style={{
                                height: `${Math.max((day.booked / peak) * 100, day.booked > 0 ? 4 : 0)}%`,
                            }}
                        />
                        <div
                            className="w-full rounded-t bg-[#1a3d1a]"
                            style={{
                                height: `${Math.max((day.completed / peak) * 100, day.completed > 0 ? 4 : 0)}%`,
                            }}
                        />
                    </div>
                ))}
            </div>

            <div className="mt-2 flex justify-between text-[0.68rem] text-[#1a3d1a]/55">
                <span>{data[0]?.label}</span>
                {data.length > 2 && (
                    <span>{data[Math.floor(data.length / 2)]?.label}</span>
                )}
                <span>{data[data.length - 1]?.label}</span>
            </div>

            <p className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[#1a3d1a]/55">
                <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-[#1a3d1a]/20" />
                    Booked
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-[#1a3d1a]" />
                    Completed
                </span>
                <span>
                    {dense
                        ? 'Each bar is a day; hover for its numbers.'
                        : 'Each pair is a day.'}
                </span>
            </p>
        </div>
    );
}

/** A labelled figure with its movement against the previous window. */
function Figure({
    label,
    value,
    hint,
    accent = 'text-[#1a3d1a]',
    hintClass = 'text-[#1a3d1a]/45',
}: {
    label: string;
    value: string;
    hint?: string;
    accent?: string;
    hintClass?: string;
}) {
    return (
        <div className="flex items-baseline justify-between gap-3 border-b border-[#1a3d1a]/8 py-2.5 last:border-b-0">
            <span className="text-sm text-[#1a3d1a]/70">{label}</span>
            <span className="text-right">
                <span className={`text-sm font-semibold ${accent}`}>{value}</span>
                {hint && (
                    <span className={`ml-2 text-xs ${hintClass}`}>{hint}</span>
                )}
            </span>
        </div>
    );
}

export default function Reports({ figures, presets, clinic }: ReportsProps) {
    const {
        range,
        headline,
        previous,
        appointments,
        revenue,
        services,
        staff,
        clients,
        ratings,
        all_time,
    } = figures;

    const [from, setFrom] = useState(range.from);
    const [to, setTo] = useState(range.to);

    /*
     * Every view of a report is a URL: the page, the PDF, and the spreadsheet
     * all read the same window out of the query string, so a link — or a file —
     * always means exactly what was on screen.
     */
    const current = { preset: range.preset, from: range.from, to: range.to };

    const load = (next: Record<string, string>) => {
        router.get(
            route('admin.reports.index'),
            { ...current, ...next },
            { preserveState: true, preserveScroll: true },
        );
    };

    const submitCustomRange = (event: FormEvent) => {
        event.preventDefault();
        load({ preset: 'custom', from, to });
    };

    const statusRows = appointments.by_status.map((row) => ({
        label: row.status,
        value: `${row.count}`,
        count: row.count,
        share: row.share,
        bar: statusBars[row.status] ?? 'bg-[#1a3d1a]',
    }));

    const channelRows = revenue.by_channel.map((row) => ({
        label: row.channel,
        value: currency(row.taken),
        count: Number.parseFloat(row.taken),
        share: row.share,
        bar: 'bg-[#E86A10]',
    }));

    const serviceRows = services.map((row) => ({
        label: row.service,
        value: currency(row.revenue),
        count: Number.parseFloat(row.revenue),
        share: row.share,
    }));

    const signupTotal = all_time.signups.reduce(
        (sum, point) => sum + point.count,
        0,
    );

    const statCards: {
        label: string;
        value: number;
        display?: string;
        icon: 'calendar' | 'check' | 'heart' | 'user';
        accent: StatAccent;
        hint: string;
    }[] = [
        {
            label: 'Visits booked',
            value: headline.appointments,
            icon: 'calendar',
            accent: 'brand',
            hint: delta(headline.appointments, previous.appointments),
        },
        {
            label: 'Visits completed',
            value: headline.completed,
            icon: 'check',
            accent: 'deep',
            hint: delta(headline.completed, previous.completed),
        },
        {
            label: 'Money taken',
            value: Number.parseFloat(headline.received),
            display: currency(headline.received),
            icon: 'heart',
            accent: 'accent',
            hint: delta(
                Number.parseFloat(headline.received),
                Number.parseFloat(previous.received),
            ),
        },
        {
            label: 'New clients',
            value: headline.new_owners,
            icon: 'user',
            accent: 'brand',
            hint: delta(headline.new_owners, previous.new_owners),
        },
    ];

    return (
        <StaffLayout
            title="Reports & analytics"
            heading="Reports & analytics"
            description="The clinic's own figures for any window, drawn from live records. Generate a report, read the analytics, and take the numbers away as a PDF or a spreadsheet."
        >
            <div className="space-y-6">
                {/* Window picker and exports ------------------------------- */}
                <section
                    aria-label="Report window"
                    className="rounded-2xl border border-[#1a3d1a]/10 bg-white p-5 shadow-sm"
                >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[#1a3d1a]/45">
                                Reporting window
                            </p>
                            <p className="mt-1 font-serif-display text-2xl leading-none text-[#1a3d1a]">
                                {range.label}
                            </p>
                            <p className="mt-1.5 text-xs text-[#1a3d1a]/50">
                                {range.days}{' '}
                                {range.days === 1 ? 'day' : 'days'}, compared
                                with the {range.days}{' '}
                                {range.days === 1 ? 'day' : 'days'} before it ·
                                generated {figures.generated_at}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5">
                            <a
                                href={route('admin.reports.pdf', current)}
                                className={secondaryButtonClass}
                            >
                                <Icon
                                    name="document"
                                    className="h-4 w-4 text-[#b3261e]"
                                />
                                Export PDF
                            </a>
                            <a
                                href={route('admin.reports.excel', current)}
                                className={primaryButtonClass}
                            >
                                <Icon name="download" className="h-4 w-4" />
                                Export Excel
                            </a>
                        </div>
                    </div>

                    <div
                        role="group"
                        aria-label="Choose a reporting window"
                        className="mt-5 flex flex-wrap gap-1.5"
                    >
                        {presets.map((preset) => {
                            const active = range.preset === preset.value;

                            return (
                                <button
                                    key={preset.value}
                                    type="button"
                                    aria-pressed={active}
                                    onClick={() =>
                                        load({ preset: preset.value })
                                    }
                                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a] ${
                                        active
                                            ? 'bg-[#1a3d1a] text-white shadow-sm'
                                            : 'border border-[#1a3d1a]/15 bg-white text-[#1a3d1a]/60 hover:bg-[#EFFDF0] hover:text-[#1a3d1a]'
                                    }`}
                                >
                                    {preset.label}
                                </button>
                            );
                        })}
                    </div>

                    <form
                        onSubmit={submitCustomRange}
                        className="mt-4 flex flex-wrap items-end gap-3 border-t border-[#1a3d1a]/8 pt-4"
                    >
                        <label className="text-xs font-semibold text-[#1a3d1a]">
                            From
                            <input
                                type="date"
                                value={from}
                                max={to}
                                onChange={(event) => setFrom(event.target.value)}
                                className="ml-2 rounded-full border border-[#1a3d1a]/15 bg-white px-3 py-1.5 text-xs font-medium text-[#1a3d1a] shadow-sm focus:border-[#1a3d1a] focus:outline-none focus:ring-4 focus:ring-[#1a3d1a]/15"
                            />
                        </label>
                        <label className="text-xs font-semibold text-[#1a3d1a]">
                            To
                            <input
                                type="date"
                                value={to}
                                min={from}
                                onChange={(event) => setTo(event.target.value)}
                                className="ml-2 rounded-full border border-[#1a3d1a]/15 bg-white px-3 py-1.5 text-xs font-medium text-[#1a3d1a] shadow-sm focus:border-[#1a3d1a] focus:outline-none focus:ring-4 focus:ring-[#1a3d1a]/15"
                            />
                        </label>
                        <button type="submit" className={secondaryButtonClass}>
                            <Icon name="search" className="h-4 w-4" />
                            Generate report
                        </button>
                        <span className="text-xs text-[#1a3d1a]/45">
                            Untouched figures start on the day of the visit;
                            money starts on the day it was received.
                        </span>
                    </form>
                </section>

                {/* Headline figures --------------------------------------- */}
                <section
                    aria-label="Headline figures"
                    className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
                >
                    {statCards.map((card) => (
                        <StatCard
                            key={card.label}
                            label={card.label}
                            value={card.value}
                            display={card.display}
                            icon={card.icon}
                            accent={card.accent}
                            hint={card.hint}
                        />
                    ))}
                </section>

                {/* Analytics ---------------------------------------------- */}
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                    <div className="xl:col-span-2">
                        <Panel
                            title="Visits per day"
                            icon="chart"
                            fill
                            action={
                                <span className="text-xs font-medium text-[#1a3d1a]/45">
                                    {appointments.total} booked ·{' '}
                                    {appointments.completed} completed
                                </span>
                            }
                        >
                            {appointments.total === 0 ? (
                                <EmptyState
                                    icon="calendar"
                                    message="No visits were booked in this window. Widen it, or pick a different preset above."
                                />
                            ) : (
                                <DayChart data={appointments.by_day} />
                            )}
                        </Panel>
                    </div>

                    <Panel
                        title="How visits ended"
                        icon="check"
                        fill
                        action={
                            <span className="text-xs font-medium text-[#1a3d1a]/45">
                                {appointments.completed_rate}% carried out
                            </span>
                        }
                    >
                        {appointments.total === 0 ? (
                            <EmptyState
                                icon="check"
                                message="Nothing to break down yet for this window."
                            />
                        ) : (
                            <>
                                <BarList rows={statusRows} bar="bg-[#1a3d1a]" />
                                <div className="mt-auto pt-4">
                                    <Figure
                                        label="Cancelled or missed"
                                        value={`${appointments.cancellation_rate}%`}
                                        hint={`${appointments.cancelled + appointments.no_show} of ${appointments.total} bookings`}
                                    />
                                    <Figure
                                        label="Of the visits that reached an end"
                                        value={`${appointments.completed_rate}%`}
                                        hint="were carried out"
                                    />
                                </div>
                            </>
                        )}
                    </Panel>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Panel
                        title="Busiest days"
                        icon="calendar"
                        fill
                        action={
                            <span className="text-xs font-medium text-[#1a3d1a]/45">
                                by weekday
                            </span>
                        }
                    >
                        {appointments.total === 0 ? (
                            <EmptyState
                                icon="calendar"
                                message="No visits to place on a weekday yet."
                            />
                        ) : (
                            <ColumnChart data={appointments.by_weekday} />
                        )}
                    </Panel>

                    <Panel
                        title="Busiest hours"
                        icon="clock"
                        fill
                        action={
                            <span className="text-xs font-medium text-[#1a3d1a]/45">
                                clinic hours
                            </span>
                        }
                    >
                        {appointments.total === 0 ? (
                            <EmptyState
                                icon="clock"
                                message="No visits to place on the clock yet."
                            />
                        ) : (
                            <ColumnChart
                                data={appointments.by_hour}
                                bar="bg-[#2a5a2a]"
                            />
                        )}
                    </Panel>
                </div>

                {/* Money --------------------------------------------------- */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <Panel
                            title="Money in and back out"
                            icon="heart"
                            fill
                            action={
                                <span className="text-xs font-medium text-[#1a3d1a]/45">
                                    as it was received
                                </span>
                            }
                        >
                            <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
                                <div>
                                    <Figure
                                        label="Taken in this window"
                                        value={currency(revenue.taken)}
                                        hint={`${revenue.taken_count} ${revenue.taken_count === 1 ? 'payment' : 'payments'}`}
                                    />
                                    <Figure
                                        label="Refunded"
                                        value={currency(revenue.refunded)}
                                        hint={`${revenue.refunded_count} ${revenue.refunded_count === 1 ? 'payment' : 'payments'}`}
                                        accent="text-[#b3261e]"
                                    />
                                    <Figure
                                        label="Net taken"
                                        value={currency(revenue.net)}
                                    />
                                    <Figure
                                        label="Average visit"
                                        value={currency(revenue.average_visit)}
                                        hint={`${revenue.completed_visits} completed`}
                                    />
                                </div>
                                <div>
                                    <Figure
                                        label="Value of work completed"
                                        value={currency(revenue.billed)}
                                        hint="at current service prices"
                                    />
                                    <Figure
                                        label="Still owed on these visits"
                                        value={currency(revenue.outstanding)}
                                        hint={`${revenue.outstanding_visits} ${revenue.outstanding_visits === 1 ? 'visit' : 'visits'}`}
                                        accent="text-[#E86A10]"
                                    />
                                    <Figure
                                        label="Visits in this window"
                                        value={`${appointments.total}`}
                                        hint={`${appointments.confirmed} confirmed · ${appointments.requested} awaiting confirmation`}
                                    />
                                    <Figure
                                        label="Completion rate"
                                        value={`${appointments.completed_rate}%`}
                                        hint="of visits that reached an end"
                                    />
                                </div>
                            </div>
                        </Panel>
                    </div>

                    <Panel
                        title="Where the money came from"
                        icon="sparkles"
                        fill
                        action={
                            <span className="text-xs font-medium text-[#1a3d1a]/45">
                                by channel
                            </span>
                        }
                    >
                        {revenue.taken_count === 0 &&
                        revenue.refunded_count === 0 ? (
                            <EmptyState
                                icon="sparkles"
                                message="No payments were taken in this window."
                            />
                        ) : (
                            <BarList rows={channelRows} bar="bg-[#E86A10]" />
                        )}
                    </Panel>
                </div>

                {/* Services and the care team ------------------------------ */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <Panel
                            title="Services booked"
                            icon="scissors"
                            fill
                            action={
                                <span className="text-xs font-medium text-[#1a3d1a]/45">
                                    by revenue
                                </span>
                            }
                        >
                            {services.length === 0 ? (
                                <EmptyState
                                    icon="scissors"
                                    message="No services were booked in this window."
                                />
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-[#1a3d1a]/10 text-left text-[0.68rem] uppercase tracking-[0.1em] text-[#1a3d1a]/45">
                                                <th className="pb-2 font-semibold">
                                                    Service
                                                </th>
                                                <th className="pb-2 text-right font-semibold">
                                                    Booked
                                                </th>
                                                <th className="pb-2 text-right font-semibold">
                                                    Done
                                                </th>
                                                <th className="pb-2 text-right font-semibold">
                                                    Missed
                                                </th>
                                                <th className="pb-2 text-right font-semibold">
                                                    Revenue
                                                </th>
                                                <th className="w-24 pb-2 font-semibold">
                                                    Share
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {services.map((row) => (
                                                <tr
                                                    key={row.service}
                                                    className="border-b border-[#1a3d1a]/6 last:border-b-0"
                                                >
                                                    <td className="py-2.5 font-medium text-[#1a3d1a]">
                                                        {row.service}
                                                    </td>
                                                    <td className="py-2.5 text-right text-[#1a3d1a]/70">
                                                        {row.bookings}
                                                    </td>
                                                    <td className="py-2.5 text-right text-[#1a3d1a]/70">
                                                        {row.completed}
                                                    </td>
                                                    <td className="py-2.5 text-right text-[#1a3d1a]/70">
                                                        {row.lost}
                                                    </td>
                                                    <td className="py-2.5 text-right font-semibold text-[#1a3d1a]">
                                                        {currency(row.revenue)}
                                                    </td>
                                                    <td className="py-2.5">
                                                        <span className="flex items-center gap-2">
                                                            <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#1a3d1a]/5">
                                                                <span
                                                                    className="block h-full rounded-full bg-[#1a3d1a]"
                                                                    style={{
                                                                        width: `${row.share}%`,
                                                                    }}
                                                                />
                                                            </span>
                                                            <span className="w-9 text-right text-xs text-[#1a3d1a]/50">
                                                                {row.share}%
                                                            </span>
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Panel>
                    </div>

                    <Panel
                        title="Care team"
                        icon="user"
                        fill
                        action={
                            <span className="text-xs font-medium text-[#1a3d1a]/45">
                                visits handled
                            </span>
                        }
                    >
                        {staff.length === 0 ? (
                            <EmptyState
                                icon="user"
                                message="No visits were assigned in this window."
                            />
                        ) : (
                            <ul className="space-y-3">
                                {staff.map((row) => (
                                    <li
                                        key={row.staff}
                                        className="flex items-center justify-between gap-3 text-sm"
                                    >
                                        <span className="font-medium text-[#1a3d1a]">
                                            {row.staff}
                                        </span>
                                        <span className="text-[#1a3d1a]/60">
                                            {row.visits}
                                            <span className="ml-1.5 text-xs text-[#1a3d1a]/45">
                                                {row.completed} completed
                                            </span>
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Panel>
                </div>

                {/* Clients and feedback ------------------------------------ */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <Panel title="Clients" icon="paw" fill>
                        <Figure
                            label="Clients seen"
                            value={`${clients.served}`}
                        />
                        <Figure
                            label="First visit"
                            value={`${clients.first_visit}`}
                            hint="never seen before this window"
                        />
                        <Figure
                            label="Returning"
                            value={`${clients.returning}`}
                            hint="seen before this window"
                        />
                        <Figure
                            label="New registrations"
                            value={`${clients.new_owners}`}
                            hint="portal accounts created"
                        />
                        <Figure
                            label="Dogs registered"
                            value={`${clients.new_dogs}`}
                            hint="added to the register"
                        />
                    </Panel>

                    <Panel title="Top clients by spend" icon="star" fill>
                        {clients.top_spenders.length === 0 ? (
                            <EmptyState
                                icon="star"
                                message="No completed visits to total up yet."
                            />
                        ) : (
                            <ul className="space-y-3">
                                {clients.top_spenders.map((row) => (
                                    <li
                                        key={row.owner}
                                        className="flex items-center justify-between gap-3 text-sm"
                                    >
                                        <span className="truncate font-medium text-[#1a3d1a]">
                                            {row.owner}
                                        </span>
                                        <span className="shrink-0 text-[#1a3d1a]/60">
                                            {currency(row.spend)}
                                            <span className="ml-1.5 text-xs text-[#1a3d1a]/45">
                                                {row.visits}{' '}
                                                {row.visits === 1
                                                    ? 'visit'
                                                    : 'visits'}
                                            </span>
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Panel>

                    <Panel
                        title="Client ratings"
                        icon="star"
                        fill
                        action={
                            <span className="text-xs font-medium text-[#1a3d1a]/45">
                                {ratings.count}{' '}
                                {ratings.count === 1 ? 'review' : 'reviews'}
                            </span>
                        }
                    >
                        {ratings.average === null ? (
                            <EmptyState
                                icon="star"
                                message="No reviews were left in this window."
                            />
                        ) : (
                            <>
                                <p className="flex items-baseline gap-2">
                                    <span className="font-serif-display text-4xl leading-none text-[#1a3d1a]">
                                        {ratings.average.toFixed(1)}
                                    </span>
                                    <span className="text-sm text-[#1a3d1a]/50">
                                        out of 5
                                    </span>
                                </p>
                                <ul className="mt-4 space-y-2">
                                    {ratings.distribution.map((row) => (
                                        <li
                                            key={row.stars}
                                            className="flex items-center gap-2 text-xs"
                                        >
                                            <span className="flex w-12 items-center gap-1 text-[#1a3d1a]/60">
                                                {row.stars}
                                                <Icon
                                                    name="star"
                                                    filled
                                                    className="h-3 w-3 text-[#E86A10]"
                                                />
                                            </span>
                                            <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#1a3d1a]/5">
                                                <span
                                                    className="block h-full rounded-full bg-[#E86A10]"
                                                    style={{
                                                        width: `${share(row.count, ratings.count)}%`,
                                                    }}
                                                />
                                            </span>
                                            <span className="w-6 text-right text-[#1a3d1a]/50">
                                                {row.count}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </Panel>
                </div>

                {/* The practice as it stands ------------------------------- */}
                <section aria-label="All-time figures" className="pt-2">
                    <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#1a3d1a]">
                        <Icon name="chart" className="h-4 w-4" />
                        The practice as it stands
                        <span className="text-xs font-normal text-[#1a3d1a]/45">
                            — not limited to the window above
                        </span>
                    </h2>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <Panel title="Records" icon="user" fill>
                            <Figure
                                label="Accounts"
                                value={`${all_time.accounts.total}`}
                                hint={`${all_time.accounts.admins} admin · ${clients.total_owners} dog owners`}
                            />
                            <Figure
                                label="Dog owners"
                                value={`${clients.total_owners}`}
                                hint={`${clients.active_owners} active`}
                            />
                            <Figure
                                label="Dogs on file"
                                value={`${clients.total_dogs}`}
                                hint={`${clients.active_dogs} active`}
                            />
                            <Figure
                                label="Staff accounts"
                                value={`${all_time.accounts.staff}`}
                            />
                        </Panel>

                        <Panel
                            title="Owner sign-ups"
                            icon="user"
                            fill
                            action={
                                <span className="text-xs font-medium text-[#1a3d1a]/45">
                                    last {all_time.signups.length} months
                                </span>
                            }
                        >
                            {signupTotal === 0 ? (
                                <EmptyState
                                    icon="user"
                                    message="No new owner accounts in this stretch."
                                />
                            ) : (
                                <ColumnChart
                                    data={all_time.signups}
                                    height="8rem"
                                />
                            )}
                        </Panel>

                        <Panel
                            title="Dogs by breed"
                            icon="paw"
                            fill
                            action={
                                <span className="text-xs font-medium text-[#1a3d1a]/45">
                                    {clients.total_dogs} on file
                                </span>
                            }
                        >
                            {all_time.breeds.length === 0 ? (
                                <EmptyState
                                    icon="paw"
                                    message="No dogs are registered yet."
                                />
                            ) : (
                                <BarList
                                    rows={all_time.breeds.slice(0, 6).map((row) => ({
                                        label: row.label,
                                        value: `${row.count}`,
                                        count: row.count,
                                        share: share(
                                            row.count,
                                            clients.total_dogs,
                                        ),
                                    }))}
                                    bar="bg-[#E86A10]"
                                />
                            )}
                        </Panel>
                    </div>
                </section>

                <p className="flex flex-wrap items-center gap-2 text-xs text-[#1a3d1a]/45">
                    <Icon name="clock" className="h-3.5 w-3.5" />
                    {clinic} · figures reflect live records as of{' '}
                    {figures.generated_at}. Exports carry the window{' '}
                    {range.from} → {range.to}.
                </p>
            </div>
        </StaffLayout>
    );
}
