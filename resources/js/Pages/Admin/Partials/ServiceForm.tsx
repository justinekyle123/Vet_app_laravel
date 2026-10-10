import { primaryButtonClass, secondaryButtonClass } from '@/Components/buttonStyles';
import Field, { TextAreaField } from '@/Components/Field';
import { checkboxClass, fieldClass, labelClass } from '@/Components/formStyles';
import Icon from '@/Components/Icon';
import InputError from '@/Components/InputError';
import Spinner from '@/Components/Spinner';
import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export interface ServiceRecord {
    id: number;
    category_id: number;
    category_name: string | null;
    service_name: string;
    description: string | null;
    image_path: string | null;
    duration_minutes: number;
    price: string;
    is_active: boolean;
}

export interface ServiceCategoryOption {
    category_id: number;
    category_name: string;
}

const blank = {
    service_name: '',
    category_id: '',
    description: '',
    duration_minutes: '30',
    price: '0',
    is_active: true,
};

export default function ServiceForm({
    service,
    categories,
}: {
    service: ServiceRecord | null;
    categories: ServiceCategoryOption[];
}) {
    const { data, setData, post, processing, errors, transform } = useForm(
        service
            ? {
                  service_name: service.service_name,
                  category_id: String(service.category_id),
                  description: service.description ?? '',
                  image: null as File | null,
                  duration_minutes: String(service.duration_minutes),
                  price: String(service.price),
                  is_active: service.is_active,
              }
            : { ...blank, image: null as File | null },
    );

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        if (service) {
            transform((formData) => ({
                ...formData,
                _method: 'patch',
            }));
            post(route('admin.services.update', service.id), {
                forceFormData: true,
            });
        } else {
            post(route('admin.services.store'), { forceFormData: true });
        }
    };

    return (
        <form onSubmit={submit} className="space-y-8">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field
                    label="Service name"
                    name="service_name"
                    value={data.service_name}
                    onChange={(event) => setData('service_name', event.target.value)}
                    error={errors.service_name}
                    placeholder="Wellness consultation"
                    required
                    autoFocus
                />

                <div>
                    <label htmlFor="category_id" className={labelClass}>
                        Category
                    </label>
                    <select
                        id="category_id"
                        className={fieldClass}
                        value={data.category_id}
                        onChange={(event) => setData('category_id', event.target.value)}
                        required
                    >
                        <option value="">Choose a category...</option>
                        {categories.map((category) => (
                            <option key={category.category_id} value={category.category_id}>
                                {category.category_name}
                            </option>
                        ))}
                    </select>
                    <InputError className="mt-2" message={errors.category_id} />
                </div>

                <div className="sm:col-span-2">
                    <TextAreaField
                        label="Description"
                        name="description"
                        rows={4}
                        value={data.description}
                        onChange={(event) => setData('description', event.target.value)}
                        error={errors.description}
                        placeholder="What the visit covers and what is included..."
                    />
                </div>

                <div className="sm:col-span-2">
                    <Field
                        label="Service image"
                        name="image"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(event) => setData('image', event.target.files?.[0] ?? null)}
                        error={errors.image}
                        hint="Optional. JPEG, PNG, or WebP up to 5 MB."
                    />
                    {service?.image_path && (
                        <p className="mt-2 text-xs text-[#1a3d1a]/55">
                            An existing image is set. Choose a new file to replace it.
                        </p>
                    )}
                </div>

                <Field
                    label="Duration (minutes)"
                    name="duration_minutes"
                    type="number"
                    min={5}
                    max={600}
                    step={5}
                    value={data.duration_minutes}
                    onChange={(event) => setData('duration_minutes', event.target.value)}
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
                    onChange={(event) => setData('price', event.target.value)}
                    error={errors.price}
                    required
                />
            </div>

            <label className="flex cursor-pointer items-start gap-2.5">
                <input
                    type="checkbox"
                    className={`mt-0.5 ${checkboxClass}`}
                    checked={data.is_active}
                    onChange={(event) => setData('is_active', event.target.checked)}
                />
                <span className="text-sm font-semibold text-[#1a3d1a]">
                    Offer this service
                    <span className="mt-0.5 block text-xs font-normal leading-relaxed text-[#1a3d1a]/50">
                        Retired services are hidden from booking but kept for reporting.
                    </span>
                </span>
            </label>

            <div className="flex flex-wrap items-center gap-3 border-t border-[#1a3d1a]/10 pt-6">
                <button type="submit" disabled={processing} className={primaryButtonClass}>
                    {processing ? <Spinner className="h-4 w-4" /> : <Icon name="check" className="h-4 w-4" />}
                    {service ? 'Save service' : 'Add service'}
                </button>
                <a href={route('admin.services.index')} className={secondaryButtonClass}>
                    Cancel
                </a>
            </div>
        </form>
    );
}
