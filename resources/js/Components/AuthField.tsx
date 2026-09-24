import Icon, { type IconName } from '@/Components/Icon';
import { type InputHTMLAttributes, useState } from 'react';

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
    name: string;
    label: string;
    /** Server-side validation message for this field. */
    error?: string;
    /** Leading adornment, e.g. a mail or lock glyph. */
    icon?: IconName;
}

/**
 * Labelled input used across the auth screens.
 *
 * Deliberately separate from the shared `TextInput`, whose indigo focus
 * styling is baked in and — because same-specificity Tailwind utilities are
 * resolved by stylesheet order, not class order — cannot be reliably
 * overridden from the outside.
 */
export default function AuthField({
    label,
    name,
    error,
    icon,
    id,
    className = '',
    type = 'text',
    ...props
}: AuthFieldProps) {
    const fieldId = id ?? name.replace(/[^a-z0-9]+/gi, '-');
    const errorId = `${fieldId}-error`;
    const [revealed, setRevealed] = useState(false);

    const isPassword = type === 'password';
    const resolvedType = isPassword && revealed ? 'text' : type;

    return (
        <div className={className}>
            <label
                htmlFor={fieldId}
                className="block text-sm font-medium text-gray-700"
            >
                {label}
            </label>

            <div className="group relative mt-1.5">
                {icon && (
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#1a3d1a]/40 transition-colors duration-200 group-focus-within:text-[#1a3d1a]">
                        <Icon name={icon} className="h-5 w-5" />
                    </span>
                )}

                <input
                    {...props}
                    id={fieldId}
                    name={name}
                    type={resolvedType}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? errorId : undefined}
                    className={`block w-full rounded-2xl border bg-white py-3 text-[0.95rem] text-[#1a3d1a] shadow-sm transition-[border-color,box-shadow] duration-200 placeholder:text-[#1a3d1a]/35 focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:bg-[#EFFDF0] ${
                        icon ? 'pl-11' : 'pl-4'
                    } ${isPassword ? 'pr-12' : 'pr-4'} ${
                        error
                            ? 'border-red-400 focus:border-red-500 focus:ring-red-500/15'
                            : 'border-[#1a3d1a]/15 focus:border-[#1a3d1a] focus:ring-[#1a3d1a]/15'
                    }`}
                />

                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setRevealed((value) => !value)}
                        aria-pressed={revealed}
                        aria-label={revealed ? 'Hide password' : 'Show password'}
                        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-2xl text-[#1a3d1a]/40 transition-colors duration-200 hover:text-[#1a3d1a] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1a3d1a]"
                    >
                        <Icon
                            name={revealed ? 'eyeSlash' : 'eye'}
                            className="h-5 w-5"
                        />
                    </button>
                )}
            </div>

            {error && (
                <p id={errorId} role="alert" className="mt-1.5 text-sm text-red-600">
                    {error}
                </p>
            )}
        </div>
    );
}
