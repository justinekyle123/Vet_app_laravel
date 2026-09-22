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
        'rounded font-semibold text-brand-700 underline-offset-4 transition-colors duration-200 hover:text-brand-800 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2';

    return (
        <>
            <Head title="Log in" />

            <AuthLayout
                heading="Welcome back"
                description="Sign in to manage appointments, records and reminders for your pets."
                footer={
                    <p className="text-center text-sm text-slate-600">
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
                        className="mb-6 flex items-start gap-2.5 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800"
                    >
                        <Icon
                            name="check"
                            className="mt-0.5 h-4 w-4 shrink-0 text-brand-600"
                        />
                        <span>{status}</span>
                    </div>
                )}

                {clerkEnabled && (
                    <>
                        <Link
                            href={route('clerk.signin')}
                            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                        >
                            Continue with Clerk
                            <Icon
                                name="arrowRight"
                                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                            />
                        </Link>

                        <div className="my-6 flex items-center gap-4">
                            <span className="h-px flex-1 bg-slate-200" />
                            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                                or use your email
                            </span>
                            <span className="h-px flex-1 bg-slate-200" />
                        </div>
                    </>
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
                                className="h-4 w-4 rounded border-slate-300 text-brand-600 shadow-sm transition duration-150 focus:ring-2 focus:ring-brand-500/40 focus:ring-offset-0"
                            />
                            <span className="text-sm text-slate-600">
                                Keep me signed in
                            </span>
                        </label>

                        {canResetPassword && (
                            <Link
                                href={route('password.request')}
                                className="rounded text-sm font-medium text-brand-700 underline-offset-4 transition-colors duration-200 hover:text-brand-800 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                            >
                                Forgot password?
                            </Link>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        aria-busy={processing}
                        className="group flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-xl hover:shadow-brand-600/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-lg"
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
            </AuthLayout>
        </>
    );
}
