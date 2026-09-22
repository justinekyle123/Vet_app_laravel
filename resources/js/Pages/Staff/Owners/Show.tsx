import DashboardCard, { EmptyState } from '@/Components/DashboardCard';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

interface OwnerDetail {
    id: number;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    alternate_phone: string | null;
    address: string | null;
    city: string | null;
    postal_code: string | null;
    notes: string | null;
    is_active: boolean;
    created_at: string;
}

interface PetSummary {
    id: number;
    name: string;
    species: string;
    breed: string | null;
    sex: string | null;
    birth_date: string | null;
    is_active: boolean;
}

function Detail({ label, value }: { label: string; value: string | null }) {
    return (
        <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">
                {label}
            </dt>
            <dd className="mt-1 text-sm text-gray-800">
                {value && value !== '' ? value : '—'}
            </dd>
        </div>
    );
}

export default function Show({
    owner,
    pets,
}: {
    owner: OwnerDetail;
    pets: PetSummary[];
}) {
    const fullName = `${owner.first_name} ${owner.last_name}`;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <Link
                            href={route('owners.index')}
                            className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
                        >
                            ← Back to dog owners
                        </Link>
                        <h2 className="mt-1 flex items-center gap-3 text-xl font-semibold leading-tight text-gray-800">
                            {fullName}
                            <span
                                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                    owner.is_active
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'bg-gray-100 text-gray-500'
                                }`}
                            >
                                {owner.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href={route('owners.edit', owner.id)}
                            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                        >
                            Edit
                        </Link>
                        <Link
                            href={route(
                                owner.is_active
                                    ? 'owners.deactivate'
                                    : 'owners.activate',
                                owner.id,
                            )}
                            method="patch"
                            as="button"
                            className={`rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm transition ${
                                owner.is_active
                                    ? 'bg-red-600 hover:bg-red-500'
                                    : 'bg-emerald-600 hover:bg-emerald-500'
                            }`}
                        >
                            {owner.is_active ? 'Deactivate' : 'Reactivate'}
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={fullName} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <div className="lg:col-span-2">
                            <DashboardCard
                                title="Contact details"
                                icon="user"
                            >
                                <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                    <Detail label="Email" value={owner.email} />
                                    <Detail label="Phone" value={owner.phone} />
                                    <Detail
                                        label="Alternate phone"
                                        value={owner.alternate_phone}
                                    />
                                    <Detail
                                        label="City"
                                        value={owner.city}
                                    />
                                    <Detail
                                        label="Address"
                                        value={owner.address}
                                    />
                                    <Detail
                                        label="Postal code"
                                        value={owner.postal_code}
                                    />
                                </dl>

                                <div className="mt-6 border-t border-gray-100 pt-4">
                                    <Detail label="Notes" value={owner.notes} />
                                </div>
                            </DashboardCard>
                        </div>

                        <div>
                            <DashboardCard title="Pets" icon="paw">
                                {pets.length === 0 ? (
                                    <EmptyState message="No pets are registered under this owner yet." />
                                ) : (
                                    <ul className="divide-y divide-gray-100">
                                        {pets.map((pet) => (
                                            <li
                                                key={pet.id}
                                                className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
                                            >
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium text-gray-900">
                                                        {pet.name}
                                                    </p>
                                                    <p className="truncate text-xs text-gray-500">
                                                        {[
                                                            pet.species,
                                                            pet.breed,
                                                            pet.sex,
                                                        ]
                                                            .filter(Boolean)
                                                            .join(' · ')}
                                                    </p>
                                                </div>
                                                <span
                                                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                                                        pet.is_active
                                                            ? 'bg-emerald-50 text-emerald-700'
                                                            : 'bg-gray-100 text-gray-500'
                                                    }`}
                                                >
                                                    {pet.is_active
                                                        ? 'Active'
                                                        : 'Inactive'}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </DashboardCard>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
