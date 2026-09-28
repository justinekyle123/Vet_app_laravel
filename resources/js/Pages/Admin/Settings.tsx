import { primaryButtonClass } from '@/Components/buttonStyles';
import Field from '@/Components/Field';
import Icon from '@/Components/Icon';
import Panel from '@/Components/Panel';
import Spinner from '@/Components/Spinner';
import StaffLayout from '@/Layouts/StaffLayout';
import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

/** The columns of the single `clinic_info` row the console edits. */
export interface ClinicSettings {
    clinic_name: string;
    address_line: string;
    city: string;
    province: string;
    zip_code: string | null;
    contact_number: string;
    email: string;
    opening_time: string;
    closing_time: string;
    days_open: string;
    logo_url: string | null;
}

export default function Settings({
    settings,
}: {
    settings: ClinicSettings;
}) {
    const {
        data,
        setData,
        patch,
        processing,
        errors,
        recentlySuccessful,
    } = useForm({
        clinic_name: settings.clinic_name ?? '',
        address_line: settings.address_line ?? '',
        city: settings.city ?? '',
        province: settings.province ?? '',
        zip_code: settings.zip_code ?? '',
        contact_number: settings.contact_number ?? '',
        email: settings.email ?? '',
        opening_time: settings.opening_time ?? '08:00',
        closing_time: settings.closing_time ?? '18:00',
        days_open: settings.days_open ?? 'Monday-Saturday',
        logo_url: settings.logo_url ?? '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        patch(route('admin.settings.update'), { preserveScroll: true });
    };

    return (
        <StaffLayout
            title="Clinic Settings"
            heading="Clinic settings"
            description="How the clinic identifies itself and how clients reach it."
        >
            <form onSubmit={submit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Panel title="Clinic identity" icon="cog" fill>
                        <div className="space-y-5">
                            <Field
                                label="Clinic name"
                                name="clinic_name"
                                value={data.clinic_name}
                                onChange={(e) =>
                                    setData('clinic_name', e.target.value)
                                }
                                error={errors.clinic_name}
                                hint="Shown across the console and to clients."
                                required
                            />

                            <Field
                                label="Contact email"
                                name="email"
                                type="email"
                                value={data.email}
                                onChange={(e) =>
                                    setData('email', e.target.value)
                                }
                                error={errors.email}
                                hint="Where client replies should land."
                                autoComplete="email"
                                required
                            />

                            <Field
                                label="Contact number"
                                name="contact_number"
                                type="tel"
                                value={data.contact_number}
                                onChange={(e) =>
                                    setData('contact_number', e.target.value)
                                }
                                error={errors.contact_number}
                                autoComplete="tel"
                                required
                            />

                            <Field
                                label="Logo URL"
                                name="logo_url"
                                type="url"
                                value={data.logo_url}
                                onChange={(e) =>
                                    setData('logo_url', e.target.value)
                                }
                                error={errors.logo_url}
                                hint="Optional — a link to the clinic's logo."
                            />
                        </div>
                    </Panel>

                    <div className="space-y-6">
                        <Panel title="Location" icon="user">
                            <div className="space-y-5">
                                <Field
                                    label="Address"
                                    name="address_line"
                                    value={data.address_line}
                                    onChange={(e) =>
                                        setData('address_line', e.target.value)
                                    }
                                    error={errors.address_line}
                                    autoComplete="street-address"
                                    required
                                />

                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                    <Field
                                        label="City"
                                        name="city"
                                        value={data.city}
                                        onChange={(e) =>
                                            setData('city', e.target.value)
                                        }
                                        error={errors.city}
                                        autoComplete="address-level2"
                                        required
                                    />

                                    <Field
                                        label="Province"
                                        name="province"
                                        value={data.province}
                                        onChange={(e) =>
                                            setData('province', e.target.value)
                                        }
                                        error={errors.province}
                                        autoComplete="address-level1"
                                        required
                                    />

                                    <Field
                                        label="ZIP code"
                                        name="zip_code"
                                        value={data.zip_code}
                                        onChange={(e) =>
                                            setData('zip_code', e.target.value)
                                        }
                                        error={errors.zip_code}
                                        autoComplete="postal-code"
                                    />
                                </div>
                            </div>
                        </Panel>

                        <Panel title="Opening hours" icon="clock">
                            <div className="space-y-5">
                                <Field
                                    label="Days open"
                                    name="days_open"
                                    value={data.days_open}
                                    onChange={(e) =>
                                        setData('days_open', e.target.value)
                                    }
                                    error={errors.days_open}
                                    hint="Shown to clients on the public site."
                                    required
                                />

                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                    <Field
                                        label="Opens at"
                                        name="opening_time"
                                        type="time"
                                        value={data.opening_time}
                                        onChange={(e) =>
                                            setData(
                                                'opening_time',
                                                e.target.value,
                                            )
                                        }
                                        error={errors.opening_time}
                                        required
                                    />

                                    <Field
                                        label="Closes at"
                                        name="closing_time"
                                        type="time"
                                        value={data.closing_time}
                                        onChange={(e) =>
                                            setData(
                                                'closing_time',
                                                e.target.value,
                                            )
                                        }
                                        error={errors.closing_time}
                                        required
                                    />
                                </div>
                            </div>
                        </Panel>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#1a3d1a]/10 bg-white px-5 py-4 shadow-sm">
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
                        Save settings
                    </button>

                    {recentlySuccessful && !processing && (
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2a5a2a]">
                            <Icon name="check" className="h-4 w-4" />
                            Settings saved
                        </span>
                    )}

                    <p className="ml-auto text-xs text-[#1a3d1a]/45">
                        Changes apply across the console and to new bookings.
                    </p>
                </div>
            </form>
        </StaffLayout>
    );
}
