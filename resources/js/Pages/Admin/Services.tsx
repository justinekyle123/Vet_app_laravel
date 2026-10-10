import { rowButtonClass } from '@/Components/buttonStyles';
import Icon from '@/Components/Icon';
import Pagination from '@/Components/Pagination';
import Panel, { EmptyState } from '@/Components/Panel';
import StatusPill from '@/Components/StatusPill';
import StaffLayout from '@/Layouts/StaffLayout';
import { Paginated } from '@/types';
import { currency } from '@/utils/format';
import { Link, router } from '@inertiajs/react';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import { ServiceCategoryOption, ServiceRecord } from './Partials/ServiceForm';

const filters = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Offered' },
    { value: 'retired', label: 'Retired' },
] as const;

type Filter = (typeof filters)[number]['value'];

export default function Services({
    services,
    categories,
    filter,
    counts,
}: {
    services: Paginated<ServiceRecord>;
    categories: ServiceCategoryOption[];
    filter: Filter;
    counts: { offered: number; total: number };
}) {
    const applyFilter = (value: Filter) => {
        router.get(
            route('admin.services.index'),
            value === 'all' ? {} : { filter: value },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    /*
     * Retiring a service changes what clients can book, so it goes through a
     * themed SweetAlert rather than firing the moment the button is pressed.
     */
    const confirmToggle = (service: ServiceRecord) => {
        const retiring = service.is_active;

        Swal.fire({
            title: retiring
                ? `Retire ${service.service_name}?`
                : `Restore ${service.service_name}?`,
            text: retiring
                ? 'It will be hidden from booking. Past appointments and invoices keep their record.'
                : 'It will reappear on the booking menu.',
            icon: retiring ? 'warning' : 'question',
            showCancelButton: true,
            confirmButtonText: retiring ? 'Retire' : 'Restore',
            cancelButtonText: 'Cancel',
            confirmButtonColor: retiring ? '#b3261e' : '#1a3d1a',
            cancelButtonColor: '#1a3d1a',
            reverseButtons: true,
            focusCancel: true,
        }).then((result) => {
            if (result.isConfirmed) {
                router.patch(
                    route('admin.services.toggle', service.id),
                    {},
                    { preserveScroll: true },
                );
            }
        });
    };

    return (
        <StaffLayout
            title="Services"
            heading="Services"
            description="The clinic's service menu — what the desk can book, how long each visit takes, and what it costs."
            actions={
                <Link
                    href={route('admin.services.create')}
                    className="inline-flex items-center gap-2 rounded-full bg-[#1a3d1a] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2a5a2a]"
                >
                    <Icon name="plus" className="h-4 w-4" />
                    Add service
                </Link>
            }
        >
            <Panel
                title="Service menu"
                icon="scissors"
                flush
                action={
                    <span className="text-xs font-medium text-[#1a3d1a]/45">
                        {counts.offered} of {counts.total} offered
                    </span>
                }
            >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1a3d1a]/10 px-5 py-4">
                    <p className="text-sm text-[#1a3d1a]/60">
                        Retiring a service hides it from booking without
                        touching past invoices.
                    </p>

                    <div
                        role="group"
                        aria-label="Filter services"
                        className="flex items-center gap-1 rounded-full bg-[#1a3d1a]/5 p-1"
                    >
                        {filters.map((tab) => (
                            <button
                                key={tab.value}
                                type="button"
                                aria-pressed={filter === tab.value}
                                onClick={() => applyFilter(tab.value)}
                                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a] ${
                                    filter === tab.value
                                        ? 'bg-white text-[#1a3d1a] shadow-sm'
                                        : 'text-[#1a3d1a]/55 hover:text-[#1a3d1a]'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {services.data.length === 0 ? (
                    <div className="p-5">
                        <EmptyState
                            icon="scissors"
                            message={
                                counts.total === 0
                                    ? 'No services on the menu yet. Add a consultation, vaccination, or grooming service to get started.'
                                    : 'No services in this view. Switch the filter to see the rest of the menu.'
                            }
                        />
                    </div>
                ) : (
                    <ul className="divide-y divide-[#1a3d1a]/10">
                        {services.data.map((service) => (
                            <li
                                key={service.id}
                                className="flex flex-col gap-3 px-5 py-4 transition-colors duration-150 hover:bg-[#EFFDF0]/60 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2.5">
                                        <p className="text-sm font-semibold text-[#1a3d1a]">
                                            {service.service_name}
                                        </p>
                                        {service.category_name && (
                                            <span className="rounded-full bg-[#EFFDF0] px-2.5 py-1 text-[0.68rem] font-semibold text-[#2a5a2a] ring-1 ring-[#1a3d1a]/10">
                                                {service.category_name}
                                            </span>
                                        )}
                                        {!service.is_active && (
                                            <StatusPill
                                                active={false}
                                                inactiveLabel="Retired"
                                            />
                                        )}
                                    </div>

                                    {service.description && (
                                        <p className="mt-1 text-xs leading-relaxed text-[#1a3d1a]/55">
                                            {service.description}
                                        </p>
                                    )}

                                    <p className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#1a3d1a]/60">
                                        <span className="inline-flex items-center gap-1.5">
                                            <Icon
                                                name="clock"
                                                className="h-3.5 w-3.5 text-[#1a3d1a]/40"
                                            />
                                            {service.duration_minutes} min
                                        </span>
                                        <span className="font-semibold text-[#1a3d1a]">
                                            {currency(service.price)}
                                        </span>
                                    </p>
                                </div>

                                <div className="flex shrink-0 items-center gap-2">
                                    <Link
                                        href={route(
                                            'admin.services.edit',
                                            service.id,
                                        )}
                                        className={rowButtonClass}
                                    >
                                        <Icon
                                            name="pencil"
                                            className="h-3.5 w-3.5"
                                        />
                                        Edit
                                    </Link>

                                    <button
                                        type="button"
                                        onClick={() => confirmToggle(service)}
                                        className={rowButtonClass}
                                    >
                                        <Icon
                                            name="check"
                                            className="h-3.5 w-3.5"
                                        />
                                        {service.is_active
                                            ? 'Retire'
                                            : 'Restore'}
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                <Pagination page={services} />
            </Panel>
        </StaffLayout>
    );
}
