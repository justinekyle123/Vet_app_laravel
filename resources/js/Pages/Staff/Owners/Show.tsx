import {
    dangerButtonClass,
    secondaryButtonClass,
} from '@/Components/buttonStyles';
import Icon from '@/Components/Icon';
import Panel, { EmptyState } from '@/Components/Panel';
import StatusPill from '@/Components/StatusPill';
import StaffLayout from '@/Layouts/StaffLayout';
import { longDate } from '@/utils/format';
import { Link } from '@inertiajs/react';

interface OwnerDetail {
    id: number;
    first_name: string;
    last_name: string;
    email: string | null;
    phone_number: string | null;
    address: string | null;
    is_active: boolean;
    created_at: string;
}

interface DogSummary {
    id: number;
    dog_name: string;
    breed: string | null;
    sex: string | null;
    birth_date: string | null;
    is_vaccinated: boolean;
    is_active: boolean;
}

function Detail({ label, value }: { label: string; value: string | null }) {
    return (
        <div className="min-w-0">
            <dt className="text-[0.66rem] font-semibold uppercase tracking-[0.12em] text-[#1a3d1a]/45">
                {label}
            </dt>
            <dd className="mt-1 break-words text-sm text-[#1a3d1a]">
                {value && value !== '' ? value : '—'}
            </dd>
        </div>
    );
}

export default function Show({
    owner,
    dogs,
}: {
    owner: OwnerDetail;
    dogs: DogSummary[];
}) {
    const fullName = `${owner.first_name} ${owner.last_name}`;

    return (
        <StaffLayout
            title={fullName}
            heading={fullName}
            description="Client record, contact details, and the dogs registered under this owner."
            actions={
                <>
                    <StatusPill active={owner.is_active} />
                    <Link
                        href={route('owners.edit', owner.id)}
                        className={secondaryButtonClass}
                    >
                        <Icon name="user" className="h-4 w-4" />
                        Edit details
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
                        className={
                            owner.is_active
                                ? dangerButtonClass
                                : secondaryButtonClass
                        }
                    >
                        {owner.is_active ? 'Deactivate' : 'Reactivate'}
                    </Link>
                </>
            }
        >
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <Panel
                        title="Contact details"
                        icon="user"
                        fill
                        action={
                            <span className="text-xs font-medium text-[#1a3d1a]/45">
                                Client since {longDate(owner.created_at)}
                            </span>
                        }
                    >
                        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <Detail label="Email" value={owner.email} />
                            <Detail label="Phone" value={owner.phone_number} />
                            <Detail label="Address" value={owner.address} />
                        </dl>
                    </Panel>
                </div>

                <Panel
                    title="Dogs"
                    icon="paw"
                    fill
                    action={
                        <span className="text-xs font-medium text-[#1a3d1a]/45">
                            {dogs.length} {dogs.length === 1 ? 'dog' : 'dogs'}
                        </span>
                    }
                >
                    {dogs.length === 0 ? (
                        <EmptyState
                            icon="paw"
                            message="No dogs are registered under this owner yet."
                        />
                    ) : (
                        <ul className="divide-y divide-[#1a3d1a]/10">
                            {dogs.map((dog) => (
                                <li
                                    key={dog.id}
                                    className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-[#1a3d1a]">
                                            {dog.dog_name}
                                        </p>
                                        <p className="truncate text-xs text-[#1a3d1a]/55">
                                            {[dog.breed, dog.sex]
                                                .filter(Boolean)
                                                .join(' · ')}
                                        </p>
                                        {dog.birth_date && (
                                            <p className="mt-0.5 text-[0.68rem] text-[#1a3d1a]/45">
                                                Born {longDate(dog.birth_date)}
                                            </p>
                                        )}
                                    </div>
                                    <StatusPill
                                        active={dog.is_active}
                                        activeLabel="Active"
                                    />
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>
            </div>
        </StaffLayout>
    );
}
