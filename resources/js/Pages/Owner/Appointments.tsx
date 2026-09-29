import Panel from '@/Components/Panel';
import { primaryButtonClass } from '@/Components/buttonStyles';
import OwnerLayout from '@/Layouts/OwnerLayout';
import { PageProps, PortalAppointment } from '@/types';
import { Link } from '@inertiajs/react';
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
            </div>
        </OwnerLayout>
    );
}
