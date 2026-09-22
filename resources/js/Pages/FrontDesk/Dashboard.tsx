import DashboardCard, { EmptyState } from '@/Components/DashboardCard';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

const quickActions = [
    { label: 'Book an appointment', icon: 'calendar' as const },
    { label: 'Register an owner & pet', icon: 'user' as const },
    { label: 'Record a payment', icon: 'sparkles' as const },
    { label: 'Log a complaint', icon: 'shield' as const },
];

export default function FrontDeskDashboard() {
    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Front Desk
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Today's bookings, the unpaid queue, and desk tasks.
                    </p>
                </div>
            }
        >
            <Head title="Front Desk Dashboard" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="flex flex-wrap gap-2 p-4">
                            {quickActions.map((action) => (
                                <button
                                    key={action.label}
                                    type="button"
                                    disabled
                                    className="cursor-not-allowed rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-400"
                                >
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <DashboardCard
                            title="Today's appointments"
                            icon="calendar"
                        >
                            <EmptyState message="No appointments are on the calendar yet. Bookings will show here once scheduling is live." />
                        </DashboardCard>
                        <DashboardCard
                            title="Unpaid invoices"
                            icon="sparkles"
                        >
                            <EmptyState message="The unpaid queue will appear here once payments are being recorded." />
                        </DashboardCard>
                        <DashboardCard
                            title="Owners & pets"
                            icon="paw"
                        >
                            <EmptyState message="Client records will show here once owner and pet management is live." />
                        </DashboardCard>
                        <DashboardCard
                            title="Open complaints"
                            icon="shield"
                        >
                            <EmptyState message="Complaints awaiting a response will appear here." />
                        </DashboardCard>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
