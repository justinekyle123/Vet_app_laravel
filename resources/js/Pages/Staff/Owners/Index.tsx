import DashboardCard, { EmptyState } from '@/Components/DashboardCard';
import TextInput from '@/Components/TextInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Paginated } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import { OwnerRecord } from './Partials/OwnerForm';

interface OwnerRow extends OwnerRecord {
    pets_count: number;
}

const statusTabs = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'all', label: 'All' },
];

export default function Index({
    owners,
    filters,
}: {
    owners: Paginated<OwnerRow>;
    filters: { search: string; status: string };
}) {
    const [search, setSearch] = useState(filters.search);

    const applyFilters = (overrides: Partial<typeof filters> = {}) => {
        router.get(
            route('owners.index'),
            { search, status: filters.status, ...overrides },
            { preserveState: true, replace: true },
        );
    };

    const submitSearch: FormEventHandler = (e) => {
        e.preventDefault();
        applyFilters();
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">
                            Dog Owners
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Client records for the clinic's dog owners and their
                            pets.
                        </p>
                    </div>
                    <Link
                        href={route('owners.create')}
                        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500"
                    >
                        Add owner
                    </Link>
                </div>
            }
        >
            <Head title="Dog Owners" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    <DashboardCard title="Client list" icon="user">
                        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                            <form
                                onSubmit={submitSearch}
                                className="flex items-center gap-2"
                            >
                                <TextInput
                                    value={search}
                                    onChange={(e) =>
                                        setSearch(e.target.value)
                                    }
                                    placeholder="Search name, email, phone…"
                                    className="w-64"
                                />
                                <button
                                    type="submit"
                                    className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                                >
                                    Search
                                </button>
                            </form>

                            <div className="flex items-center gap-1 rounded-md bg-gray-100 p-1">
                                {statusTabs.map((tab) => (
                                    <button
                                        key={tab.value}
                                        type="button"
                                        onClick={() =>
                                            applyFilters({
                                                status: tab.value,
                                            })
                                        }
                                        className={`rounded px-3 py-1 text-sm font-medium transition ${
                                            filters.status === tab.value
                                                ? 'bg-white text-gray-900 shadow-sm'
                                                : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {owners.data.length === 0 ? (
                            <EmptyState message="No dog owners match these filters." />
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead>
                                        <tr>
                                            <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                                                Name
                                            </th>
                                            <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                                                Contact
                                            </th>
                                            <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                                                City
                                            </th>
                                            <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                                                Pets
                                            </th>
                                            <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                                                Status
                                            </th>
                                            <th className="px-3 py-3" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {owners.data.map((owner) => (
                                            <tr key={owner.id}>
                                                <td className="whitespace-nowrap px-3 py-3 text-sm font-medium text-gray-900">
                                                    <Link
                                                        href={route(
                                                            'owners.show',
                                                            owner.id,
                                                        )}
                                                        className="hover:text-emerald-700"
                                                    >
                                                        {owner.first_name}{' '}
                                                        {owner.last_name}
                                                    </Link>
                                                </td>
                                                <td className="px-3 py-3 text-sm text-gray-600">
                                                    <div>
                                                        {owner.email ?? '—'}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {owner.phone ?? ''}
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-600">
                                                    {owner.city ?? '—'}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-600">
                                                    {owner.pets_count}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-3">
                                                    <span
                                                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                                            owner.is_active
                                                                ? 'bg-emerald-50 text-emerald-700'
                                                                : 'bg-gray-100 text-gray-500'
                                                        }`}
                                                    >
                                                        {owner.is_active
                                                            ? 'Active'
                                                            : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-3 text-right text-sm">
                                                    <Link
                                                        href={route(
                                                            'owners.edit',
                                                            owner.id,
                                                        )}
                                                        className="font-medium text-emerald-700 hover:text-emerald-800"
                                                    >
                                                        Edit
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {owners.links.length > 3 && (
                            <div className="mt-5 flex flex-wrap items-center gap-1">
                                {owners.links.map((link, index) =>
                                    link.url ? (
                                        <Link
                                            key={index}
                                            href={link.url}
                                            preserveScroll
                                            className={`rounded-md px-3 py-1.5 text-sm ${
                                                link.active
                                                    ? 'bg-emerald-600 text-white'
                                                    : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                            }`}
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    ) : (
                                        <span
                                            key={index}
                                            className="rounded-md px-3 py-1.5 text-sm text-gray-400"
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    ),
                                )}
                            </div>
                        )}
                    </DashboardCard>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
