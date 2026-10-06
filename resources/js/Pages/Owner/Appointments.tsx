import Panel from '@/Components/Panel';
import { primaryButtonClass } from '@/Components/buttonStyles';
import OwnerLayout from '@/Layouts/OwnerLayout';
import { PageProps, PortalAppointment } from '@/types';
import { Link } from '@inertiajs/react';
import { ArrowRight, CalendarDays, Clock, PawPrint } from 'lucide-react';
import AppointmentList, { fullDate } from './Partials/AppointmentList';
import { OwnerHero, SectionLabel } from './Partials/OwnerHero';
import { ArrowRight } from 'lucide-react';
import AppointmentList from './Partials/AppointmentList';

/** Small count chip for a panel header. */
function CountChip({ count }: { count: number }) {
    return (
        <span className="rounded-full bg-[#EFFDF0] px-2.5 py-1 text-[0.68rem] font-semibold text-[#1a3d1a]/70">
            {count}
        </span>
    );
}

/**
 * The owner's own visits: what is coming up, and the record of what has
 * already happened. Both lists are scoped to the signed-in owner server-side.
 */
export default function Appointments({
    upcoming,
    past,
}: PageProps<{
    upcoming: PortalAppointment[];
    past: PortalAppointment[];
}>) {
    const next = upcoming[0] ?? null;

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
            <OwnerHero
                eyebrow={next ? 'Next visit' : 'Your visits'}
                title={
                    next ? (next.service ?? 'Visit') : 'Nothing booked yet'
                }
                description={
                    next
                        ? undefined
                        : "Browse the clinic's services to find a time that suits you, and request a visit in a couple of taps."
                }
                badge={
                    next ? (
                        <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-inset ring-white/15">
                            {next.status ?? 'Scheduled'}
                        </span>
                    ) : undefined
                }
                actions={
                    <Link
                        href={route('owner.services.index')}
                        className={primaryButtonClass}
                    >
                        Book a service
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                }
            >
                {next && (
                    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/75">
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
                    </div>
                )}
            </OwnerHero>

            <section className="mt-8">
                <SectionLabel>Upcoming</SectionLabel>
                <Panel
                    title="Upcoming visits"
            <div className="space-y-6">
                <Panel
                    title="Upcoming"
                    icon="calendar"
                    action={<CountChip count={upcoming.length} />}
                >
                    <AppointmentList
                        appointments={upcoming}
                        emptyMessage="No visits booked yet. Browse the clinic's services to see what is available."
                    />
                </Panel>
            </section>

            <section className="mt-8">
                <SectionLabel>History</SectionLabel>

                <Panel
                    title="Past visits"
                    icon="clock"
                    action={<CountChip count={past.length} />}
                >
                    <AppointmentList
                        appointments={past}
                        emptyMessage="No past visits on record yet."
                    />
                </Panel>
            </section>
            </div>
        </OwnerLayout>
    );
}
