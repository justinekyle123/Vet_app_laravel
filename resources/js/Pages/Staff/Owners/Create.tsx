import DashboardCard from '@/Components/DashboardCard';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import OwnerForm from './Partials/OwnerForm';

export default function Create() {
    return (
        <AuthenticatedLayout
            header={
                <div>
                    <Link
                        href={route('owners.index')}
                        className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
                    >
                        ← Back to dog owners
                    </Link>
                    <h2 className="mt-1 text-xl font-semibold leading-tight text-gray-800">
                        New Dog Owner
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Record a walk-in client. They can link a login account
                        later by registering with the same email.
                    </p>
                </div>
            }
        >
            <Head title="New Dog Owner" />

            <div className="py-12">
                <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
                    <DashboardCard title="Owner details" icon="user">
                        <OwnerForm />
                    </DashboardCard>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
