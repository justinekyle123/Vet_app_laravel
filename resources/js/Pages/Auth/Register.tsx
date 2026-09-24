import AuthField from '@/Components/AuthField';
import Icon from '@/Components/Icon';
import Spinner from '@/Components/Spinner';
import useClerkEnabled from '@/hooks/useClerkEnabled';
import AuthLayout from '@/Layouts/AuthLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { type FormEventHandler } from 'react';

const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'] as const;

/** Segment colour per score. Index 0 is unused: the meter hides when empty. */
const strengthColors = [
    'bg-red-500',
    'bg-red-500',
    'bg-amber-500',
    'bg-[#E86A10]',
    'bg-[#2a5a2a]',
];

/**
 * Advisory only. The server rule is `Password::defaults()`, which enforces a
 * minimum length of 8 and nothing else, so this must never read as a
 * requirement the form will actually reject on.
 */
function scorePassword(value: string): number {
    if (!value) {
        return 0;
    }

    let score = 0;

    if (value.length >= 8) score += 1;
    if (value.length >= 12) score += 1;
    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
    if (/\d/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;

    return Math.min(score, 4);
}

export default function Register() {
    const clerkEnabled = useClerkEnabled();

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    const score = scorePassword(data.password);

    // These two mirror the real server-side rules; nothing is invented here.
    const requirements = [
        {
            label: 'At least 8 characters',
            met: data.password.length >= 8,
        },
        {
            label: 'Both passwords match',
            met:
                data.password.length > 0 &&
                data.password === data.password_confirmation,
        },
    ];

    const linkClass =
        'rounded font-semibold text-[#E86A10] underline-offset-4 transition-colors duration-200 hover:text-[#d45e0d] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E86A10] focus-visible:ring-offset-2';

    return (
        <>
            <Head title="Create account" />

            <AuthLayout
                heading="Create your account"
                description="It takes a minute — then booking, records and reminders all live in one place."
                footer={
                    <p className="text-center text-sm text-gray-600">
                        Already registered?{' '}
                        <Link
                            href={route(
                                clerkEnabled ? 'clerk.signin' : 'login',
                            )}
                            className={linkClass}
                        >
                            Sign in
                        </Link>
                    </p>
                }
            >
                <form onSubmit={submit} className="space-y-5">
                    <AuthField
                        label="Full name"
                        name="name"
                        icon="user"
                        autoComplete="name"
                        autoFocus
                        placeholder="Alex Morgan"
                        value={data.name}
                        error={errors.name}
                        onChange={(event) =>
                            setData('name', event.target.value)
                        }
                    />

                    <AuthField
                        label="Email address"
                        name="email"
                        type="email"
                        icon="mail"
                        autoComplete="username"
                        placeholder="you@example.com"
                        value={data.email}
                        error={errors.email}
                        onChange={(event) =>
                            setData('email', event.target.value)
                        }
                    />

                    <div>
                        <AuthField
                            label="Password"
                            name="password"
                            type="password"
                            icon="lock"
                            autoComplete="new-password"
                            placeholder="••••••••"
                            value={data.password}
                            error={errors.password}
                            onChange={(event) =>
                                setData('password', event.target.value)
                            }
                        />

                        {score > 0 && (
                            <div className="mt-3">
                                <div className="flex items-center gap-1.5">
                                    {[1, 2, 3, 4].map((segment) => (
                                        <span
                                            key={segment}
                                            aria-hidden="true"
                                            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                                                segment <= score
                                                    ? strengthColors[score]
                                                    : 'bg-[#1a3d1a]/10'
                                            }`}
                                        />
                                    ))}
                                </div>
                                <p className="mt-1.5 text-xs text-gray-500">
                                    Strength:{' '}
                                    <span className="font-medium text-[#1a3d1a]">
                                        {strengthLabels[score - 1]}
                                    </span>
                                </p>
                            </div>
                        )}

                        <ul className="mt-3 space-y-1.5">
                            {requirements.map((requirement) => (
                                <li
                                    key={requirement.label}
                                    className="flex items-center gap-2 text-xs text-gray-500"
                                >
                                    <span
                                        aria-hidden="true"
                                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors duration-200 ${
                                            requirement.met
                                                ? 'border-[#1a3d1a] bg-[#1a3d1a] text-white'
                                                : 'border-[#1a3d1a]/25'
                                        }`}
                                    >
                                        {requirement.met && (
                                            <Icon
                                                name="check"
                                                className="h-2.5 w-2.5"
                                            />
                                        )}
                                    </span>
                                    {requirement.label}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <AuthField
                        label="Confirm password"
                        name="password_confirmation"
                        type="password"
                        icon="lock"
                        autoComplete="new-password"
                        placeholder="••••••••"
                        value={data.password_confirmation}
                        error={errors.password_confirmation}
                        onChange={(event) =>
                            setData(
                                'password_confirmation',
                                event.target.value,
                            )
                        }
                    />

                    <button
                        type="submit"
                        disabled={processing}
                        aria-busy={processing}
                        className="group flex w-full items-center justify-center gap-2 rounded-full bg-[#E86A10] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#E86A10]/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#d45e0d] hover:shadow-xl hover:shadow-[#E86A10]/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E86A10] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-lg"
                    >
                        {processing ? (
                            <>
                                <Spinner />
                                Creating account…
                            </>
                        ) : (
                            <>
                                Create account
                                <Icon
                                    name="arrowRight"
                                    className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                                />
                            </>
                        )}
                    </button>
                </form>

                {/* Reference order: the form and its primary action come
                    first, the alternative method sits below the divider. */}
                {clerkEnabled && (
                    <>
                        <div className="my-6 flex items-center gap-4">
                            <span className="h-px flex-1 bg-[#1a3d1a]/10" />
                            <span className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#1a3d1a]/40">
                                OR
                            </span>
                            <span className="h-px flex-1 bg-[#1a3d1a]/10" />
                        </div>

                        <Link
                            href={route('clerk.signup')}
                            className="group flex w-full items-center justify-center gap-2 rounded-full border border-[#1a3d1a]/20 bg-white px-4 py-3 text-sm font-semibold text-[#1a3d1a] transition-colors duration-200 hover:bg-[#EFFDF0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a] focus-visible:ring-offset-2"
                        >
                            Continue with Clerk
                            <Icon
                                name="arrowRight"
                                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                            />
                        </Link>
                    </>
                )}
            </AuthLayout>
        </>
    );
}
