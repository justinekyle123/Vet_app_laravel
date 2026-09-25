import { fieldClass, labelClass, textAreaClass } from '@/Components/formStyles';
import InputError from '@/Components/InputError';
import { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

/**
 * A labelled brand field with its validation message underneath, so console
 * forms do not each rebuild the label / input / error stack.
 */
export default function Field({
    label,
    name,
    error,
    hint,
    className = '',
    ...props
}: InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    name: string;
    error?: string;
    /** Guidance shown until the field fails validation. */
    hint?: string;
}) {
    return (
        <div className="min-w-0">
            <label htmlFor={name} className={labelClass}>
                {label}
            </label>
            <input
                {...props}
                id={name}
                name={name}
                aria-invalid={error ? true : undefined}
                className={`${fieldClass} ${className}`}
            />
            {hint && !error && (
                <p className="mt-1.5 text-xs text-[#1a3d1a]/45">{hint}</p>
            )}
            <InputError className="mt-2" message={error} />
        </div>
    );
}

/** The same treatment for a multi-line field. */
export function TextAreaField({
    label,
    name,
    error,
    hint,
    className = '',
    ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label: string;
    name: string;
    error?: string;
    hint?: string;
}) {
    return (
        <div className="min-w-0">
            <label htmlFor={name} className={labelClass}>
                {label}
            </label>
            <textarea
                {...props}
                id={name}
                name={name}
                aria-invalid={error ? true : undefined}
                className={`${textAreaClass} ${className}`}
            />
            {hint && !error && (
                <p className="mt-1.5 text-xs text-[#1a3d1a]/45">{hint}</p>
            )}
            <InputError className="mt-2" message={error} />
        </div>
    );
}
