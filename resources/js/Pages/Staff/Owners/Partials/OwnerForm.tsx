import {
    primaryButtonClass,
    secondaryButtonClass,
} from '@/Components/buttonStyles';
import Field, { TextAreaField } from '@/Components/Field';
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
                    hint="Leave blank if the client has not shared one."
                />

                <Field
                    label="Phone"
                    name="phone"
                    type="tel"
                    value={data.phone}
                    onChange={(e) => setData('phone', e.target.value)}
                    error={errors.phone}
                    autoComplete="tel"
                />

                <Field
                    label="Alternate phone"
                    name="alternate_phone"
                    type="tel"
                    value={data.alternate_phone}
                    onChange={(e) =>
                        setData('alternate_phone', e.target.value)
                    }
                    error={errors.alternate_phone}
                />

                <Field
                    label="City"
                    name="city"
                    value={data.city}
                    onChange={(e) => setData('city', e.target.value)}
                    error={errors.city}
                    autoComplete="address-level2"
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

                <Field
                    label="Postal code"
                    name="postal_code"
                    value={data.postal_code}
                    onChange={(e) => setData('postal_code', e.target.value)}
                    error={errors.postal_code}
                    autoComplete="postal-code"
                />
            </div>

            <div className="border-t border-[#1a3d1a]/10 pt-6">
                <TextAreaField
                    label="Notes"
                    name="notes"
                    rows={3}
                    value={data.notes}
                    onChange={(e) => setData('notes', e.target.value)}
                    error={errors.notes}
                    placeholder="Anything the desk should know — access needs, preferred vet, billing arrangements…"
                />
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
                        Inactive records stay on file with their pets and
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
