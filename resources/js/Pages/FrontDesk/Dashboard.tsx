import { secondaryButtonClass } from '@/Components/buttonStyles';
import Icon, { IconName } from '@/Components/Icon';
import Panel, { SoonChip, SoonState } from '@/Components/Panel';
import StaffLayout from '@/Layouts/StaffLayout';
import { Link } from '@inertiajs/react';

/**
 * Desk shortcuts. Anything not wired to a feature yet renders as a dashed,
 * disabled tile so the gap in the build is visible rather than a dead click.
 */
const quickActions: {
    label: string;
    icon: IconName;
    href?: string;
}[] = [
    { label: 'Book an appointment', icon: 'calendar' },
    { label: 'Register an owner', icon: 'paw', href: route('owners.create') },
    { label: 'Record a payment', icon: 'sparkles' },
    { label: 'Log a complaint', icon: 'shield' },
];

export default function FrontDeskDashboard() {
    return (
        <StaffLayout
            title="Front Desk"
            heading="Front desk"
            description="Today's bookings, the unpaid queue, and the client records the desk works from."
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
                        title="Today's appointments"
                        icon="calendar"
                        action={<SoonChip />}
                    >
                        <SoonState message="Bookings for today will be listed here once scheduling is live. Nothing is on the calendar yet." />
                    </Panel>

                    <Panel
                        title="Unpaid invoices"
                        icon="sparkles"
                        action={<SoonChip />}
                    >
                        <SoonState message="The unpaid queue will appear here once payments are being recorded at the desk." />
                    </Panel>

                    <Panel
                        title="Clients &amp; pets"
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
                        <SoonState message="Recent client and pet activity will be summarised here. In the meantime, the desk records are all under Dog owners." />
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
