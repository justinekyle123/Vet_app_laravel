import AuthField from '@/Components/AuthField';
import Icon from '@/Components/Icon';
import Spinner from '@/Components/Spinner';
import useClerkEnabled from '@/hooks/useClerkEnabled';
import AuthLayout from '@/Layouts/AuthLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { type FormEventHandler } from 'react';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const clerkEnabled = useClerkEnabled();

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
    });

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    const linkClass =
        'rounded font-semibold text-[#E86A10] underline-offset-4 transition-colors duration-200 hover:text-[#d45e0d] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E86A10] focus-visible:ring-offset-2';

    return (
        <>
            <Head title="Log in" />

            <AuthLayout
                heading="Welcome back"
                description={
                    <>
                        <b className="font-semibold text-[#1a3d1a]">
                            Log in
                        </b>{' '}
                        to continue managing your pets&rsquo; care.
                    </>
                }
                footer={
                    <p className="text-center text-sm text-gray-600">
                        New to MyVet?{' '}
                        <Link
                            href={route(
                                clerkEnabled ? 'clerk.signup' : 'register',
                            )}
                            className={linkClass}
                        >
                            Create an account
                        </Link>
                    </p>
                }
            >
                {status && (
                    <div
                        role="status"
                        className="mb-6 flex items-start gap-2.5 rounded-2xl border border-[#2a5a2a]/20 bg-white px-4 py-3 text-sm text-[#1a3d1a]"
                    >
                        <Icon
                            name="check"
                            className="mt-0.5 h-4 w-4 shrink-0 text-[#2a5a2a]"
                        />
                        <span>{status}</span>
                    </div>
                )}

                <form onSubmit={submit} className="space-y-5">
                    <AuthField
                        label="Email address"
                        name="email"
                        type="email"
                        icon="mail"
                        autoComplete="username"
                        autoFocus
                        placeholder="you@example.com"
                        value={data.email}
                        error={errors.email}
                        onChange={(event) =>
                            setData('email', event.target.value)
                        }
                    />

                    <AuthField
                        label="Password"
                        name="password"
                        type="password"
                        icon="lock"
                        autoComplete="current-password"
                        placeholder="••••••••"
                        value={data.password}
                        error={errors.password}
                        onChange={(event) =>
                            setData('password', event.target.value)
                        }
                    />

                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <label className="flex cursor-pointer select-none items-center gap-2.5">
                            <input
                                type="checkbox"
                                name="remember"
                                checked={data.remember}
                                onChange={(event) =>
                                    setData('remember', event.target.checked)
                                }
                                className="h-4 w-4 rounded border-[#1a3d1a]/25 text-[#E86A10] shadow-sm transition duration-150 focus:ring-2 focus:ring-[#E86A10]/40 focus:ring-offset-0"
                            />
                            <span className="text-sm text-gray-600">
                                Keep me signed in
                            </span>
                        </label>

                        {canResetPassword && (
                            <Link
                                href={route('password.request')}
                                className="rounded text-sm font-medium text-[#E86A10] underline-offset-4 transition-colors duration-200 hover:text-[#d45e0d] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E86A10] focus-visible:ring-offset-2"
                            >
                                Forgot password?
                            </Link>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        aria-busy={processing}
                        className="group flex w-full items-center justify-center gap-2 rounded-full bg-[#E86A10] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#E86A10]/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#d45e0d] hover:shadow-xl hover:shadow-[#E86A10]/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E86A10] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-lg"
                    >
                        {processing ? (
                            <>
                                <Spinner />
                                Signing in…
                            </>
                        ) : (
                            <>
                                Log in
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
                            href={route('clerk.signin')}
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
