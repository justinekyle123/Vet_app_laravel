import Field from '@/Components/Field';
import InputError from '@/Components/InputError';
import Modal from '@/Components/Modal';
import Spinner from '@/Components/Spinner';
import {
    primaryButtonClass,
    secondaryButtonClass,
} from '@/Components/buttonStyles';
import { checkboxClass, fieldClass, labelClass } from '@/Components/formStyles';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect } from 'react';

export interface BreedOption {
    breed_id: number;
    breed_name: string;
}

export interface DogRecord {
    id: number;
    dog_name: string;
    breed_id: number | null;
    breed: string | null;
    sex: string;
    color: string | null;
    birth_date: string | null;
    weight_kg: string | null;
    is_vaccinated: boolean;
    photo_url: string | null;
    is_active: boolean;
}

const blank = {
    dog_name: '',
    breed_id: '',
    sex: 'Unknown',
    color: '',
    birth_date: '',
    weight_kg: '',
    is_vaccinated: false,
    photo_url: '',
    is_active: true,
};

export default function DogFormModal({
    dog,
    breeds,
    show,
    onClose,
}: {
    /** Null opens the modal in "add a dog" mode. */
    dog: DogRecord | null;
    breeds: BreedOption[];
    show: boolean;
    onClose: () => void;
}) {
    const { data, setData, post, patch, processing, errors, reset, clearErrors } =
        useForm(blank);

    // Reload the form with the selected dog's values whenever the modal opens.
    useEffect(() => {
        if (!show) {
            return;
        }

        clearErrors();

        if (dog) {
            setData({
                dog_name: dog.dog_name ?? '',
                breed_id: dog.breed_id ? String(dog.breed_id) : '',
                sex: dog.sex || 'Unknown',
                color: dog.color ?? '',
                birth_date: dog.birth_date ?? '',
                weight_kg: dog.weight_kg ?? '',
                is_vaccinated: Boolean(dog.is_vaccinated),
                photo_url: dog.photo_url ?? '',
                is_active: Boolean(dog.is_active),
            });
        } else {
            reset();
        }
    }, [show, dog?.id]);

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => onClose(),
        };

        if (dog) {
            patch(route('owner.dogs.update', dog.id), options);
        } else {
            post(route('owner.dogs.store'), options);
        }
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="lg">
            <form onSubmit={submit} className="p-6">
                <h2 className="font-serif-display text-2xl leading-tight text-[#1a3d1a]">
                    {dog ? `Edit ${dog.dog_name}` : 'Add a dog'}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-[#1a3d1a]/60">
                    {dog
                        ? 'Update your dog details and save.'
                        : 'Tell us about your dog so the clinic is ready for their visit.'}
                </p>

                <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <Field
                        label="Name"
                        name="dog_name"
                        value={data.dog_name}
                        onChange={(event) =>
                            setData('dog_name', event.target.value)
                        }
                        error={errors.dog_name}
                        autoFocus
                        required
                    />

                    <div className="min-w-0">
                        <label htmlFor="breed_id" className={labelClass}>
                            Breed
                        </label>
                        <select
                            id="breed_id"
                            name="breed_id"
                            className={fieldClass}
                            value={data.breed_id}
                            onChange={(event) =>
                                setData('breed_id', event.target.value)
                            }
                        >
                            <option value="">Unspecified</option>
                            {breeds.map((breed) => (
                                <option
                                    key={breed.breed_id}
                                    value={breed.breed_id}
                                >
                                    {breed.breed_name}
                                </option>
                            ))}
                        </select>
                        <InputError className="mt-2" message={errors.breed_id} />
                    </div>

                    <div className="min-w-0">
                        <label htmlFor="sex" className={labelClass}>
                            Sex
                        </label>
                        <select
                            id="sex"
                            name="sex"
                            className={fieldClass}
                            value={data.sex}
                            onChange={(event) =>
                                setData('sex', event.target.value)
                            }
                        >
                            <option value="Unknown">Unknown</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                        <InputError className="mt-2" message={errors.sex} />
                    </div>

                    <Field
                        label="Color"
                        name="color"
                        value={data.color}
                        onChange={(event) =>
                            setData('color', event.target.value)
                        }
                        error={errors.color}
                    />

                    <Field
                        label="Birth date"
                        name="birth_date"
                        type="date"
                        value={data.birth_date}
                        onChange={(event) =>
                            setData('birth_date', event.target.value)
                        }
                        error={errors.birth_date}
                    />

                    <Field
                        label="Weight (kg)"
                        name="weight_kg"
                        type="number"
                        step="0.01"
                        min="0"
                        value={data.weight_kg}
                        onChange={(event) =>
                            setData('weight_kg', event.target.value)
                        }
                        error={errors.weight_kg}
                    />

                    <div className="sm:col-span-2">
                        <Field
                            label="Photo URL"
                            name="photo_url"
                            value={data.photo_url}
                            onChange={(event) =>
                                setData('photo_url', event.target.value)
                            }
                            error={errors.photo_url}
                            hint="Optional. A link to a photo the clinic can show with your dog's record."
                        />
                    </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-6">
                    <label className="flex cursor-pointer items-center gap-2.5">
                        <input
                            type="checkbox"
                            className={checkboxClass}
                            checked={data.is_vaccinated}
                            onChange={(event) =>
                                setData(
                                    'is_vaccinated',
                                    event.target.checked,
                                )
                            }
                        />
                        <span className="text-sm font-medium text-[#1a3d1a]">
                            Vaccinated
                        </span>
                    </label>

                    <label className="flex cursor-pointer items-center gap-2.5">
                        <input
                            type="checkbox"
                            className={checkboxClass}
                            checked={data.is_active}
                            onChange={(event) =>
                                setData('is_active', event.target.checked)
                            }
                        />
                        <span className="text-sm font-medium text-[#1a3d1a]">
                            Active
                        </span>
                    </label>
                </div>

                <div className="mt-6 flex justify-end gap-3 border-t border-[#1a3d1a]/10 pt-6">
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
                        {processing && <Spinner className="h-4 w-4" />}
                        {dog ? 'Save changes' : 'Add dog'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
