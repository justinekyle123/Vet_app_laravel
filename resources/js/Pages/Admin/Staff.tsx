import DashboardCard, { EmptyState } from '@/Components/DashboardCard';
import SecondaryButton from '@/Components/SecondaryButton';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import ResetStaffPasswordForm, {
    StaffMember,
} from './Partials/ResetStaffPasswordForm';

const roleLabels: Record<StaffMember['role'], string> = {
    admin: 'Administrator',
    front_desk: 'Front Desk',
};

const roleStyles: Record<StaffMember['role'], string> = {
    admin: 'bg-purple-50 text-purple-700',
    front_desk: 'bg-sky-50 text-sky-700',
};

export default function Staff({ staff }: { staff: StaffMember[] }) {
    const [selected, setSelected] = useState<StaffMember | null>(null);

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Staff Accounts
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Reset a staff member's password when they are locked
                        out or still on a default one.
                    </p>
                </div>
            }
        >
            <Head title="Staff Accounts" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    <DashboardCard title="Staff" icon="shield">
                        {staff.length === 0 ? (
                            <EmptyState message="No staff accounts exist yet." />
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {staff.map((member) => (
                                    <li
                                        key={member.id}
                                        className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-gray-900">
                                                {member.name}
                                            </p>
                                            <p className="truncate text-xs text-gray-500">
                                                {member.email}
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-3">
                                            <span
                                                className={`rounded-full px-2.5 py-1 text-xs font-medium ${roleStyles[member.role]}`}
                                            >
                                                {roleLabels[member.role]}
                                            </span>
                                            <SecondaryButton
                                                onClick={() =>
                                                    setSelected(member)
                                                }
                                            >
                                                Reset password
                                            </SecondaryButton>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </DashboardCard>
                </div>
            </div>

            <ResetStaffPasswordForm
                staff={selected}
                show={selected !== null}
                onClose={() => setSelected(null)}
            />
        </AuthenticatedLayout>
    );
}
