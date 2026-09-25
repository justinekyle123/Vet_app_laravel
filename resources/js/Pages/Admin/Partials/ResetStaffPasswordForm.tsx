import {
    primaryButtonClass,
    secondaryButtonClass,
} from '@/Components/buttonStyles';
import { fieldClass, labelClass } from '@/Components/formStyles';
import Icon from '@/Components/Icon';
import InputError from '@/Components/InputError';
import Modal from '@/Components/Modal';
import Spinner from '@/Components/Spinner';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect, useRef } from 'react';

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

    const passwordRef = useRef<HTMLInputElement>(null);

    // Start from a clean form each time the modal opens for a new person.
    useEffect(() => {
        if (show) {
            clearErrors();
            reset();
        }
    }, [show, staff?.id, clearErrors, reset]);

    /* Land on the first field so a keyboard user can type straight away. */
    useEffect(() => {
        if (!show) {
            return;
        }

        const timer = window.setTimeout(() => passwordRef.current?.focus(), 50);

        return () => window.clearTimeout(timer);
    }, [show, staff?.id]);

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
            <form onSubmit={submit} className="p-6">
                <div>
                    <h2 className="font-serif-display text-xl text-[#1a3d1a]">
                        Reset password
                    </h2>
                    <p className="mt-1.5 text-sm leading-relaxed text-[#1a3d1a]/60">
                        Set a new password for{' '}
                        <span className="font-semibold text-[#1a3d1a]">
                            {staff.name}
                        </span>{' '}
                        ({staff.email}). They can sign in with it right away.
                    </p>
                </div>

                <div className="mt-6 space-y-4">
                    <div>
                        <label htmlFor="password" className={labelClass}>
                            New password
                        </label>
                        <input
                            ref={passwordRef}
                            id="password"
                            type="password"
                            className={fieldClass}
                            value={data.password}
                            onChange={(e) =>
                                setData('password', e.target.value)
                            }
                            autoComplete="new-password"
                        />
                        <InputError
                            className="mt-2"
                            message={errors.password}
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="password_confirmation"
                            className={labelClass}
                        >
                            Confirm password
                        </label>
                        <input
                            id="password_confirmation"
                            type="password"
                            className={fieldClass}
                            value={data.password_confirmation}
                            onChange={(e) =>
                                setData(
                                    'password_confirmation',
                                    e.target.value,
                                )
                            }
                            autoComplete="new-password"
                        />
                        <InputError
                            className="mt-2"
                            message={errors.password_confirmation}
                        />
                    </div>
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
                            <Icon name="lock" className="h-4 w-4" />
                        )}
                        Reset password
                    </button>
                </div>
            </form>
        </Modal>
    );
}
