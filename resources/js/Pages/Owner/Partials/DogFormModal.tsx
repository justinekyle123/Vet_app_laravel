import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
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

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

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
                <h2 className="text-lg font-medium text-gray-900">
                    {dog ? `Edit ${dog.dog_name}` : 'Add a dog'}
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                    {dog
                        ? 'Update your dog details and save.'
                        : 'Tell us about your dog so the clinic is ready for their visit.'}
                </p>

                <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                        <InputLabel htmlFor="dog_name" value="Name" />
                        <TextInput
                            id="dog_name"
                            className="mt-1 block w-full"
                            value={data.dog_name}
                            onChange={(e) =>
                                setData('dog_name', e.target.value)
                            }
                            isFocused
                        />
                        <InputError className="mt-2" message={errors.dog_name} />
                    </div>

                    <div>
                        <InputLabel htmlFor="dog_breed" value="Breed" />
                        <select
                            id="dog_breed"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            value={data.breed_id}
                            onChange={(e) =>
                                setData('breed_id', e.target.value)
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

                    <div>
                        <InputLabel htmlFor="dog_sex" value="Sex" />
                        <select
                            id="dog_sex"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            value={data.sex}
                            onChange={(e) => setData('sex', e.target.value)}
                        >
                            <option value="Unknown">Unknown</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                        <InputError className="mt-2" message={errors.sex} />
                    </div>

                    <div>
                        <InputLabel htmlFor="dog_color" value="Color" />
                        <TextInput
                            id="dog_color"
                            className="mt-1 block w-full"
                            value={data.color}
                            onChange={(e) => setData('color', e.target.value)}
                        />
                        <InputError className="mt-2" message={errors.color} />
                    </div>

                    <div>
                        <InputLabel
                            htmlFor="dog_birth_date"
                            value="Birth date"
                        />
                        <TextInput
                            id="dog_birth_date"
                            type="date"
                            className="mt-1 block w-full"
                            value={data.birth_date}
                            onChange={(e) =>
                                setData('birth_date', e.target.value)
                            }
                        />
                        <InputError
                            className="mt-2"
                            message={errors.birth_date}
                        />
                    </div>

                    <div>
                        <InputLabel
                            htmlFor="dog_weight"
                            value="Weight (kg)"
                        />
                        <TextInput
                            id="dog_weight"
                            type="number"
                            step="0.01"
                            min="0"
                            className="mt-1 block w-full"
                            value={data.weight_kg}
                            onChange={(e) =>
                                setData('weight_kg', e.target.value)
                            }
                        />
                        <InputError className="mt-2" message={errors.weight_kg} />
                    </div>
                </div>

                <div className="mt-5">
                    <InputLabel htmlFor="dog_photo" value="Photo URL" />
                    <TextInput
                        id="dog_photo"
                        className="mt-1 block w-full"
                        value={data.photo_url}
                        onChange={(e) =>
                            setData('photo_url', e.target.value)
                        }
                    />
                    <InputError className="mt-2" message={errors.photo_url} />
                </div>

                <div className="mt-5 flex items-center gap-6">
                    <label className="flex items-center gap-2">
                        <Checkbox
                            checked={data.is_vaccinated}
                            onChange={(e) =>
                                setData('is_vaccinated', e.target.checked)
                            }
                        />
                        <span className="text-sm text-gray-700">
                            Vaccinated
                        </span>
                    </label>

                    <label className="flex items-center gap-2">
                        <Checkbox
                            checked={data.is_active}
                            onChange={(e) =>
                                setData('is_active', e.target.checked)
                            }
                        />
                        <span className="text-sm text-gray-700">Active</span>
                    </label>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
                    <PrimaryButton disabled={processing}>
                        {dog ? 'Save changes' : 'Add dog'}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
