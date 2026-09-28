import DashboardCard, { EmptyState } from '@/Components/DashboardCard';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Transition } from '@headlessui/react';
import { FormEventHandler, useState } from 'react';
import DogFormModal, {
    BreedOption,
    DogRecord,
} from './Partials/DogFormModal';

interface OwnerAccount {
    id: number;
    first_name: string;
    last_name: string;
    email: string | null;
    phone_number: string | null;
    address: string | null;
}

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

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        patch(route('owner.account.update'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div>
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        My Account
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Keep your contact details up to date and review your
                        dogs.
                    </p>
                </div>
            }
        >
            <Head title="My Account" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <DashboardCard title="Contact details" icon="user">
                            <form onSubmit={submit} className="space-y-5">
                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                    <div>
                                        <InputLabel
                                            htmlFor="first_name"
                                            value="First name"
                                        />
                                        <TextInput
                                            id="first_name"
                                            className="mt-1 block w-full"
                                            value={data.first_name}
                                            onChange={(e) =>
                                                setData(
                                                    'first_name',
                                                    e.target.value,
                                                )
                                            }
                                            required
                                            isFocused
                                            autoComplete="given-name"
                                        />
                                        <InputError
                                            className="mt-2"
                                            message={errors.first_name}
                                        />
                                    </div>

                                    <div>
                                        <InputLabel
                                            htmlFor="last_name"
                                            value="Last name"
                                        />
                                        <TextInput
                                            id="last_name"
                                            className="mt-1 block w-full"
                                            value={data.last_name}
                                            onChange={(e) =>
                                                setData(
                                                    'last_name',
                                                    e.target.value,
                                                )
                                            }
                                            required
                                            autoComplete="family-name"
                                        />
                                        <InputError
                                            className="mt-2"
                                            message={errors.last_name}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <InputLabel htmlFor="email" value="Email" />
                                    <TextInput
                                        id="email"
                                        type="email"
                                        className="mt-1 block w-full"
                                        value={data.email}
                                        onChange={(e) =>
                                            setData('email', e.target.value)
                                        }
                                        required
                                        autoComplete="username"
                                    />
                                    <InputError
                                        className="mt-2"
                                        message={errors.email}
                                    />
                                </div>

                                <div>
                                    <InputLabel
                                        htmlFor="phone_number"
                                        value="Phone number"
                                    />
                                    <TextInput
                                        id="phone_number"
                                        className="mt-1 block w-full"
                                        value={data.phone_number}
                                        onChange={(e) =>
                                            setData(
                                                'phone_number',
                                                e.target.value,
                                            )
                                        }
                                        autoComplete="tel"
                                    />
                                    <InputError
                                        className="mt-2"
                                        message={errors.phone_number}
                                    />
                                </div>

                                <div>
                                    <InputLabel
                                        htmlFor="address"
                                        value="Address"
                                    />
                                    <TextInput
                                        id="address"
                                        className="mt-1 block w-full"
                                        value={data.address}
                                        onChange={(e) =>
                                            setData('address', e.target.value)
                                        }
                                        autoComplete="street-address"
                                    />
                                    <InputError
                                        className="mt-2"
                                        message={errors.address}
                                    />
                                </div>

                                <div className="flex items-center gap-4">
                                    <PrimaryButton disabled={processing}>
                                        Save
                                    </PrimaryButton>

                                    <Transition
                                        show={recentlySuccessful}
                                        enter="transition ease-in-out"
                                        enterFrom="opacity-0"
                                        leave="transition ease-in-out"
                                        leaveTo="opacity-0"
                                    >
                                        <p className="text-sm text-gray-600">
                                            Saved.
                                        </p>
                                    </Transition>
                                </div>
                            </form>
                        </DashboardCard>

                        <DashboardCard
                            title="My dogs"
                            icon="paw"
                            action={
                                <SecondaryButton onClick={openAddDog}>
                                    Add dog
                                </SecondaryButton>
                            }
                        >
                            {dogs.length === 0 ? (
                                <EmptyState message="No dogs are registered under your account yet. Add your first one to get started." />
                            ) : (
                                <ul className="divide-y divide-gray-100">
                                    {dogs.map((dog) => (
                                        <li
                                            key={dog.id}
                                            className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium text-gray-900">
                                                    {dog.dog_name}
                                                </p>
                                                <p className="truncate text-xs text-gray-500">
                                                    {[dog.breed, dog.sex]
                                                        .filter(Boolean)
                                                        .join(' · ')}
                                                </p>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-3">
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                                        dog.is_active
                                                            ? 'bg-emerald-50 text-emerald-700'
                                                            : 'bg-gray-100 text-gray-500'
                                                    }`}
                                                >
                                                    {dog.is_active
                                                        ? 'Active'
                                                        : 'Inactive'}
                                                </span>
                                                <SecondaryButton
                                                    onClick={() =>
                                                        openEditDog(dog)
                                                    }
                                                >
                                                    Edit
                                                </SecondaryButton>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <p className="mt-4 text-xs text-gray-500">
                                Need something removed? Contact the front desk.{' '}
                                <Link
                                    href={route('owner.dashboard')}
                                    className="font-medium text-emerald-700 hover:text-emerald-800"
                                >
                                    Back to portal
                                </Link>
                            </p>
                        </DashboardCard>
                    </div>
                </div>
            </div>

            <DogFormModal
                dog={selectedDog}
                breeds={breeds}
                show={dogModalOpen}
                onClose={() => setDogModalOpen(false)}
            />
        </AuthenticatedLayout>
    );
}
