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
    pets,
}: {
    owner: OwnerDetail;
    pets: PetSummary[];
}) {
    const fullName = `${owner.first_name} ${owner.last_name}`;

    return (
        <StaffLayout
            title={fullName}
            heading={fullName}
            description="Client record, contact details, and the pets registered under this owner."
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
                            <Detail label="Phone" value={owner.phone} />
                            <Detail
                                label="Alternate phone"
                                value={owner.alternate_phone}
                            />
                            <Detail label="City" value={owner.city} />
                            <Detail label="Address" value={owner.address} />
                            <Detail
                                label="Postal code"
                                value={owner.postal_code}
                            />
                        </dl>

                        <div className="mt-6 border-t border-[#1a3d1a]/10 pt-5">
                            <Detail label="Notes" value={owner.notes} />
                        </div>
                    </Panel>
                </div>

                <Panel
                    title="Pets"
                    icon="paw"
                    fill
                    action={
                        <span className="text-xs font-medium text-[#1a3d1a]/45">
                            {pets.length} {pets.length === 1 ? 'pet' : 'pets'}
                        </span>
                    }
                >
                    {pets.length === 0 ? (
                        <EmptyState
                            icon="paw"
                            message="No pets are registered under this owner yet."
                        />
                    ) : (
                        <ul className="divide-y divide-[#1a3d1a]/10">
                            {pets.map((pet) => (
                                <li
                                    key={pet.id}
                                    className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-[#1a3d1a]">
                                            {pet.name}
                                        </p>
                                        <p className="truncate text-xs text-[#1a3d1a]/55">
                                            {[
                                                pet.species,
                                                pet.breed,
                                                pet.sex,
                                            ]
                                                .filter(Boolean)
                                                .join(' · ')}
                                        </p>
                                        {pet.birth_date && (
                                            <p className="mt-0.5 text-[0.68rem] text-[#1a3d1a]/45">
                                                Born {longDate(pet.birth_date)}
                                            </p>
                                        )}
                                    </div>
                                    <StatusPill
                                        active={pet.is_active}
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
