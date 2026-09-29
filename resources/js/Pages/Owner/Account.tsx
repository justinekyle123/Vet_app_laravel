import Field from '@/Components/Field';
import Icon from '@/Components/Icon';
import Panel, { EmptyState } from '@/Components/Panel';
import Spinner from '@/Components/Spinner';
import StatusPill from '@/Components/StatusPill';
import {
    primaryButtonClass,
    rowButtonClass,
} from '@/Components/buttonStyles';
import OwnerLayout from '@/Layouts/OwnerLayout';
import { Transition } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import DogFormModal, { BreedOption, DogRecord } from './Partials/DogFormModal';

interface OwnerAccount {
    id: number;
    first_name: string;
    last_name: string;
    email: string | null;
    phone_number: string | null;
    address: string | null;
}

/**
 * The client's own record: the contact details the clinic calls on, plus the
 * dogs registered under the account. One write covers both, because the login
 * account *is* the client record.
 */
export default function Account({
    owner,
    dogs,
    breeds,
}: {
    owner: OwnerAccount;
    dogs: DogRecord[];
    breeds: BreedOption[];
}) {
    const [selectedDog, setSelectedDog] = useState<DogRecord | null>(null);
    const [dogModalOpen, setDogModalOpen] = useState(false);

    const openAddDog = () => {
        setSelectedDog(null);
        setDogModalOpen(true);
    };

    const openEditDog = (dog: DogRecord) => {
        setSelectedDog(dog);
        setDogModalOpen(true);
    };

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            first_name: owner.first_name ?? '',
            last_name: owner.last_name ?? '',
            email: owner.email ?? '',
            phone_number: owner.phone_number ?? '',
            address: owner.address ?? '',
        });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        patch(route('owner.account.update'), { preserveScroll: true });
    };

    return (
        <OwnerLayout
            title="My account"
            heading="My account"
            description="Keep your contact details current and review the dogs registered under your account."
        >
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
                <Panel title="Contact details" icon="user">
                    <form onSubmit={submit} className="space-y-5">
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <Field
                                label="First name"
                                name="first_name"
                                value={data.first_name}
                                onChange={(event) =>
                                    setData('first_name', event.target.value)
                                }
                                error={errors.first_name}
                                autoComplete="given-name"
                                required
                            />

                            <Field
                                label="Last name"
                                name="last_name"
                                value={data.last_name}
                                onChange={(event) =>
                                    setData('last_name', event.target.value)
                                }
                                error={errors.last_name}
                                autoComplete="family-name"
                                required
                            />

                            <div className="sm:col-span-2">
                                <Field
                                    label="Email"
                                    name="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(event) =>
                                        setData('email', event.target.value)
                                    }
                                    error={errors.email}
                                    hint="Used to sign in and to send appointment reminders."
                                    autoComplete="email"
                                    required
                                />
                            </div>

                            <Field
                                label="Phone number"
                                name="phone_number"
                                type="tel"
                                value={data.phone_number}
                                onChange={(event) =>
                                    setData(
                                        'phone_number',
                                        event.target.value,
                                    )
                                }
                                error={errors.phone_number}
                                autoComplete="tel"
                            />

                            <Field
                                label="Address"
                                name="address"
                                value={data.address}
                                onChange={(event) =>
                                    setData('address', event.target.value)
                                }
                                error={errors.address}
                                autoComplete="street-address"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-4 border-t border-[#1a3d1a]/10 pt-6">
                            <button
                                type="submit"
                                disabled={processing}
                                className={primaryButtonClass}
                            >
                                {processing ? (
                                    <Spinner className="h-4 w-4" />
                                ) : (
                                    <Icon
                                        name="check"
                                        className="h-4 w-4"
                                    />
                                )}
                                Save changes
                            </button>

                            <Transition
                                show={recentlySuccessful}
                                enter="transition ease-in-out"
                                enterFrom="opacity-0"
                                leave="transition ease-in-out"
                                leaveTo="opacity-0"
                            >
                                <p className="text-sm font-medium text-[#2a5a2a]">
                                    Saved.
                                </p>
                            </Transition>
                        </div>
                    </form>
                </Panel>

                <Panel
                    title="My dogs"
                    icon="paw"
                    action={
                        <button
                            type="button"
                            onClick={openAddDog}
                            className={rowButtonClass}
                        >
                            Add a dog
                        </button>
                    }
                >
                    {dogs.length === 0 ? (
                        <EmptyState message="No dogs are registered under your account yet. Add your first one to get started." />
                    ) : (
                        <ul className="divide-y divide-[#1a3d1a]/5">
                            {dogs.map((dog) => (
                                <li
                                    key={dog.id}
                                    className="flex items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-[#1a3d1a]">
                                            {dog.dog_name}
                                        </p>
                                        <p className="truncate text-xs text-[#1a3d1a]/55">
                                            {[dog.breed, dog.sex, dog.color]
                                                .filter(Boolean)
                                                .join(' · ') ||
                                                'Breed not set'}
                                        </p>
                                    </div>

                                    <div className="flex shrink-0 items-center gap-3">
                                        <StatusPill
                                            active={dog.is_active}
                                            activeLabel="Active"
                                            inactiveLabel="Inactive"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => openEditDog(dog)}
                                            className={rowButtonClass}
                                        >
                                            Edit
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}

                    <p className="mt-5 border-t border-[#1a3d1a]/5 pt-4 text-xs leading-relaxed text-[#1a3d1a]/50">
                        Need a dog removed, or records merged? Contact the front
                        desk and we will sort it out.
                    </p>
                </Panel>
            </div>

            <DogFormModal
                dog={selectedDog}
                breeds={breeds}
                show={dogModalOpen}
                onClose={() => setDogModalOpen(false)}
            />
        </OwnerLayout>
    );
}
