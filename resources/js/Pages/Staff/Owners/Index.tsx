import { primaryButtonClass, rowButtonClass } from '@/Components/buttonStyles';
import Icon from '@/Components/Icon';
import Pagination from '@/Components/Pagination';
import Panel, { EmptyState } from '@/Components/Panel';
import StatusPill from '@/Components/StatusPill';
import StaffLayout from '@/Layouts/StaffLayout';
import { Paginated } from '@/types';
import { initials } from '@/utils/format';
import { Link, router } from '@inertiajs/react';
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

const headerCellClass =
    'px-5 py-3 text-left text-[0.66rem] font-semibold uppercase tracking-[0.12em] text-[#1a3d1a]/45';

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
        <StaffLayout
            title="Dog Owners"
            heading="Dog owners"
            description="Client records for the clinic's dog owners and their pets. Deactivated clients keep their history but leave the default list."
            actions={
                <Link
                    href={route('owners.create')}
                    className={primaryButtonClass}
                >
                    <Icon name="plus" className="h-4 w-4" />
                    Add owner
                </Link>
            }
        >
            <Panel
                title="Client list"
                icon="paw"
                flush
                action={
                    <span className="text-xs font-medium text-[#1a3d1a]/45">
                        {owners.total}{' '}
                        {owners.total === 1 ? 'record' : 'records'}
                    </span>
                }
            >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1a3d1a]/10 px-5 py-4">
                    <form
                        onSubmit={submitSearch}
                        className="relative flex items-center gap-2"
                    >
                        <Icon
                            name="search"
                            className="pointer-events-none absolute left-3.5 h-4 w-4 text-[#1a3d1a]/35"
                        />
                        <label htmlFor="owner-search" className="sr-only">
                            Search dog owners
                        </label>
                        <input
                            id="owner-search"
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search name, email, phone…"
                            className="w-full rounded-full border border-[#1a3d1a]/15 bg-white py-2.5 pl-10 pr-4 text-sm text-[#1a3d1a] shadow-sm transition-[border-color,box-shadow] duration-200 placeholder:text-[#1a3d1a]/35 focus:border-[#1a3d1a] focus:outline-none focus:ring-4 focus:ring-[#1a3d1a]/15 sm:w-72"
                        />
                    </form>

                    <div
                        role="group"
                        aria-label="Filter by status"
                        className="flex items-center gap-1 rounded-full bg-[#1a3d1a]/5 p-1"
                    >
                        {statusTabs.map((tab) => (
                            <button
                                key={tab.value}
                                type="button"
                                aria-pressed={filters.status === tab.value}
                                onClick={() =>
                                    applyFilters({ status: tab.value })
                                }
                                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a] ${
                                    filters.status === tab.value
                                        ? 'bg-white text-[#1a3d1a] shadow-sm'
                                        : 'text-[#1a3d1a]/55 hover:text-[#1a3d1a]'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {owners.data.length === 0 ? (
                    <div className="p-5">
                        <EmptyState
                            icon="user"
                            message={
                                filters.search !== ''
                                    ? 'No dog owners match this search. Try a different name, email, phone, or city.'
                                    : 'No dog owners in this view yet. Register a walk-in client to get started.'
                            }
                        />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-[#1a3d1a]/10">
                            <thead className="bg-[#EFFDF0]/50">
                                <tr>
                                    <th scope="col" className={headerCellClass}>
                                        Owner
                                    </th>
                                    <th scope="col" className={headerCellClass}>
                                        Phone
                                    </th>
                                    <th scope="col" className={headerCellClass}>
                                        City
                                    </th>
                                    <th scope="col" className={headerCellClass}>
                                        Pets
                                    </th>
                                    <th scope="col" className={headerCellClass}>
                                        Status
                                    </th>
                                    <th scope="col" className="px-5 py-3">
                                        <span className="sr-only">
                                            Actions
                                        </span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#1a3d1a]/10">
                                {owners.data.map((owner) => (
                                    <tr
                                        key={owner.id}
                                        className="transition-colors duration-150 hover:bg-[#EFFDF0]/60"
                                    >
                                        <td className="px-5 py-3.5">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EFFDF0] text-xs font-semibold text-[#1a3d1a] ring-1 ring-[#1a3d1a]/10">
                                                    {initials(
                                                        `${owner.first_name} ${owner.last_name}`,
                                                    )}
                                                </span>
                                                <div className="min-w-0">
                                                    <Link
                                                        href={route(
                                                            'owners.show',
                                                            owner.id,
                                                        )}
                                                        className="block truncate text-sm font-semibold text-[#1a3d1a] transition-colors duration-150 hover:text-[#E86A10]"
                                                    >
                                                        {owner.first_name}{' '}
                                                        {owner.last_name}
                                                    </Link>
                                                    <span className="block truncate text-xs text-[#1a3d1a]/55">
                                                        {owner.email ?? '—'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3.5 text-sm text-[#1a3d1a]/70">
                                            {owner.phone ?? '—'}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3.5 text-sm text-[#1a3d1a]/70">
                                            {owner.city ?? '—'}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3.5">
                                            <span className="inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-full bg-[#EFFDF0] px-2 text-xs font-semibold text-[#1a3d1a] ring-1 ring-[#1a3d1a]/10">
                                                {owner.pets_count}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3.5">
                                            <StatusPill
                                                active={owner.is_active}
                                            />
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3.5 text-right">
                                            <Link
                                                href={route(
                                                    'owners.edit',
                                                    owner.id,
                                                )}
                                                className={rowButtonClass}
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

                <Pagination page={owners} />
            </Panel>
        </StaffLayout>
    );
}
