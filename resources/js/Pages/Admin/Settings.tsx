import { primaryButtonClass } from '@/Components/buttonStyles';
import Field from '@/Components/Field';
import Icon from '@/Components/Icon';
import Panel from '@/Components/Panel';
import Spinner from '@/Components/Spinner';
import StaffLayout from '@/Layouts/StaffLayout';
import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

/** The values the console manages, keyed the same as `Setting::defaults()`. */
export interface ClinicSettings {
    clinic_name: string;
    contact_email: string;
    contact_phone: string;
    address: string;
    city: string;
    postal_code: string;
    opening_hours: string;
    appointment_duration: string;
    tax_rate: string;
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
        contact_email: settings.contact_email ?? '',
        contact_phone: settings.contact_phone ?? '',
        address: settings.address ?? '',
        city: settings.city ?? '',
        postal_code: settings.postal_code ?? '',
        opening_hours: settings.opening_hours ?? '',
        appointment_duration: settings.appointment_duration ?? '30',
        tax_rate: settings.tax_rate ?? '0',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        patch(route('admin.settings.update'), { preserveScroll: true });
    };

    return (
        <StaffLayout
            title="Clinic Settings"
            heading="Clinic settings"
            description="How the clinic identifies itself, how clients reach it, and the defaults every booking and invoice starts from."
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
                                name="contact_email"
                                type="email"
                                value={data.contact_email}
                                onChange={(e) =>
                                    setData('contact_email', e.target.value)
                                }
                                error={errors.contact_email}
                                hint="Where client replies should land."
                                autoComplete="email"
                            />

                            <Field
                                label="Contact phone"
                                name="contact_phone"
                                type="tel"
                                value={data.contact_phone}
                                onChange={(e) =>
                                    setData('contact_phone', e.target.value)
                                }
                                error={errors.contact_phone}
                                autoComplete="tel"
                            />
                        </div>
                    </Panel>

                    <div className="space-y-6">
                        <Panel title="Location" icon="user">
                            <div className="space-y-5">
                                <Field
                                    label="Address"
                                    name="address"
                                    value={data.address}
                                    onChange={(e) =>
                                        setData('address', e.target.value)
                                    }
                                    error={errors.address}
                                    autoComplete="street-address"
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
                                    />

                                    <Field
                                        label="Postal code"
                                        name="postal_code"
                                        value={data.postal_code}
                                        onChange={(e) =>
                                            setData(
                                                'postal_code',
                                                e.target.value,
                                            )
                                        }
                                        error={errors.postal_code}
                                        autoComplete="postal-code"
                                    />
                                </div>
                            </div>
                        </Panel>

                        <Panel title="Operations" icon="clock">
                            <div className="space-y-5">
                                <Field
                                    label="Opening hours"
                                    name="opening_hours"
                                    value={data.opening_hours}
                                    onChange={(e) =>
                                        setData(
                                            'opening_hours',
                                            e.target.value,
                                        )
                                    }
                                    error={errors.opening_hours}
                                    hint="Shown to clients on the public site."
                                />

                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                    <Field
                                        label="Default visit (minutes)"
                                        name="appointment_duration"
                                        type="number"
                                        min={5}
                                        max={600}
                                        step={5}
                                        value={data.appointment_duration}
                                        onChange={(e) =>
                                            setData(
                                                'appointment_duration',
                                                e.target.value,
                                            )
                                        }
                                        error={errors.appointment_duration}
                                        hint="Slot length new bookings start from."
                                        required
                                    />

                                    <Field
                                        label="Tax rate (%)"
                                        name="tax_rate"
                                        type="number"
                                        min={0}
                                        max={100}
                                        step="0.01"
                                        value={data.tax_rate}
                                        onChange={(e) =>
                                            setData(
                                                'tax_rate',
                                                e.target.value,
                                            )
                                        }
                                        error={errors.tax_rate}
                                        hint="Added to invoice subtotals."
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
