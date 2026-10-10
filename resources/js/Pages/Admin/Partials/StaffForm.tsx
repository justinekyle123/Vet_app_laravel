import {
    primaryButtonClass,
    secondaryButtonClass,
} from '@/Components/buttonStyles';
import Field, { TextAreaField } from '@/Components/Field';
import { checkboxClass, fieldClass, labelClass } from '@/Components/formStyles';
import Icon from '@/Components/Icon';
import InputError from '@/Components/InputError';
import Spinner from '@/Components/Spinner';
import { StaffRole } from '@/types';
import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export interface StaffRoleOption {
    value: StaffRole;
    label: string;
}

/** One care-team profile, as the edit form fills from. */
export interface StaffRecord {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string | null;
    role: StaffRole;
    specialization: string | null;
    background: string | null;
    experience_years: number | null;
    qualifications: string | null;
    license_number: string | null;
    image_path: string | null;
    is_active: boolean;
}

/**
 * The add / edit form for a vet or groomer profile.
 *
 * Both roles share one profile shape: name and contact details, the role that
 * decides which services they take, and the professional details the owner
 * portal and landing page show their clients. Vets and groomers do not sign in,
 * so no password is collected; only the two client-facing roles are offered,
 * and administrator accounts are provisioned with the clinic.
 */
export default function StaffForm({
    roles,
    staff = null,
}: {
    roles: StaffRoleOption[];
    /** Null on the create page; the member being edited otherwise. */
    staff?: StaffRecord | null;
}) {
    const { data, setData, post, processing, errors, transform } = useForm(
        staff
            ? {
                  role: staff.role,
                  first_name: staff.first_name,
                  last_name: staff.last_name,
                  email: staff.email,
                  phone_number: staff.phone_number ?? '',
                  specialization: staff.specialization ?? '',
                  experience_years:
                      staff.experience_years !== null
                          ? String(staff.experience_years)
                          : '',
                  license_number: staff.license_number ?? '',
                  qualifications: staff.qualifications ?? '',
                  background: staff.background ?? '',
                  image: null as File | null,
                  is_active: staff.is_active,
              }
            : {
                  role: roles[0]?.value ?? 'veterinarian',
                  first_name: '',
                  last_name: '',
                  email: '',
                  phone_number: '',
                  specialization: '',
                  experience_years: '',
                  license_number: '',
                  qualifications: '',
                  background: '',
                  image: null as File | null,
                  is_active: true,
              },
    );

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        if (staff) {
            transform((formData) => ({ ...formData, _method: 'patch' }));
            post(route('admin.staff.update', staff.id), {
                forceFormData: true,
            });

            return;
        }

        post(route('admin.staff.store'), { forceFormData: true });
    };

    return (
        <form onSubmit={submit} className="space-y-8">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <label htmlFor="role" className={labelClass}>
                        Role
                    </label>
                    <select
                        id="role"
                        className={fieldClass}
                        value={data.role}
                        onChange={(event) =>
                            setData('role', event.target.value as StaffRole)
                        }
                        required
                    >
                        {roles.map((role) => (
                            <option key={role.value} value={role.value}>
                                {role.label}
                            </option>
                        ))}
                    </select>
                    <InputError className="mt-2" message={errors.role} />
                </div>

                <Field
                    label="First name"
                    name="first_name"
                    value={data.first_name}
                    onChange={(event) =>
                        setData('first_name', event.target.value)
                    }
                    error={errors.first_name}
                    placeholder="Clara"
                    required
                    autoFocus
                />

                <Field
                    label="Last name"
                    name="last_name"
                    value={data.last_name}
                    onChange={(event) =>
                        setData('last_name', event.target.value)
                    }
                    error={errors.last_name}
                    placeholder="Mendoza"
                    required
                />

                <Field
                    label="Email"
                    name="email"
                    type="email"
                    value={data.email}
                    onChange={(event) => setData('email', event.target.value)}
                    error={errors.email}
                    placeholder="clara@example.com"
                    autoComplete="off"
                    required
                />

                <Field
                    label="Phone number"
                    name="phone_number"
                    value={data.phone_number}
                    onChange={(event) =>
                        setData('phone_number', event.target.value)
                    }
                    error={errors.phone_number}
                    placeholder="09171234567"
                />

                <Field
                    label="Specialization"
                    name="specialization"
                    value={data.specialization}
                    onChange={(event) =>
                        setData('specialization', event.target.value)
                    }
                    error={errors.specialization}
                    placeholder="Internal medicine"
                />

                <Field
                    label="License number"
                    name="license_number"
                    value={data.license_number}
                    onChange={(event) =>
                        setData('license_number', event.target.value)
                    }
                    error={errors.license_number}
                    placeholder="VET-12345"
                />

                <Field
                    label="Years of experience"
                    name="experience_years"
                    type="number"
                    min={0}
                    max={70}
                    value={data.experience_years}
                    onChange={(event) =>
                        setData('experience_years', event.target.value)
                    }
                    error={errors.experience_years}
                    placeholder="8"
                />

                <div className="min-w-0">
                    <Field
                        label="Photo"
                        name="image"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(event) =>
                            setData('image', event.target.files?.[0] ?? null)
                        }
                        error={errors.image}
                        hint="Optional. JPEG, PNG, or WebP up to 5 MB."
                    />
                    {staff?.image_path && (
                        <p className="mt-2 text-xs text-[#1a3d1a]/55">
                            A photo is already on file. Choose a new file to
                            replace it.
                        </p>
                    )}
                </div>

                <div className="sm:col-span-2">
                    <TextAreaField
                        label="Qualifications"
                        name="qualifications"
                        rows={2}
                        value={data.qualifications}
                        onChange={(event) =>
                            setData('qualifications', event.target.value)
                        }
                        error={errors.qualifications}
                        placeholder="Licensed veterinarian; certified professional groomer..."
                    />
                </div>

                <div className="sm:col-span-2">
                    <TextAreaField
                        label="Background"
                        name="background"
                        rows={3}
                        value={data.background}
                        onChange={(event) =>
                            setData('background', event.target.value)
                        }
                        error={errors.background}
                        placeholder="What they work on and how they care for dogs..."
                    />
                </div>
            </div>

            <label className="flex cursor-pointer items-start gap-2.5">
                <input
                    type="checkbox"
                    className={`mt-0.5 ${checkboxClass}`}
                    checked={data.is_active}
                    onChange={(event) =>
                        setData('is_active', event.target.checked)
                    }
                />
                <span className="text-sm font-semibold text-[#1a3d1a]">
                    Available for bookings
                    <span className="mt-0.5 block text-xs font-normal leading-relaxed text-[#1a3d1a]/50">
                        Inactive staff stay on past records but are hidden from
                        the care team.
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
                        <Icon name="check" className="h-4 w-4" />
                    )}
                    {staff ? 'Save changes' : 'Add staff member'}
                </button>
                <a
                    href={route('admin.staff.index')}
                    className={secondaryButtonClass}
                >
                    Cancel
                </a>
            </div>
        </form>
    );
}
