import Panel from '@/Components/Panel';
import StatCard from '@/Components/StatCard';
import { primaryButtonClass } from '@/Components/buttonStyles';
import OwnerLayout from '@/Layouts/OwnerLayout';
import { PageProps, PortalAppointment } from '@/types';
import { currency } from '@/utils/format';
import { Link, router } from '@inertiajs/react';
import { ArrowRight, CalendarDays, Clock, PawPrint } from 'lucide-react';
import AppointmentList, {
    fullDate,
    relativeDay,
} from './Partials/AppointmentList';
import { OwnerHero, SectionLabel } from './Partials/OwnerHero';

/** Small count chip for a panel header. */
function CountChip({ count }: { count: number }) {
    return (
        <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-[#1a3d1a]/8 px-2 text-[0.68rem] font-bold tabular-nums text-[#1a3d1a]/70">
            {count}
        </span>
    );
}

const historyTabs = [
    { value: 'all', label: 'All', empty: 'No past visits on record yet.' },
    {
        value: 'completed',
        label: 'Completed',
        empty: 'No completed visits yet.',
    },
    {
        value: 'cancelled',
        label: 'Cancelled',
        empty: 'No cancelled or missed visits — good news.',
    },
] as const;

type HistoryFilter = (typeof historyTabs)[number]['value'];

/** The numbers behind the page, in the words a client would use. */
interface SummaryTotals {
    upcoming: number;
    completed: number;
    cancelled: number;
    awaiting_review: number;
    spend: string;
}

/**
 * The owner's own visits: what is coming up, what has already happened, and
 * what the clinic has recorded against their account. Both lists are scoped to
 * the signed-in owner server-side.
 */
export default function Appointments({
    upcoming,
    past,
    historyFilter,
    summary,
}: PageProps<{
    upcoming: PortalAppointment[];
    past: PortalAppointment[];
    historyFilter: HistoryFilter;
    summary: SummaryTotals;
}>) {
    const next = upcoming[0] ?? null;
    const when = next ? relativeDay(next.date) : null;
    const activeTab =
        historyTabs.find((tab) => tab.value === historyFilter) ??
        historyTabs[0];

    const applyHistory = (value: HistoryFilter) => {
        router.get(
            route('owner.appointments.index'),
            value === 'all' ? {} : { history: value },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    return (
        <OwnerLayout
            title="My appointments"
            heading="My appointments"
            description="Every visit booked for your dogs, past and upcoming."
            actions={
                <Link
                    href={route('owner.services.index')}
                    className={primaryButtonClass}
                >
                    Browse services
                    <ArrowRight className="h-4 w-4" />
                </Link>
            }
        >
            {/* ── Next visit hero ─────────────────────────────────────── */}
            <OwnerHero
                eyebrow={next ? 'Next visit' : 'Your visits'}
                title={next ? (next.service ?? 'Visit') : 'Nothing booked yet'}
                description={
                    next
                        ? undefined
                        : "Browse the clinic's services to see what is available, then call the front desk to arrange a visit."
                }
                badge={
                    next ? (
                        <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-inset ring-white/15 backdrop-blur">
                            {next.status ?? 'Scheduled'}
                        </span>
                    ) : undefined
                }
                actions={
                    <Link
                        href={route('owner.services.index')}
                        className={primaryButtonClass}
                    >
                        Browse services
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                }
            >
                {next && (
                    <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/75">
                        <span className="inline-flex items-center gap-2">
                            <PawPrint className="h-4 w-4 text-[#E86A10]" />
                            {next.dog ?? 'Your dog'}
                        </span>
                        <span className="inline-flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-[#E86A10]" />
                            {fullDate(next.date)}
                        </span>
                        {next.time && (
                            <span className="inline-flex items-center gap-2">
                                <Clock className="h-4 w-4 text-[#E86A10]" />
                                {next.time}
                            </span>
                        )}
                        {when && (
                            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white ring-1 ring-inset ring-white/15 backdrop-blur">
                                {when}
                            </span>
                        )}
                    </div>
                )}
            </OwnerHero>

            {/* ── At-a-glance stats ───────────────────────────────────── */}
            <section className="mt-10">
                <SectionLabel>Your record</SectionLabel>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        label="Upcoming visits"
                        value={summary.upcoming}
                        icon="calendar"
                        hint="Booked and still going ahead"
                    />
                    <StatCard
                        label="Completed"
                        value={summary.completed}
                        icon="check"
                        hint="Visits the clinic has carried out"
                        accent="deep"
                    />
                    <StatCard
                        label="Awaiting your review"
                        value={summary.awaiting_review}
                        icon="star"
                        hint={
                            summary.awaiting_review > 0
                                ? 'Tell the clinic how a visit went'
                                : 'Every completed visit has been rated'
                        }
                        accent="accent"
                    />
                    <StatCard
                        label="Spent with us"
                        value={Number.parseFloat(summary.spend)}
                        display={currency(summary.spend)}
                        icon="heart"
                        hint="On completed visits"
                    />
                </div>
            </section>

            {/* ── Upcoming visits ─────────────────────────────────────── */}
            <section className="mt-10">
                <SectionLabel>Upcoming</SectionLabel>
                <Panel
                    title="Upcoming visits"
                    icon="calendar"
                    action={<CountChip count={upcoming.length} />}
                >
                    <AppointmentList
                        appointments={upcoming}
                        emptyMessage="No visits booked yet. Browse the clinic's services to see what is available."
                        emptyAction={
                            <Link
                                href={route('owner.services.index')}
                                className={primaryButtonClass}
                            >
                                Browse services
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        }
                    />
                </Panel>
            </section>

            {/* ── Visit history ───────────────────────────────────────── */}
            <section className="mt-10">
                <SectionLabel>History</SectionLabel>
                <Panel
                    title="Past visits"
                    icon="clock"
                    action={<CountChip count={past.length} />}
                >
                    {/* Filter bar */}
                    <div className="mb-5 flex flex-col gap-3 border-b border-[#1a3d1a]/8 pb-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs leading-relaxed text-[#1a3d1a]/55">
                            Visits the clinic has carried out, plus any that
                            were cancelled or missed.
                        </p>

                        <div
                            role="group"
                            aria-label="Filter past visits"
                            className="inline-flex shrink-0 items-center gap-1 self-start rounded-full bg-[#1a3d1a]/5 p-1 sm:self-auto"
                        >
                            {historyTabs.map((tab) => {
                                const isActive = historyFilter === tab.value;

                                return (
                                    <button
                                        key={tab.value}
                                        type="button"
                                        aria-pressed={isActive}
                                        onClick={() => applyHistory(tab.value)}
                                        className={`relative rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a] focus-visible:ring-offset-1 ${
                                            isActive
                                                ? 'bg-white text-[#1a3d1a] shadow-sm ring-1 ring-[#1a3d1a]/5'
                                                : 'text-[#1a3d1a]/55 hover:text-[#1a3d1a]'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <AppointmentList
                        appointments={past}
                        emptyMessage={activeTab.empty}
                    />
                </Panel>
            </section>
        </OwnerLayout>
    );
}