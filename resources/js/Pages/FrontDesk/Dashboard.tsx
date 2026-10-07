import AppointmentStatusChip from '@/Components/AppointmentStatusChip';
import { secondaryButtonClass } from '@/Components/buttonStyles';
import Icon, { IconName } from '@/Components/Icon';
import Panel, { EmptyState, SoonChip, SoonState } from '@/Components/Panel';
import StaffLayout from '@/Layouts/StaffLayout';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';

/**
 * Operations shortcuts. Anything not wired to a feature yet renders as a dashed,
 * disabled tile so the gap in the build is visible rather than a dead click.
 */
const quickActions: {
    label: string;
    icon: IconName;
    href?: string;
}[] = [
    { label: 'Book an appointment', icon: 'calendar' },
    { label: 'Record a payment', icon: 'sparkles' },
    { label: 'Log a complaint', icon: 'shield' },
];

/** One booking as the desk list renders it. */
interface DeskAppointment {
    id: number;
    date: string | null;
    time: string | null;
    status: string | null;
    dog: string | null;
    owner: string | null;
    owner_id: number | null;
    service: string | null;
    duration_minutes: number | null;
    staff: string | null;
    notes: string | null;
}

interface DeskStats {
    today: number;
    upcoming: number;
    /** Visits from today on that the desk has not confirmed yet. */
    requested: number;
}

interface StatusOption {
    value: string;
    label: string;
}

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

/** The two views the appointments panel switches between. */
const tabs = [
    { value: 'today', label: 'Today' },
    { value: 'upcoming', label: 'Upcoming' },
] as const;

export default function FrontDeskDashboard({
    today,
    upcoming,
    filter,
    statusOptions,
    stats,
}: {
    today: DeskAppointment[];
    upcoming: DeskAppointment[];
    filter: { status: string };
    statusOptions: StatusOption[];
    stats: DeskStats;
}) {
    const [tab, setTab] = useState<(typeof tabs)[number]['value']>('today');
    const [actionError, setActionError] = useState<string | null>(null);

    const appointments = tab === 'today' ? today : upcoming;

    /*
     * Confirming or cancelling reloads the page props, so the row's chip and
     * the confirmation counter update without a full browser navigation. The
     * server whitelists the transitions; a stale row's complaint lands here.
     */
    const changeStatus = (
        appointment: DeskAppointment,
        action: 'confirm' | 'cancel',
    ) => {
        const url =
            action === 'confirm'
                ? route('admin.operations.appointments.confirm', appointment.id)
                : route('admin.operations.appointments.cancel', appointment.id);

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
    };

    // Filtered server-side: the upcoming list is capped, so filtering only the
    // preview would hide matching visits further out.
    const applyStatus = (value: string) => {
        router.get(
            route('admin.operations.dashboard'),
            value === 'all' ? {} : { status: value },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    return (
        <StaffLayout
            title="Admin Operations"
            heading="Admin operations"
            description="Today's bookings, appointment requests, and the client records the clinic manages."
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
                <Panel title="Quick actions" icon="sparkles">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {quickActions.map((action) =>
                            action.href ? (
                                <Link
                                    key={action.label}
                                    href={action.href}
                                    className="group flex items-center gap-3 rounded-2xl border border-[#1a3d1a]/10 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#1a3d1a]/20 hover:shadow-lg hover:shadow-[#1a3d1a]/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a] focus-visible:ring-offset-2"
                                >
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EFFDF0] text-[#1a3d1a] transition-colors duration-200 group-hover:bg-[#E86A10]/10 group-hover:text-[#E86A10]">
                                        <Icon
                                            name={action.icon}
                                            className="h-5 w-5"
                                        />
                                    </span>
                                    <span className="text-sm font-semibold text-[#1a3d1a]">
                                        {action.label}
                                    </span>
                                </Link>
                            ) : (
                                <div
                                    key={action.label}
                                    aria-disabled="true"
                                    className="flex items-center gap-3 rounded-2xl border border-dashed border-[#1a3d1a]/15 bg-[#EFFDF0]/60 p-4"
                                >
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#1a3d1a]/35">
                                        <Icon
                                            name={action.icon}
                                            className="h-5 w-5"
                                        />
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block text-sm font-semibold text-[#1a3d1a]/50">
                                            {action.label}
                                        </span>
                                        <span className="mt-0.5 block text-[0.66rem] font-semibold uppercase tracking-[0.12em] text-[#1a3d1a]/35">
                                            Coming soon
                                        </span>
                                    </span>
                                </div>
                            ),
                        )}
                    </div>
                </Panel>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Panel
                        title="Appointments"
                        icon="calendar"
                        fill
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
                        <div
                            role="tablist"
                            aria-label="Appointment range"
                            className="mb-4 flex gap-1 rounded-full bg-[#EFFDF0]/70 p-1"
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
                                        onClick={() => setTab(option.value)}
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

                        {actionError && (
                            <p
                                role="alert"
                                className="mb-4 rounded-xl bg-[#b3261e]/5 px-4 py-2.5 text-sm text-[#b3261e]"
                            >
                                {actionError}
                            </p>
                        )}

                        <div
                            role="group"
                            aria-label="Filter by status"
                            className="mb-4 flex flex-wrap gap-1.5"
                        >
                            {statusOptions.map((option) => {
                                const active = filter.status === option.value;

                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        aria-pressed={active}
                                        onClick={() => applyStatus(option.value)}
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

                        {appointments.length === 0 ? (
                            <EmptyState
                                icon="calendar"
                                message={
                                    filter.status !== 'all'
                                        ? `No ${filter.status.toLowerCase()} visits in this range.`
                                        : tab === 'today'
                                          ? 'Nothing is booked for today. New online requests will appear here as they come in.'
                                          : 'No future visits booked yet.'
                                }
                            />
                        ) : (
                            <ul className="max-h-[24rem] divide-y divide-[#1a3d1a]/5 overflow-y-auto">
                                {appointments.map((appointment) => (
                                    <li
                                        key={appointment.id}
                                        className="flex items-start justify-between gap-3 py-3.5 first:pt-0 last:pb-0"
                                    >
                                        <div className="flex min-w-0 items-start gap-3">
                                            <span className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[#EFFDF0] px-2.5 py-1.5 text-xs font-bold text-[#1a3d1a] ring-1 ring-[#1a3d1a]/10">
                                                {appointment.time ?? '—'}
                                            </span>

                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-[#1a3d1a]">
                                                    {appointment.service ??
                                                        'Visit'}
                                                </p>
                                                <p className="mt-0.5 truncate text-xs text-[#1a3d1a]/55">
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
                                                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#1a3d1a]/45">
                                                    {tab === 'upcoming' && (
                                                        <span>
                                                            {shortDate(
                                                                appointment.date,
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
                                                    {appointment.notes && (
                                                        <span className="italic">
                                                            {appointment.notes}
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                                            <AppointmentStatusChip
                                                status={appointment.status}
                                            />

                                            <div className="flex items-center gap-1.5">
                                                {appointment.status ===
                                                    'Requested' && (
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

                                                {(appointment.status ===
                                                    'Requested' ||
                                                    appointment.status ===
                                                        'Confirmed') && (
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
                                                    Open client
                                                </Link>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
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
                        title="Clients &amp; dogs"
                        icon="paw"
                        action={
                            <Link
                                href={route('owners.index')}
                                className="text-xs font-semibold text-[#E86A10] transition-colors duration-150 hover:text-[#d45e0d]"
                            >
                                Open dog owners
                            </Link>
                        }
                    >
                        <SoonState message="Recent client and dog activity will be summarised here. In the meantime, the desk records are all under Dog owners." />
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
        </StaffLayout>
    );
}
