import DashboardCard, { EmptyState } from '@/Components/DashboardCard';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';

export default function OwnerDashboard() {
    const user = usePage().props.auth.user;

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Welcome, {user.name}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Your pets, appointments, and payments in one place.
                    </p>
                </div>
            }
        >
            <Head title="My Pet Portal" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <DashboardCard
                            title="My pets"
                            icon="paw"
                            action={
                                <Link
                                    href={route('owner.account.edit')}
                                    className="text-xs font-medium text-emerald-700 hover:text-emerald-800"
                                >
                                    My account
                                </Link>
                            }
                        >
                            <EmptyState message="You have not added any pets yet." />
                            <button
                                type="button"
                                disabled
                                className="mt-4 cursor-not-allowed self-start rounded-md bg-emerald-600/60 px-4 py-2 text-sm font-semibold text-white"
                            >
                                Add a pet
                            </button>
                        </DashboardCard>
                        <DashboardCard
                            title="Upcoming appointments"
                            icon="calendar"
                        >
                            <EmptyState message="No appointments booked. Online booking is on the way." />
                        </DashboardCard>
                        <DashboardCard
                            title="Invoices & payments"
                            icon="sparkles"
                        >
                            <EmptyState message="Your invoices and payment status will show here." />
                        </DashboardCard>
                        <DashboardCard title="Feedback & complaints" icon="star">
                            <EmptyState message="Rate a completed visit or raise a complaint once appointments are live." />
                        </DashboardCard>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
