import DashboardCard, { EmptyState } from '@/Components/DashboardCard';
import StatCard from '@/Components/StatCard';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { UserRole } from '@/types';
import { Head, Link } from '@inertiajs/react';

interface Stats {
    total_users: number;
    admins: number;
    front_desk: number;
    owners: number;
    unverified: number;
}

interface RecentUser {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    created_at: string;
}

const roleLabels: Record<UserRole, string> = {
    admin: 'Administrator',
    front_desk: 'Front Desk',
    owner: 'Dog Owner',
};

const roleStyles: Record<UserRole, string> = {
    admin: 'bg-purple-50 text-purple-700',
    front_desk: 'bg-sky-50 text-sky-700',
    owner: 'bg-emerald-50 text-emerald-700',
};

export default function AdminDashboard({
    stats,
    recentUsers,
}: {
    stats: Stats;
    recentUsers: RecentUser[];
}) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">
                            Administrator Dashboard
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Clinic-wide accounts and operations at a glance.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href={route('owners.index')}
                            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                        >
                            Dog owners
                        </Link>
                        <Link
                            href={route('admin.staff.index')}
                            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                        >
                            Manage staff
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Administrator Dashboard" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                        <StatCard
                            label="Total accounts"
                            value={stats.total_users}
                            icon="user"
                        />
                        <StatCard
                            label="Administrators"
                            value={stats.admins}
                            icon="shield"
                        />
                        <StatCard
                            label="Front desk"
                            value={stats.front_desk}
                            icon="calendar"
                        />
                        <StatCard
                            label="Dog owners"
                            value={stats.owners}
                            icon="paw"
                        />
                        <StatCard
                            label="Unverified emails"
                            value={stats.unverified}
                            icon="mail"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <div className="lg:col-span-2">
                            <DashboardCard
                                title="Recent sign-ups"
                                icon="user"
                                action={
                                    <span className="text-xs font-medium text-gray-500">
                                        Latest 5
                                    </span>
                                }
                            >
                                {recentUsers.length === 0 ? (
                                    <EmptyState message="No accounts have been created yet." />
                                ) : (
                                    <ul className="divide-y divide-gray-100">
                                        {recentUsers.map((user) => (
                                            <li
                                                key={user.id}
                                                className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                                            >
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium text-gray-900">
                                                        {user.name}
                                                    </p>
                                                    <p className="truncate text-xs text-gray-500">
                                                        {user.email}
                                                    </p>
                                                </div>
                                                <span
                                                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${roleStyles[user.role]}`}
                                                >
                                                    {roleLabels[user.role]}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </DashboardCard>
                        </div>

                        <div className="space-y-6">
                            <DashboardCard
                                title="Appointments today"
                                icon="calendar"
                            >
                                <EmptyState message="Scheduling data will appear here once the booking feature is live." />
                            </DashboardCard>
                            <DashboardCard
                                title="Revenue this month"
                                icon="sparkles"
                            >
                                <EmptyState message="Payment totals will appear here once invoicing is live." />
                            </DashboardCard>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
