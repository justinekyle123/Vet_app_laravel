import Icon from '@/Components/Icon';
import Spinner from '@/Components/Spinner';
import AuthLayout from '@/Layouts/AuthLayout';
import { SignIn, SignUp, useAuth } from '@clerk/clerk-react';
import { Head, Link } from '@inertiajs/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

interface ClerkAuthProps {
    mode: 'sign-in' | 'sign-up';
    clerkConfigured: boolean;
}

/**
 * Re-skins Clerk's prebuilt components so they sit inside the page as though
 * they were authored here: the card chrome is stripped (the layout supplies
 * it), Clerk's own heading is hidden in favour of ours, and the brand palette
 * is applied. Unknown element keys are ignored by Clerk, so this degrades
 * safely if a future SDK renames one.
 */
const clerkAppearance = {
    variables: {
        colorPrimary: '#0d9488',
        colorText: '#0f172a',
        colorTextSecondary: '#475569',
        colorBackground: '#ffffff',
        colorInputBackground: '#ffffff',
        colorInputText: '#0f172a',
        colorDanger: '#dc2626',
        borderRadius: '0.75rem',
        fontFamily: 'Figtree, ui-sans-serif, system-ui, sans-serif',
        fontSize: '0.95rem',
    },
    elements: {
        rootBox: 'w-full',
        cardBox: 'w-full shadow-none',
        card: 'w-full bg-transparent p-0 shadow-none',
        headerTitle: 'hidden',
        headerSubtitle: 'hidden',
        footerAction: 'hidden',
        dividerLine: 'bg-slate-200',
        dividerText: 'text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-400',
        formFieldLabel: 'text-sm font-medium text-slate-700',
        formFieldInput:
            'rounded-xl border-slate-300 shadow-sm focus:border-brand-500 focus:ring-brand-500/15',
        formButtonPrimary:
            'rounded-xl bg-brand-600 text-sm font-semibold normal-case shadow-lg shadow-brand-600/25 hover:bg-brand-700',
        socialButtonsBlockButton:
            'rounded-xl border-slate-300 shadow-sm hover:bg-slate-50',
        identityPreviewEditButton: 'text-brand-700',
        otpCodeFieldInput: 'rounded-xl border-slate-300',
        formResendCodeLink: 'text-brand-700',
        badge: 'bg-brand-50 text-brand-700',
    },
};

/**
 * Watches Clerk's client-side session and, the moment it becomes valid,
 * trades that Clerk token for a real Laravel session.
 *
 * Clerk only proves who the user is in the browser. Until this exchange runs,
 * the server still sees a guest, so nothing protected can load.
 */
function SessionBridge({ children }: { children: ReactNode }) {
    const { isLoaded, isSignedIn, getToken } = useAuth();
    const [isExchanging, setIsExchanging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const attemptStarted = useRef(false);

    useEffect(() => {
        if (!isLoaded || !isSignedIn || attemptStarted.current) {
            return;
        }

        attemptStarted.current = true;
        setIsExchanging(true);
        setError(null);

        const exchange = async () => {
            try {
                const token = await getToken();

                if (!token) {
                    throw new Error('Clerk did not return a session token.');
                }

                const { data } = await window.axios.post(
                    route('clerk.session'),
                    { token },
                );

                // A full navigation, not an Inertia visit, so the new session
                // cookie and every shared prop are re-read from scratch.
                window.location.assign(data?.redirect ?? '/dashboard');
            } catch (caught) {
                // Allow another attempt if the user retries.
                attemptStarted.current = false;
                setIsExchanging(false);

                const response = (
                    caught as {
                        response?: { data?: { errors?: Record<string, string[]> } };
                    }
                ).response;

                setError(
                    response?.data?.errors?.token?.[0] ??
                        (caught as Error).message ??
                        'Could not complete sign-in. Please try again.',
                );
            }
        };

        void exchange();
    }, [isLoaded, isSignedIn, getToken]);

    return (
        <>
            {children}

            {isExchanging && (
                <div
                    role="status"
                    className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800"
                >
                    <Spinner className="h-4 w-4 text-brand-600" />
                    Finishing sign-in…
                </div>
            )}

            {error && (
                <p
                    role="alert"
                    className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                    {error}
                </p>
            )}
        </>
    );
}

export default function ClerkAuth({ mode, clerkConfigured }: ClerkAuthProps) {
    /*
     * The provider is mounted in app.tsx, which is guarded by the build-time
     * Vite key. Both the server config and that key must be present before
     * Clerk components are safe to render.
     */
    const clientKeyConfigured = Boolean(
        import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
    );
    const canUseClerk = clerkConfigured && clientKeyConfigured;
    const isSignUp = mode === 'sign-up';

    const counterpart = canUseClerk
        ? route(isSignUp ? 'clerk.signin' : 'clerk.signup')
        : route(isSignUp ? 'login' : 'register');

    return (
        <>
            <Head title={isSignUp ? 'Create account' : 'Sign in'} />

            <AuthLayout
                heading={isSignUp ? 'Create your account' : 'Welcome back'}
                description={
                    isSignUp
                        ? 'One account covers every pet, visit and record.'
                        : 'Sign in to pick up where you left off.'
                }
                footer={
                    <div className="space-y-3 text-center text-sm text-slate-600">
                        <p>
                            {isSignUp
                                ? 'Already have an account? '
                                : 'New to MyVet? '}
                            <Link
                                href={counterpart}
                                className="rounded font-semibold text-brand-700 underline-offset-4 transition-colors duration-200 hover:text-brand-800 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                            >
                                {isSignUp ? 'Sign in' : 'Create an account'}
                            </Link>
                        </p>

                        {canUseClerk && (
                            <p className="text-xs text-slate-500">
                                Prefer email?{' '}
                                <Link
                                    href={
                                        isSignUp
                                            ? route('register')
                                            : route('login')
                                    }
                                    className="font-medium text-slate-600 underline underline-offset-4 transition-colors duration-200 hover:text-brand-700"
                                >
                                    {isSignUp
                                        ? 'Sign up with a password'
                                        : 'Sign in with a password'}
                                </Link>
                            </p>
                        )}
                    </div>
                }
            >
                {canUseClerk ? (
                    <SessionBridge>
                        {isSignUp ? (
                            <SignUp
                                routing="hash"
                                appearance={clerkAppearance}
                                signInUrl={route('clerk.signin')}
                                /* Clerk must not land on a protected route:
                                   the Laravel session does not exist yet, so
                                   it would bounce straight back to login.
                                   Returning here lets the bridge run first. */
                                forceRedirectUrl={route('clerk.signup')}
                            />
                        ) : (
                            <SignIn
                                routing="hash"
                                appearance={clerkAppearance}
                                signUpUrl={route('clerk.signup')}
                                forceRedirectUrl={route('clerk.signin')}
                            />
                        )}
                    </SessionBridge>
                ) : (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                        <div className="flex items-start gap-2.5">
                            <Icon
                                name="shield"
                                className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
                            />
                            <div className="text-sm text-amber-900">
                                <p className="font-semibold">
                                    Clerk is not configured yet.
                                </p>
                                <p className="mt-1 leading-relaxed">
                                    Add{' '}
                                    <code className="rounded bg-amber-100 px-1 py-0.5 text-xs">
                                        CLERK_PUBLISHABLE_KEY
                                    </code>{' '}
                                    and{' '}
                                    <code className="rounded bg-amber-100 px-1 py-0.5 text-xs">
                                        VITE_CLERK_PUBLISHABLE_KEY
                                    </code>{' '}
                                    (plus the secret key) to your .env file,
                                    then run{' '}
                                    <code className="rounded bg-amber-100 px-1 py-0.5 text-xs">
                                        npm run build
                                    </code>
                                    .
                                </p>
                            </div>
                        </div>

                        <Link
                            href={
                                isSignUp ? route('register') : route('login')
                            }
                            className="mt-4 inline-flex items-center gap-1.5 rounded text-sm font-semibold text-brand-700 underline-offset-4 transition-colors duration-200 hover:text-brand-800 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                        >
                            {isSignUp
                                ? 'Sign up with a password instead'
                                : 'Sign in with a password instead'}
                            <Icon name="arrowRight" className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                )}
            </AuthLayout>
        </>
    );
}
