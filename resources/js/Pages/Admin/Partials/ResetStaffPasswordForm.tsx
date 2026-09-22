import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect } from 'react';

export interface StaffMember {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'front_desk';
}

export default function ResetStaffPasswordForm({
    staff,
    show,
    onClose,
}: {
    staff: StaffMember | null;
    show: boolean;
    onClose: () => void;
}) {
    const { data, setData, patch, processing, errors, reset, clearErrors } =
        useForm({
            password: '',
            password_confirmation: '',
        });

    // Start from a clean form each time the modal opens for a new person.
    useEffect(() => {
        if (show) {
            clearErrors();
            reset();
        }
    }, [show, staff?.id, clearErrors, reset]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        if (!staff) {
            return;
        }

        patch(route('admin.staff.password', staff.id), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    if (!staff) {
        return null;
    }

    return (
        <Modal show={show} onClose={onClose} maxWidth="md">
            <form onSubmit={submit} className="space-y-6 p-6">
                <div>
                    <h2 className="text-lg font-medium text-gray-900">
                        Reset password
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">
                        Set a new password for{' '}
                        <span className="font-medium text-gray-800">
                            {staff.name}
                        </span>{' '}
                        ({staff.email}). They can sign in with it right away.
                    </p>
                </div>

                <div>
                    <InputLabel htmlFor="password" value="New password" />
                    <TextInput
                        id="password"
                        type="password"
                        className="mt-1 block w-full"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        isFocused
                        autoComplete="new-password"
                    />
                    <InputError className="mt-2" message={errors.password} />
                </div>

                <div>
                    <InputLabel
                        htmlFor="password_confirmation"
                        value="Confirm password"
                    />
                    <TextInput
                        id="password_confirmation"
                        type="password"
                        className="mt-1 block w-full"
                        value={data.password_confirmation}
                        onChange={(e) =>
                            setData('password_confirmation', e.target.value)
                        }
                        autoComplete="new-password"
                    />
                    <InputError
                        className="mt-2"
                        message={errors.password_confirmation}
                    />
                </div>

                <div className="flex justify-end gap-3">
                    <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
                    <PrimaryButton disabled={processing}>
                        Reset password
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
