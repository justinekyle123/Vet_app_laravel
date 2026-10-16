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
import { router, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import DogFormModal, { BreedOption, DogRecord } from './Partials/DogFormModal';

interface OwnerAccount {
    id: number;
    first_name: string;
    last_name: string;
    email: string | null;
    phone_number: string | null;
    address: string | null;
    profile_photo_url: string | null;
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
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    const openAddDog = () => {
        setSelectedDog(null);
        setDogModalOpen(true);
    };

    const openEditDog = (dog: DogRecord) => {
        setSelectedDog(dog);
        setDogModalOpen(true);
    };

    const toggleDogStatus = (dog: DogRecord) => {
        const action = dog.is_active ? 'deactivate' : 'reactivate';
        const message = dog.is_active
            ? `Deactivate ${dog.dog_name}? Their history will be kept, but they cannot be booked for new visits.`
            : `Reactivate ${dog.dog_name} for future bookings?`;

        if (!window.confirm(message)) {
            return;
        }

        router.patch(
            route(`owner.dogs.${dog.is_active ? 'deactivate' : 'activate'}`, dog.id),
            {},
            { preserveScroll: true },
        );
    };

    const { data, setData, post, errors, processing, recentlySuccessful } =
        useForm({
            first_name: owner.first_name ?? '',
            last_name: owner.last_name ?? '',
            email: owner.email ?? '',
            phone_number: owner.phone_number ?? '',
            address: owner.address ?? '',
            profile_photo: null as File | null,
            _method: 'patch',
        });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        post(route('owner.account.update'), {
            preserveScroll: true,
            forceFormData: true,
        });
    };

    const handlePhotoChange = (file: File | null) => {
        if (photoPreview) {
            URL.revokeObjectURL(photoPreview);
        }

        if (!file) {
            setPhotoPreview(null);
            setData('profile_photo', null);

            return;
        }

        setPhotoPreview(URL.createObjectURL(file));
        setData('profile_photo', file);
    };

    const avatarUrl = photoPreview ?? owner.profile_photo_url;
    const displayName = `${data.first_name} ${data.last_name}`.trim();

    return (
        <OwnerLayout
            title="My account"
            heading="My account"
            description="Keep your contact details current and review the dogs registered under your account."
        >
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
                <Panel title="Contact details" icon="user">
                    <form onSubmit={submit} className="space-y-6">
                        {/* Identity / avatar */}
                        <div className="flex items-center gap-5 rounded-2xl border border-[#1a3d1a]/10 bg-[#EFFDF0]/60 p-5">
                            <div className="relative shrink-0">
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt="Profile"
                                        className="h-20 w-20 rounded-full object-cover shadow-sm ring-4 ring-white"
                                    />
                                ) : (
                                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm ring-4 ring-white">
                                        <Icon
                                            name="user"
                                            className="h-8 w-8 text-[#1a3d1a]/30"
                                        />
                                    </div>
                                )}

                                <label
                                    htmlFor="profile_photo"
                                    className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#1a3d1a] text-white shadow-md ring-4 ring-[#EFFDF0] transition hover:bg-[#2a5a2a] focus-within:ring-2 focus-within:ring-[#1a3d1a]"
                                    title="Change profile photo"
                                >
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                    >
                                        <path d="M3 9a2 2 0 0 1 2-2h.93a2 2 0 0 0 1.66-.9l.82-1.2A2 2 0 0 1 10.07 4h3.86a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
                                        <circle cx="12" cy="13" r="3" />
                                    </svg>
                                    <span className="sr-only">
                                        Change profile photo
                                    </span>
                                </label>

                                <input
                                    id="profile_photo"
                                    type="file"
                                    accept="image/*"
                                    className="sr-only"
                                    onChange={(event) =>
                                        handlePhotoChange(
                                            event.target.files?.[0] ?? null,
                                        )
                                    }
                                />
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="truncate text-base font-semibold text-[#1a3d1a]">
                                    {displayName || 'Your name'}
                                </p>
                                <p className="mt-0.5 truncate text-sm text-[#1a3d1a]/60">
                                    {data.email || 'Add your email address'}
                                </p>
                                <p className="mt-2 truncate text-xs text-[#1a3d1a]/45">
                                    {data.profile_photo
                                        ? data.profile_photo.name
                                        : 'JPG, PNG or GIF · Max size 2MB'}
                                </p>
                            </div>
                        </div>

                        {errors.profile_photo && (
                            <p className="-mt-3 text-sm text-red-600">
                                {errors.profile_photo}
                            </p>
                        )}

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
                                    <Icon name="check" className="h-4 w-4" />
                                )}
                                Save changes
                            </button>

                            <Transition
                                show={recentlySuccessful}
                                enter="transition ease-in-out duration-200"
                                enterFrom="opacity-0 -translate-x-1"
                                enterTo="opacity-100 translate-x-0"
                                leave="transition ease-in-out duration-200"
                                leaveFrom="opacity-100 translate-x-0"
                                leaveTo="opacity-0 -translate-x-1"
                            >
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EFFDF0] px-3 py-1 text-sm font-medium text-[#2a5a2a] ring-1 ring-inset ring-[#1a3d1a]/10">
                                    <Icon
                                        name="check"
                                        className="h-3.5 w-3.5"
                                    />
                                    Saved.
                                </span>
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
                        <>
                            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#1a3d1a]/40">
                                {dogs.length}{' '}
                                {dogs.length === 1 ? 'dog' : 'dogs'} registered
                            </p>

                            <ul className="space-y-2">
                                {dogs.map((dog) => (
                                    <li
                                        key={dog.id}
                                        className="group flex items-center gap-4 rounded-2xl border border-transparent p-3 transition-colors duration-150 hover:border-[#1a3d1a]/10 hover:bg-[#EFFDF0]/60"
                                    >
                                        {/* Dog Photo */}
                                        <div className="shrink-0">
                                            {dog.photo_url ? (
                                                <img
                                                    src={dog.photo_url}
                                                    alt={dog.dog_name}
                                                    className="h-16 w-16 rounded-xl object-cover ring-2 ring-[#1a3d1a]/10 transition group-hover:ring-[#1a3d1a]/20"
                                                />
                                            ) : (
                                                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#EFFDF0] ring-2 ring-[#1a3d1a]/10 transition group-hover:ring-[#1a3d1a]/20">
                                                    <Icon
                                                        name="paw"
                                                        className="h-7 w-7 text-[#1a3d1a]/30"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* Dog Info */}
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-[#1a3d1a]">
                                                {dog.dog_name}
                                            </p>
                                            <p className="mt-0.5 truncate text-xs text-[#1a3d1a]/55">
                                                {[
                                                    dog.breed,
                                                    dog.sex,
                                                    dog.color,
                                                ]
                                                    .filter(Boolean)
                                                    .join(' · ') ||
                                                    'Breed not set'}
                                            </p>

                                            <div className="mt-2 sm:hidden">
                                                <StatusPill
                                                    active={dog.is_active}
                                                    activeLabel="Active"
                                                    inactiveLabel="Inactive"
                                                />
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex shrink-0 items-center gap-3">
                                            <div className="hidden sm:block">
                                                <StatusPill
                                                    active={dog.is_active}
                                                    activeLabel="Active"
                                                    inactiveLabel="Inactive"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => openEditDog(dog)}
                                                className={rowButtonClass}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => toggleDogStatus(dog)}
                                                className={`${rowButtonClass} ${dog.is_active ? 'text-red-700 hover:bg-red-50' : 'text-[#2a5a2a] hover:bg-[#EFFDF0]'}`}
                                            >
                                                {dog.is_active ? 'Deactivate' : 'Reactivate'}
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </>
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