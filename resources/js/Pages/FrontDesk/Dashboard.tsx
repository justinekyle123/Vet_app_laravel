import AppointmentStatusChip from '@/Components/AppointmentStatusChip';
import { secondaryButtonClass } from '@/Components/buttonStyles';
import Icon from '@/Components/Icon';
import Panel, { EmptyState, SoonChip, SoonState } from '@/Components/Panel';
import StatCard from '@/Components/StatCard';
import StaffLayout from '@/Layouts/StaffLayout';
import { currency } from '@/utils/format';
import { Link, router } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

/** One booking as the desk list renders it. */
interface DeskAppointment {
    id: number;
    date: string | null;
    time: string | null;
    status: string | null;
    dog: string | null;
    owner: string | null;
    owner_id: number | null;
    owner_phone: string | null;
    owner_email: string | null;
    service: string | null;
    duration_minutes: number | null;
    price: string | null;
    staff: string | null;
    notes: string | null;
    requested_at: string | null;
    can_confirm: boolean;
    can_complete: boolean;
    can_no_show: boolean;
    can_cancel: boolean;
}

interface DeskStats {
    today: number;
    upcoming: number;
    /** Visits from today on that the desk has not confirmed yet. */
    requested: number;
    confirmed_today: number;
    completed_today: number;
    cancelled_today: number;
}

interface StatusOption {
    value: string;
    label: string;
}

type DeskAction = 'confirm' | 'complete' | 'no-show' | 'cancel';

/** Bare `YYYY-MM-DD` in local time, so the day cannot slip a timezone back. */
function shortDate(iso: string | null): string {
    if (!iso) {
        return '—';
    }

    const date = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);

    return Number.isNaN(date.getTime())
        ? '—'
        : date.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
          });
}

/** How long ago a request came in, in the coarsest useful unit. */
function requestedLabel(iso: string | null): string | null {
    if (!iso) {
        return null;
    }

    const then = new Date(iso).getTime();

    if (Number.isNaN(then)) {
        return null;
    }

    const minutes = Math.max(0, Math.round((Date.now() - then) / 60_000));

    if (minutes < 1) {
        return 'just now';
    }

    if (minutes < 60) {
        return `${minutes}m ago`;
    }

    const hours = Math.round(minutes / 60);

    if (hours < 24) {
        return `${hours}h ago`;
    }

    return `${Math.round(hours / 24)}d ago`;
}

/** The two views the appointments panel switches between. */
const tabs = [
    { value: 'today', label: 'Today' },
    { value: 'upcoming', label: 'Upcoming' },
] as const;

/** Copy and tone for each quick action, so the confirm dialog reads right. */
const actionCopy: Record<
    DeskAction,
    { verb: string; title: string; icon: 'question' | 'warning'; tone: string }
> = {
    confirm: {
        verb: 'Confirm',
        title: 'Confirm this appointment?',
        icon: 'question',
        tone: '#2a5a2a',
    },
    complete: {
        verb: 'Mark completed',
        title: 'Mark this visit as completed?',
        icon: 'question',
        tone: '#1a3d1a',
    },
    'no-show': {
        verb: 'Record no-show',
        title: 'Record this visit as a no-show?',
        icon: 'warning',
        tone: '#b3261e',
    },
    cancel: {
        verb: 'Cancel appointment',
        title: 'Cancel this appointment?',
        icon: 'warning',
        tone: '#b3261e',
    },
};

export default function FrontDeskDashboard({
    today,
    upcoming,
    filter,
    statusOptions,
    stats,
    upcomingLimit,
}: {
    today: DeskAppointment[];
    upcoming: DeskAppointment[];
    filter: { status: string; q: string };
    statusOptions: StatusOption[];
    stats: DeskStats;
    upcomingLimit: number;
}) {
    const [tab, setTab] = useState<(typeof tabs)[number]['value']>('today');
    const [search, setSearch] = useState(filter.q);
    const [actionError, setActionError] = useState<string | null>(null);

    const appointments = tab === 'today' ? today : upcoming;

    /*
     * Every transition changes a client's booking, so each is confirmed through
     * a themed SweetAlert before the request goes out.
     */
    const changeStatus = (appointment: DeskAppointment, action: DeskAction) => {
        const copy = actionCopy[action];
        const url = route(
            `admin.operations.appointments.${action}`,
            appointment.id,
        );
        const when = `${shortDate(appointment.date)} at ${appointment.time ?? '—'}`;

        Swal.fire({
            title: copy.title,
            text: `${appointment.service ?? 'This visit'} for ${appointment.dog ?? 'the client'} on ${when}.`,
            icon: copy.icon,
            showCancelButton: true,
            confirmButtonText: copy.verb,
            cancelButtonText: 'Back',
            confirmButtonColor: copy.tone,
            cancelButtonColor: '#1a3d1a',
            reverseButtons: true,
            focusCancel: true,
        }).then((result) => {
            if (!result.isConfirmed) {
                return;
            }

            router.patch(
                url,
                {},
                {
                    preserveScroll: true,
                    onSuccess: () => setActionError(null),
                    onError: (errors) =>
                        setActionError(
                            errors.appointment ??
                                'That change could not be applied.',
                        ),
                },
            );
        });
    };

    /* Both filters live in the URL, so a view can be shared or bookmarked. */
    const applyFilters = (overrides: Partial<typeof filter> = {}) => {
        const next = { status: filter.status, q: filter.q, ...overrides };
        const query: Record<string, string> = {};

        if (next.status !== 'all') {
            query.status = next.status;
        }

        if (next.q.trim() !== '') {
            query.q = next.q.trim();
        }

        router.get(route('admin.operations.dashboard'), query, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const submitSearch: FormEventHandler = (event) => {
        event.preventDefault();
        applyFilters({ q: search });
    };

    const hasFilters = filter.status !== 'all' || filter.q !== '';
    const completedShare =
        stats.today > 0
            ? Math.round((stats.completed_today / stats.today) * 100)
            : 0;

    return (
        <StaffLayout
            title="Operations"
            heading="Operations"
            description="Today's bookings, requests to accept or decline, and the visits that still need closing out."
            actions={
                <Link
                    href={route('owners.index')}
                    className={secondaryButtonClass}
                >
                    <Icon name="paw" className="h-4 w-4" />
                    Dog owners
                </Link>
            }
        >
            <div className="space-y-6">
                <section
                    aria-label="Operations totals"
                    className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
                >
                    <StatCard
                        label="Today's visits"
                        value={stats.today}
                        icon="calendar"
                        accent="brand"
                        hint={`${stats.upcoming} more booked after today`}
                    />
                    <StatCard
                        label="Awaiting confirmation"
                        value={stats.requested}
                        icon="sparkles"
                        accent="accent"
                        hint={
                            stats.requested > 0
                                ? 'Accept or decline from the list below'
                                : 'Every request has been answered'
                        }
                    />
                    <StatCard
                        label="Completed today"
                        value={stats.completed_today}
                        icon="check"
                        accent="deep"
                        hint={`${stats.confirmed_today} still confirmed`}
                    />
                    <StatCard
                        label="Closed without a visit"
                        value={stats.cancelled_today}
                        icon="close"
                        accent="accent"
                        hint="Cancelled or no-show today"
                    />
                </section>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <Panel
                            title="Appointments"
                            icon="calendar"
                            fill
                            flush
                            action={
                                <span
                                    className={`shrink-0 rounded-full px-2.5 py-1 text-[0.68rem] font-semibold ${
                                        stats.requested > 0
                                            ? 'bg-[#E86A10]/10 text-[#E86A10]'
                                            : 'bg-[#EFFDF0] text-[#1a3d1a]/60'
                                    }`}
                                >
                                    {stats.requested > 0
                                        ? `${stats.requested} awaiting confirmation`
                                        : 'All confirmed'}
                                </span>
                            }
                        >
                            <div className="space-y-4 p-5">
                                <div
                                    role="tablist"
                                    aria-label="Appointment range"
                                    className="flex gap-1 rounded-full bg-[#EFFDF0]/70 p-1"
                                >
                                    {tabs.map((option) => {
                                        const active = tab === option.value;
                                        const count =
                                            option.value === 'today'
                                                ? stats.today
                                                : stats.upcoming;

                                        return (
                                            <button
                                                key={option.value}
                                                type="button"
                                                role="tab"
                                                aria-selected={active}
                                                onClick={() =>
                                                    setTab(option.value)
                                                }
                                                className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a] ${
                                                    active
                                                        ? 'bg-white text-[#1a3d1a] shadow-sm'
                                                        : 'text-[#1a3d1a]/55 hover:text-[#1a3d1a]'
                                                }`}
                                            >
                                                {option.label} ({count})
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="flex flex-wrap items-center gap-3">
                                    <form
                                        onSubmit={submitSearch}
                                        className="relative flex flex-1 items-center"
                                    >
                                        <Icon
                                            name="search"
                                            className="pointer-events-none absolute left-3.5 h-4 w-4 text-[#1a3d1a]/35"
                                        />
                                        <label
                                            htmlFor="operations-search"
                                            className="sr-only"
                                        >
                                            Search appointments
                                        </label>
                                        <input
                                            id="operations-search"
                                            type="search"
                                            value={search}
                                            onChange={(event) =>
                                                setSearch(event.target.value)
                                            }
                                            placeholder="Search client, dog, or service…"
                                            className="w-full rounded-full border border-[#1a3d1a]/15 bg-white py-2.5 pl-10 pr-4 text-sm text-[#1a3d1a] shadow-sm transition-[border-color,box-shadow] duration-200 placeholder:text-[#1a3d1a]/35 focus:border-[#1a3d1a] focus:outline-none focus:ring-4 focus:ring-[#1a3d1a]/15"
                                        />
                                    </form>

                                    {hasFilters && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSearch('');
                                                applyFilters({
                                                    status: 'all',
                                                    q: '',
                                                });
                                            }}
                                            className="text-xs font-semibold text-[#E86A10] transition-colors duration-150 hover:text-[#d45e0d]"
                                        >
                                            Clear filters
                                        </button>
                                    )}
                                </div>

                                <div
                                    role="group"
                                    aria-label="Filter by status"
                                    className="flex flex-wrap gap-1.5"
                                >
                                    {statusOptions.map((option) => {
                                        const active =
                                            filter.status === option.value;

                                        return (
                                            <button
                                                key={option.value}
                                                type="button"
                                                aria-pressed={active}
                                                onClick={() =>
                                                    applyFilters({
                                                        status: option.value,
                                                    })
                                                }
                                                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a] ${
                                                    active
                                                        ? 'bg-[#1a3d1a] text-white shadow-sm'
                                                        : 'border border-[#1a3d1a]/15 bg-white text-[#1a3d1a]/60 hover:bg-[#EFFDF0] hover:text-[#1a3d1a]'
                                                }`}
                                            >
                                                {option.label}
                                            </button>
                                        );
                                    })}
                                </div>

                                {actionError && (
                                    <p
                                        role="alert"
                                        className="rounded-xl bg-[#b3261e]/5 px-4 py-2.5 text-sm text-[#b3261e]"
                                    >
                                        {actionError}
                                    </p>
                                )}
                            </div>

                            {appointments.length === 0 ? (
                                <div className="px-5 pb-5">
                                    <EmptyState
                                        icon="calendar"
                                        message={
                                            hasFilters
                                                ? 'No visits match these filters. Try a different status or search.'
                                                : tab === 'today'
                                                  ? 'Nothing is booked for today. New online requests will appear here as they come in.'
                                                  : 'No future visits booked yet.'
                                        }
                                    />
                                </div>
                            ) : (
                                <ul className="divide-y divide-[#1a3d1a]/5 border-t border-[#1a3d1a]/10">
                                    {appointments.map((appointment) => (
                                        <li
                                            key={appointment.id}
                                            className={`flex flex-col gap-3 px-5 py-4 transition-colors duration-150 hover:bg-[#EFFDF0]/50 sm:flex-row sm:items-start sm:justify-between ${
                                                appointment.can_confirm
                                                    ? 'border-l-2 border-l-[#E86A10]'
                                                    : ''
                                            }`}
                                        >
                                            <div className="flex min-w-0 items-start gap-3">
                                                <div className="flex shrink-0 flex-col items-center gap-1">
                                                    <span className="inline-flex min-w-[3.5rem] items-center justify-center rounded-lg bg-[#EFFDF0] px-2.5 py-1.5 text-xs font-bold text-[#1a3d1a] ring-1 ring-[#1a3d1a]/10">
                                                        {appointment.time ??
                                                            '—'}
                                                    </span>
                                                    {tab === 'upcoming' && (
                                                        <span className="text-[0.62rem] font-semibold text-[#1a3d1a]/45">
                                                            {shortDate(
                                                                appointment.date,
                                                            )}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <p className="truncate text-sm font-semibold text-[#1a3d1a]">
                                                            {appointment.service ??
                                                                'Visit'}
                                                        </p>
                                                        <AppointmentStatusChip
                                                            status={
                                                                appointment.status
                                                            }
                                                        />
                                                    </div>

                                                    <p className="mt-0.5 truncate text-xs text-[#1a3d1a]/60">
                                                        {[
                                                            appointment.dog,
                                                            appointment.owner
                                                                ? `for ${appointment.owner}`
                                                                : null,
                                                        ]
                                                            .filter(Boolean)
                                                            .join(' · ') ||
                                                            'Client details missing'}
                                                    </p>

                                                    <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#1a3d1a]/45">
                                                        {(appointment.owner_phone ||
                                                            appointment.owner_email) && (
                                                            <span>
                                                                {appointment.owner_phone ??
                                                                    appointment.owner_email}
                                                            </span>
                                                        )}
                                                        {appointment.duration_minutes && (
                                                            <span>
                                                                {
                                                                    appointment.duration_minutes
                                                                }{' '}
                                                                min
                                                            </span>
                                                        )}
                                                        {appointment.price && (
                                                            <span>
                                                                {currency(
                                                                    appointment.price,
                                                                )}
                                                            </span>
                                                        )}
                                                        {appointment.staff && (
                                                            <span>
                                                                with{' '}
                                                                {
                                                                    appointment.staff
                                                                }
                                                            </span>
                                                        )}
                                                        {appointment.requested_at &&
                                                            appointment.status ===
                                                                'Requested' && (
                                                                <span className="font-semibold text-[#E86A10]">
                                                                    requested{' '}
                                                                    {requestedLabel(
                                                                        appointment.requested_at,
                                                                    )}
                                                                </span>
                                                            )}
                                                    </p>

                                                    {appointment.notes && (
                                                        <p className="mt-1.5 rounded-lg bg-[#EFFDF0]/70 px-2.5 py-1.5 text-xs italic leading-relaxed text-[#1a3d1a]/60">
                                                            {appointment.notes}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    {appointment.can_confirm && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                changeStatus(
                                                                    appointment,
                                                                    'confirm',
                                                                )
                                                            }
                                                            className="rounded-full border border-[#2a5a2a]/25 bg-white px-2.5 py-1 text-[0.68rem] font-semibold text-[#2a5a2a] transition-colors duration-150 hover:bg-[#2a5a2a]/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2a5a2a]"
                                                        >
                                                            Confirm
                                                        </button>
                                                    )}

                                                    {appointment.can_complete && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                changeStatus(
                                                                    appointment,
                                                                    'complete',
                                                                )
                                                            }
                                                            className="rounded-full border border-[#1a3d1a]/25 bg-white px-2.5 py-1 text-[0.68rem] font-semibold text-[#1a3d1a] transition-colors duration-150 hover:bg-[#1a3d1a]/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]"
                                                        >
                                                            Complete
                                                        </button>
                                                    )}

                                                    {appointment.can_no_show && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                changeStatus(
                                                                    appointment,
                                                                    'no-show',
                                                                )
                                                            }
                                                            className="rounded-full border border-[#1a3d1a]/15 bg-white px-2.5 py-1 text-[0.68rem] font-semibold text-[#1a3d1a]/55 transition-colors duration-150 hover:bg-[#1a3d1a]/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]"
                                                        >
                                                            No-show
                                                        </button>
                                                    )}

                                                    {appointment.can_cancel && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                changeStatus(
                                                                    appointment,
                                                                    'cancel',
                                                                )
                                                            }
                                                            className="rounded-full border border-[#b3261e]/25 bg-white px-2.5 py-1 text-[0.68rem] font-semibold text-[#b3261e] transition-colors duration-150 hover:bg-[#b3261e]/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b3261e]"
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                </div>

                                                {appointment.owner_id && (
                                                    <Link
                                                        href={route(
                                                            'owners.show',
                                                            appointment.owner_id,
                                                        )}
                                                        className="text-[0.68rem] font-semibold text-[#E86A10] transition-colors duration-150 hover:text-[#d45e0d]"
                                                    >
                                                        Open client →
                                                    </Link>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {tab === 'upcoming' &&
                                upcoming.length === upcomingLimit && (
                                    <p className="border-t border-[#1a3d1a]/10 px-5 py-3 text-xs text-[#1a3d1a]/45">
                                        Showing the next {upcomingLimit} visits.
                                        Use the status filter or search to
                                        narrow them down.
                                    </p>
                                )}
                        </Panel>
                    </div>

                    <div className="space-y-6">
                        <Panel title="Today at a glance" icon="clock">
                            {stats.today === 0 ? (
                                <p className="text-sm leading-relaxed text-[#1a3d1a]/55">
                                    No visits are scheduled for today yet.
                                </p>
                            ) : (
                                <>
                                    <div className="flex items-end justify-between gap-3">
                                        <p className="font-serif-display text-3xl leading-none text-[#1a3d1a]">
                                            {stats.completed_today}
                                            <span className="text-base text-[#1a3d1a]/45">
                                                /{stats.today}
                                            </span>
                                        </p>
                                        <span className="text-xs font-semibold text-[#1a3d1a]/55">
                                            {completedShare}% done
                                        </span>
                                    </div>

                                    <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-[#1a3d1a]/5">
                                        <div
                                            className="h-full rounded-full bg-[#1a3d1a] transition-[width] duration-500"
                                            style={{
                                                width: `${completedShare}%`,
                                            }}
                                        />
                                    </div>

                                    <ul className="mt-5 space-y-3">
                                        <li className="flex items-center justify-between gap-3 text-sm">
                                            <span className="flex items-center gap-2.5 text-[#1a3d1a]/70">
                                                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#E86A10]" />
                                                Awaiting confirmation
                                            </span>
                                            <span className="font-semibold text-[#1a3d1a]">
                                                {stats.requested}
                                            </span>
                                        </li>
                                        <li className="flex items-center justify-between gap-3 text-sm">
                                            <span className="flex items-center gap-2.5 text-[#1a3d1a]/70">
                                                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#2a5a2a]" />
                                                Confirmed today
                                            </span>
                                            <span className="font-semibold text-[#1a3d1a]">
                                                {stats.confirmed_today}
                                            </span>
                                        </li>
                                        <li className="flex items-center justify-between gap-3 text-sm">
                                            <span className="flex items-center gap-2.5 text-[#1a3d1a]/70">
                                                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#1a3d1a]" />
                                                Completed today
                                            </span>
                                            <span className="font-semibold text-[#1a3d1a]">
                                                {stats.completed_today}
                                            </span>
                                        </li>
                                        <li className="flex items-center justify-between gap-3 text-sm">
                                            <span className="flex items-center gap-2.5 text-[#1a3d1a]/70">
                                                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#b3261e]" />
                                                Cancelled / no-show
                                            </span>
                                            <span className="font-semibold text-[#1a3d1a]">
                                                {stats.cancelled_today}
                                            </span>
                                        </li>
                                    </ul>
                                </>
                            )}
                        </Panel>

                        <Panel
                            title="Unpaid invoices"
                            icon="sparkles"
                            action={<SoonChip />}
                        >
                            <SoonState message="The unpaid queue will appear here once payments are being recorded at the desk." />
                        </Panel>

                        <Panel
                            title="Open complaints"
                            icon="shield"
                            action={<SoonChip />}
                        >
                            <SoonState message="Complaints awaiting a response will appear here once the complaints log is built." />
                        </Panel>
                    </div>
                </div>
            </div>
        </StaffLayout>
    );
}
