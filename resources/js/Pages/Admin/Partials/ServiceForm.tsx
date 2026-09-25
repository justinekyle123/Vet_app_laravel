import {
    primaryButtonClass,
    secondaryButtonClass,
} from '@/Components/buttonStyles';
import Field, { TextAreaField } from '@/Components/Field';
import { checkboxClass } from '@/Components/formStyles';
import Icon from '@/Components/Icon';
import Modal from '@/Components/Modal';
import Spinner from '@/Components/Spinner';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect } from 'react';

export interface ServiceRecord {
    id: number;
    name: string;
    description: string | null;
    duration_minutes: number;
    /** Eloquent hands decimals back as strings. */
    price: string;
    is_active: boolean;
}

const blank = {
    name: '',
    description: '',
    duration_minutes: '30',
    price: '0',
    is_active: true,
};

/**
 * One modal covers both directions: pass a service to edit it, or `null` to add
 * a new one. The form is re-seeded each time the modal opens so a previous
 * edit's values never leak into the next service.
 */
export default function ServiceForm({
    service,
    show,
    onClose,
}: {
    service: ServiceRecord | null;
    show: boolean;
    onClose: () => void;
}) {
    const {
        data,
        setData,
        post,
        patch,
        processing,
        errors,
        reset,
        clearErrors,
    } = useForm(blank);

    useEffect(() => {
        if (!show) {
            return;
        }

        clearErrors();
        setData(
            service
                ? {
                      name: service.name,
                      description: service.description ?? '',
                      duration_minutes: String(service.duration_minutes),
                      price: String(service.price),
                      is_active: service.is_active,
                  }
                : blank,
        );
    }, [show, service?.id, setData, clearErrors]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onClose();
            },
        };

        if (service) {
            patch(route('admin.services.update', service.id), options);
        } else {
            post(route('admin.services.store'), options);
        }
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="lg">
            <form onSubmit={submit} className="p-6">
                <div>
                    <h2 className="font-serif-display text-xl text-[#1a3d1a]">
                        {service ? 'Edit service' : 'New service'}
                    </h2>
                    <p className="mt-1.5 text-sm leading-relaxed text-[#1a3d1a]/60">
                        {service
                            ? 'Update what this service includes, how long it takes, and what it costs.'
                            : 'Add something the clinic offers. Retired services stay on file for past invoices.'}
                    </p>
                </div>

                <div className="mt-6 space-y-5">
                    <Field
                        label="Name"
                        name="name"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        error={errors.name}
                        placeholder="Wellness consultation"
                        required
                        autoFocus
                    />

                    <TextAreaField
                        label="Description"
                        name="description"
                        rows={3}
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                        error={errors.description}
                        placeholder="What the visit covers, what is included…"
                    />

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <Field
                            label="Duration (minutes)"
                            name="duration_minutes"
                            type="number"
                            min={5}
                            max={600}
                            step={5}
                            value={data.duration_minutes}
                            onChange={(e) =>
                                setData('duration_minutes', e.target.value)
                            }
                            error={errors.duration_minutes}
                            required
                        />

                        <Field
                            label="Price"
                            name="price"
                            type="number"
                            min={0}
                            step="0.01"
                            value={data.price}
                            onChange={(e) =>
                                setData('price', e.target.value)
                            }
                            error={errors.price}
                            required
                        />
                    </div>

                    <label className="flex cursor-pointer items-start gap-2.5">
                        <input
                            type="checkbox"
                            className={`mt-0.5 ${checkboxClass}`}
                            checked={data.is_active}
                            onChange={(e) =>
                                setData('is_active', e.target.checked)
                            }
                        />
                        <span className="text-sm font-semibold text-[#1a3d1a]">
                            Offer this service
                            <span className="mt-0.5 block text-xs font-normal leading-relaxed text-[#1a3d1a]/50">
                                Retired services are hidden from booking but kept
                                for reporting.
                            </span>
                        </span>
                    </label>
                </div>

                <div className="mt-6 flex justify-end gap-2.5">
                    <button
                        type="button"
                        onClick={onClose}
                        className={secondaryButtonClass}
                    >
                        Cancel
                    </button>
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
                        {service ? 'Save service' : 'Add service'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
