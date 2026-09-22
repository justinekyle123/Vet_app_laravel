import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export interface OwnerRecord {
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
}

const blank = {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    alternate_phone: '',
    address: '',
    city: '',
    postal_code: '',
    notes: '',
    is_active: true,
};

/**
 * Shared by the create and edit screens: with no owner it posts a new record,
 * with one it patches that record.
 */
export default function OwnerForm({ owner }: { owner?: OwnerRecord }) {
    const { data, setData, post, patch, processing, errors } = useForm(
        owner
            ? {
                  first_name: owner.first_name ?? '',
                  last_name: owner.last_name ?? '',
                  email: owner.email ?? '',
                  phone: owner.phone ?? '',
                  alternate_phone: owner.alternate_phone ?? '',
                  address: owner.address ?? '',
                  city: owner.city ?? '',
                  postal_code: owner.postal_code ?? '',
                  notes: owner.notes ?? '',
                  is_active: Boolean(owner.is_active),
              }
            : blank,
    );

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        if (owner) {
            patch(route('owners.update', owner.id));
        } else {
            post(route('owners.store'));
        }
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                    <InputLabel htmlFor="first_name" value="First name" />
                    <TextInput
                        id="first_name"
                        className="mt-1 block w-full"
                        value={data.first_name}
                        onChange={(e) => setData('first_name', e.target.value)}
                        required
                        isFocused
                        autoComplete="given-name"
                    />
                    <InputError className="mt-2" message={errors.first_name} />
                </div>

                <div>
                    <InputLabel htmlFor="last_name" value="Last name" />
                    <TextInput
                        id="last_name"
                        className="mt-1 block w-full"
                        value={data.last_name}
                        onChange={(e) => setData('last_name', e.target.value)}
                        required
                        autoComplete="family-name"
                    />
                    <InputError className="mt-2" message={errors.last_name} />
                </div>

                <div>
                    <InputLabel htmlFor="email" value="Email" />
                    <TextInput
                        id="email"
                        type="email"
                        className="mt-1 block w-full"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        autoComplete="email"
                    />
                    <InputError className="mt-2" message={errors.email} />
                </div>

                <div>
                    <InputLabel htmlFor="phone" value="Phone" />
                    <TextInput
                        id="phone"
                        className="mt-1 block w-full"
                        value={data.phone}
                        onChange={(e) => setData('phone', e.target.value)}
                        autoComplete="tel"
                    />
                    <InputError className="mt-2" message={errors.phone} />
                </div>

                <div>
                    <InputLabel
                        htmlFor="alternate_phone"
                        value="Alternate phone"
                    />
                    <TextInput
                        id="alternate_phone"
                        className="mt-1 block w-full"
                        value={data.alternate_phone}
                        onChange={(e) =>
                            setData('alternate_phone', e.target.value)
                        }
                    />
                    <InputError
                        className="mt-2"
                        message={errors.alternate_phone}
                    />
                </div>

                <div>
                    <InputLabel htmlFor="city" value="City" />
                    <TextInput
                        id="city"
                        className="mt-1 block w-full"
                        value={data.city}
                        onChange={(e) => setData('city', e.target.value)}
                        autoComplete="address-level2"
                    />
                    <InputError className="mt-2" message={errors.city} />
                </div>

                <div className="sm:col-span-2">
                    <InputLabel htmlFor="address" value="Address" />
                    <TextInput
                        id="address"
                        className="mt-1 block w-full"
                        value={data.address}
                        onChange={(e) => setData('address', e.target.value)}
                        autoComplete="street-address"
                    />
                    <InputError className="mt-2" message={errors.address} />
                </div>

                <div>
                    <InputLabel htmlFor="postal_code" value="Postal code" />
                    <TextInput
                        id="postal_code"
                        className="mt-1 block w-full"
                        value={data.postal_code}
                        onChange={(e) => setData('postal_code', e.target.value)}
                        autoComplete="postal-code"
                    />
                    <InputError className="mt-2" message={errors.postal_code} />
                </div>
            </div>

            <div>
                <InputLabel htmlFor="notes" value="Notes" />
                <textarea
                    id="notes"
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value={data.notes}
                    onChange={(e) => setData('notes', e.target.value)}
                />
                <InputError className="mt-2" message={errors.notes} />
            </div>

            <label className="flex items-center gap-2">
                <Checkbox
                    checked={data.is_active}
                    onChange={(e) => setData('is_active', e.target.checked)}
                />
                <span className="text-sm text-gray-700">
                    Active client
                </span>
            </label>

            <div className="flex items-center gap-3">
                <PrimaryButton disabled={processing}>
                    {owner ? 'Save changes' : 'Create owner'}
                </PrimaryButton>
                <Link
                    href={
                        owner
                            ? route('owners.show', owner.id)
                            : route('owners.index')
                    }
                    className="text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                    Cancel
                </Link>
            </div>
        </form>
    );
}
