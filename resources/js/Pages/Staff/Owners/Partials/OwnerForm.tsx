import {
    primaryButtonClass,
    secondaryButtonClass,
} from '@/Components/buttonStyles';
import Field from '@/Components/Field';
import { checkboxClass } from '@/Components/formStyles';
import Icon from '@/Components/Icon';
import Spinner from '@/Components/Spinner';
import { Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export interface OwnerRecord {
    id: number;
    first_name: string;
    last_name: string;
    email: string | null;
    phone_number: string | null;
    address: string | null;
    is_active: boolean;
}

const blank = {
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    address: '',
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
                  phone_number: owner.phone_number ?? '',
                  address: owner.address ?? '',
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
        <form onSubmit={submit} className="space-y-8">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field
                    label="First name"
                    name="first_name"
                    value={data.first_name}
                    onChange={(e) => setData('first_name', e.target.value)}
                    error={errors.first_name}
                    required
                    autoFocus
                    autoComplete="given-name"
                />

                <Field
                    label="Last name"
                    name="last_name"
                    value={data.last_name}
                    onChange={(e) => setData('last_name', e.target.value)}
                    error={errors.last_name}
                    required
                    autoComplete="family-name"
                />

                <Field
                    label="Email"
                    name="email"
                    type="email"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    error={errors.email}
                    autoComplete="email"
                    hint="Used to sign in and to send appointment reminders."
                    required
                />

                <Field
                    label="Phone number"
                    name="phone_number"
                    type="tel"
                    value={data.phone_number}
                    onChange={(e) => setData('phone_number', e.target.value)}
                    error={errors.phone_number}
                    autoComplete="tel"
                    required
                />

                <div className="sm:col-span-2">
                    <Field
                        label="Address"
                        name="address"
                        value={data.address}
                        onChange={(e) => setData('address', e.target.value)}
                        error={errors.address}
                        autoComplete="street-address"
                    />
                </div>
            </div>

            <label className="flex cursor-pointer items-start gap-2.5">
                <input
                    type="checkbox"
                    className={`mt-0.5 ${checkboxClass}`}
                    checked={data.is_active}
                    onChange={(e) => setData('is_active', e.target.checked)}
                />
                <span className="text-sm font-semibold text-[#1a3d1a]">
                    Active client
                    <span className="mt-0.5 block text-xs font-normal leading-relaxed text-[#1a3d1a]/50">
                        Inactive records stay on file with their dogs and
                        history, but drop out of the default client list.
                    </span>
                </span>
            </label>

            <div className="flex flex-wrap items-center gap-3 border-t border-[#1a3d1a]/10 pt-6">
                <button
                    type="submit"
                    disabled={processing}
                    className={primaryButtonClass}
                >
                    {processing ? (
                        <Spinner className="h-4 w-4" />
                    ) : (
                        <Icon
                            name={owner ? 'check' : 'plus'}
                            className="h-4 w-4"
                        />
                    )}
                    {owner ? 'Save changes' : 'Create owner'}
                </button>

                <Link
                    href={
                        owner
                            ? route('owners.show', owner.id)
                            : route('owners.index')
                    }
                    className={secondaryButtonClass}
                >
                    Cancel
                </Link>
            </div>
        </form>
    );
}
