import DashboardCard from '@/Components/DashboardCard';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import OwnerForm, { OwnerRecord } from './Partials/OwnerForm';

export default function Edit({ owner }: { owner: OwnerRecord }) {
    return (
        <AuthenticatedLayout
            header={
                <div>
                    <Link
                        href={route('owners.show', owner.id)}
                        className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
                    >
                        ← Back to owner
                    </Link>
                    <h2 className="mt-1 text-xl font-semibold leading-tight text-gray-800">
                        Edit {owner.first_name} {owner.last_name}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Update this client's contact details and status.
                    </p>
                </div>
            }
        >
            <Head title={`Edit ${owner.first_name} ${owner.last_name}`} />

            <div className="py-12">
                <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
                    <DashboardCard title="Owner details" icon="user">
                        <OwnerForm owner={owner} />
                    </DashboardCard>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
