import { primaryButtonClass, rowButtonClass } from '@/Components/buttonStyles';
import Icon from '@/Components/Icon';
import Panel, { EmptyState } from '@/Components/Panel';
import StatusPill from '@/Components/StatusPill';
import StaffLayout from '@/Layouts/StaffLayout';
import { currency } from '@/utils/format';
import { Link } from '@inertiajs/react';
import { useState } from 'react';
import ServiceForm, { ServiceRecord } from './Partials/ServiceForm';

const filters = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Offered' },
    { value: 'retired', label: 'Retired' },
] as const;

type Filter = (typeof filters)[number]['value'];

export default function Services({ services }: { services: ServiceRecord[] }) {
    const [filter, setFilter] = useState<Filter>('all');
    const [editing, setEditing] = useState<ServiceRecord | null>(null);
    const [modalOpen, setModalOpen] = useState(false);

    const visible = services.filter((service) => {
        if (filter === 'active') {
            return service.is_active;
        }

        if (filter === 'retired') {
            return !service.is_active;
        }

        return true;
    });

    const offered = services.filter((service) => service.is_active).length;

    const openForm = (service: ServiceRecord | null) => {
        setEditing(service);
        setModalOpen(true);
    };

    return (
        <StaffLayout
            title="Services"
            heading="Services"
            description="The clinic's service menu — what the desk can book, how long each visit takes, and what it costs."
            actions={
                <button
                    type="button"
                    onClick={() => openForm(null)}
                    className={primaryButtonClass}
                >
                    <Icon name="plus" className="h-4 w-4" />
                    Add service
                </button>
            }
        >
            <Panel
                title="Service menu"
                icon="scissors"
                flush
                action={
                    <span className="text-xs font-medium text-[#1a3d1a]/45">
                        {offered} of {services.length} offered
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
                                onClick={() => setFilter(tab.value)}
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

                {visible.length === 0 ? (
                    <div className="p-5">
                        <EmptyState
                            icon="scissors"
                            message={
                                services.length === 0
                                    ? 'No services on the menu yet. Add a consultation, vaccination, or grooming service to get started.'
                                    : 'No services in this view. Switch the filter to see the rest of the menu.'
                            }
                        />
                    </div>
                ) : (
                    <ul className="divide-y divide-[#1a3d1a]/10">
                        {visible.map((service) => (
                            <li
                                key={service.id}
                                className="flex flex-col gap-3 px-5 py-4 transition-colors duration-150 hover:bg-[#EFFDF0]/60 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2.5">
                                        <p className="text-sm font-semibold text-[#1a3d1a]">
                                            {service.name}
                                        </p>
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
                                    <button
                                        type="button"
                                        onClick={() => openForm(service)}
                                        className={rowButtonClass}
                                    >
                                        <Icon
                                            name="pencil"
                                            className="h-3.5 w-3.5"
                                        />
                                        Edit
                                    </button>

                                    <Link
                                        href={route(
                                            'admin.services.toggle',
                                            service.id,
                                        )}
                                        method="patch"
                                        as="button"
                                        preserveScroll
                                        className={rowButtonClass}
                                    >
                                        {service.is_active
                                            ? 'Retire'
                                            : 'Restore'}
                                    </Link>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </Panel>

            <ServiceForm
                service={editing}
                show={modalOpen}
                onClose={() => setModalOpen(false)}
            />
        </StaffLayout>
    );
}
