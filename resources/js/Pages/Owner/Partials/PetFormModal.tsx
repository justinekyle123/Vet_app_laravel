import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect } from 'react';

export interface PetRecord {
    id: number;
    name: string;
    species: string;
    breed: string | null;
    sex: string | null;
    color: string | null;
    birth_date: string | null;
    weight_kg: string | null;
    microchip_number: string | null;
    is_neutered: boolean | null;
    allergies: string | null;
    is_active: boolean;
}

const blank = {
    name: '',
    species: 'Dog',
    breed: '',
    sex: '',
    color: '',
    birth_date: '',
    weight_kg: '',
    microchip_number: '',
    is_neutered: false,
    allergies: '',
    is_active: true,
};

export default function PetFormModal({
    pet,
    show,
    onClose,
}: {
    /** Null opens the modal in "add a pet" mode. */
    pet: PetRecord | null;
    show: boolean;
    onClose: () => void;
}) {
    const { data, setData, post, patch, processing, errors, reset, clearErrors } =
        useForm(blank);

    // Reload the form with the selected pet's values whenever the modal opens.
    useEffect(() => {
        if (!show) {
            return;
        }

        clearErrors();

        if (pet) {
            setData({
                name: pet.name ?? '',
                species: pet.species ?? 'Dog',
                breed: pet.breed ?? '',
                sex: pet.sex ?? '',
                color: pet.color ?? '',
                birth_date: pet.birth_date ?? '',
                weight_kg: pet.weight_kg ?? '',
                microchip_number: pet.microchip_number ?? '',
                is_neutered: Boolean(pet.is_neutered),
                allergies: pet.allergies ?? '',
                is_active: Boolean(pet.is_active),
            });
        } else {
            reset();
        }
    }, [show, pet?.id]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => onClose(),
        };

        if (pet) {
            patch(route('owner.pets.update', pet.id), options);
        } else {
            post(route('owner.pets.store'), options);
        }
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="lg">
            <form onSubmit={submit} className="p-6">
                <h2 className="text-lg font-medium text-gray-900">
                    {pet ? `Edit ${pet.name}` : 'Add a pet'}
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                    {pet
                        ? 'Update your pet details and save.'
                        : 'Tell us about your pet so the clinic is ready for their visit.'}
                </p>

                <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div>
                        <InputLabel htmlFor="pet_name" value="Name" />
                        <TextInput
                            id="pet_name"
                            className="mt-1 block w-full"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            isFocused
                        />
                        <InputError className="mt-2" message={errors.name} />
                    </div>

                    <div>
                        <InputLabel htmlFor="pet_species" value="Species" />
                        <TextInput
                            id="pet_species"
                            className="mt-1 block w-full"
                            value={data.species}
                            onChange={(e) => setData('species', e.target.value)}
                        />
                        <InputError className="mt-2" message={errors.species} />
                    </div>

                    <div>
                        <InputLabel htmlFor="pet_breed" value="Breed" />
                        <TextInput
                            id="pet_breed"
                            className="mt-1 block w-full"
                            value={data.breed}
                            onChange={(e) => setData('breed', e.target.value)}
                        />
                        <InputError className="mt-2" message={errors.breed} />
                    </div>

                    <div>
                        <InputLabel htmlFor="pet_sex" value="Sex" />
                        <select
                            id="pet_sex"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            value={data.sex}
                            onChange={(e) => setData('sex', e.target.value)}
                        >
                            <option value="">Unknown</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="unknown">Other / unknown</option>
                        </select>
                        <InputError className="mt-2" message={errors.sex} />
                    </div>

                    <div>
                        <InputLabel htmlFor="pet_color" value="Color" />
                        <TextInput
                            id="pet_color"
                            className="mt-1 block w-full"
                            value={data.color}
                            onChange={(e) => setData('color', e.target.value)}
                        />
                        <InputError className="mt-2" message={errors.color} />
                    </div>

                    <div>
                        <InputLabel
                            htmlFor="pet_birth_date"
                            value="Birth date"
                        />
                        <TextInput
                            id="pet_birth_date"
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
                            htmlFor="pet_weight"
                            value="Weight (kg)"
                        />
                        <TextInput
                            id="pet_weight"
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

                    <div>
                        <InputLabel
                            htmlFor="pet_microchip"
                            value="Microchip number"
                        />
                        <TextInput
                            id="pet_microchip"
                            className="mt-1 block w-full"
                            value={data.microchip_number}
                            onChange={(e) =>
                                setData('microchip_number', e.target.value)
                            }
                        />
                        <InputError
                            className="mt-2"
                            message={errors.microchip_number}
                        />
                    </div>
                </div>

                <div className="mt-5">
                    <InputLabel htmlFor="pet_allergies" value="Allergies" />
                    <textarea
                        id="pet_allergies"
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        value={data.allergies}
                        onChange={(e) => setData('allergies', e.target.value)}
                    />
                    <InputError className="mt-2" message={errors.allergies} />
                </div>

                <div className="mt-5 flex items-center gap-6">
                    <label className="flex items-center gap-2">
                        <Checkbox
                            checked={data.is_neutered}
                            onChange={(e) =>
                                setData('is_neutered', e.target.checked)
                            }
                        />
                        <span className="text-sm text-gray-700">
                            Neutered / spayed
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
                        {pet ? 'Save changes' : 'Add pet'}
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
