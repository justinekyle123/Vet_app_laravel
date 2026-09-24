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
 * Shared field styling for Clerk's inputs.
 *
 * Clerk paints a field's resting outline with a 1px box-shadow ring tinted by
 * `colorNeutral`, and pins inputs to `max-height: 2.25rem`. So instead of
 * fighting its cascade with a border (a silent no-op here), we let that ring
 * stand in for `AuthField`'s border and simply pass our brand green as
 * `colorNeutral`. `max-h-none` and `leading-6` are load-bearing: without them
 * the shared `py-3` is squeezed into a 10px content box and clips the text.
 */
const fieldBase =
    'w-full max-h-none rounded-2xl px-4 py-3 text-[0.95rem] leading-6 text-[#1a3d1a] transition-shadow duration-200 placeholder:text-[#1a3d1a]/35 focus:border-[#1a3d1a] focus:ring-4 focus:ring-[#1a3d1a]/15 focus:outline-none';

/** Shared pill button styling, mirroring the Breeze sign-in/register buttons. */
const buttonBase =
    'rounded-full px-4 py-3 text-sm font-semibold normal-case transition-colors duration-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60';

/**
 * Re-skins Clerk's prebuilt components so they sit inside the page as though
 * they were authored here: the card chrome is stripped (the layout supplies
 * it), Clerk's own heading is hidden in favour of ours, and the brand palette
 * is applied. Unknown element keys are ignored by Clerk, so this degrades
 * safely if a future SDK renames one.
 *
 * The `formHeader*` elements are deliberately left visible: Clerk reuses them
 * for the follow-up steps in a flow (email verification, password reset, MFA),
 * where our static page heading no longer describes what is being asked.
 */
const clerkAppearance = {
    variables: {
        colorPrimary: '#E86A10',
        colorPrimaryForeground: '#ffffff',
        colorText: '#1a3d1a',
        colorTextSecondary: '#4b5563',
        colorBackground: '#ffffff',
        colorInputBackground: '#ffffff',
        colorInputText: '#1a3d1a',
        colorDanger: '#dc2626',
        colorSuccess: '#2a5a2a',
        colorWarning: '#E86A10',
        colorRing: 'rgba(26, 61, 26, 0.15)',
        /* Drives the resting 1px ring around inputs; without it Clerk tints
           its fields near-black instead of the brand green. */
        colorNeutral: '#1a3d1a',
        borderRadius: '1rem',
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
        fontSize: '0.95rem',
    },
    /*
     * Block buttons placed under the form match the "Continue with Clerk"
     * treatment on the password screens; the logo is dropped so our own brand
     * row in the layout stays the single source of identity.
     */
    layout: {
        socialButtonsVariant: 'blockButton',
        socialButtonsPlacement: 'bottom',
        logoPlacement: 'none',
    } as const,
    elements: {
        rootBox: 'w-full',
        cardBox: 'w-full shadow-none',
        card: 'w-full bg-transparent p-0 shadow-none',
        main: 'w-full',
        logoBox: 'hidden',
        logoImage: 'hidden',
        headerTitle: 'hidden',
        headerSubtitle: 'hidden',
        formHeaderTitle:
            'font-serif-display text-2xl tracking-tight text-[#1a3d1a]',
        formHeaderSubtitle: 'text-sm leading-relaxed text-gray-600',
        footer: 'hidden',
        footerAction: 'hidden',
        dividerRow: 'my-6',
        dividerLine: 'bg-[#1a3d1a]/10',
        dividerText:
            'text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#1a3d1a]/40',
        formFieldLabel: 'text-sm font-medium text-gray-700',
        formFieldInput: fieldBase,
        /* The password field is rendered inside this group (for the reveal
           button), so it needs to fill the row like every other field. */
        formFieldInputGroup: 'w-full',
        formFieldInputShowPasswordButton: 'text-[#1a3d1a]/40 hover:text-[#1a3d1a]',
        formFieldErrorText: 'mt-1.5 text-sm text-red-600',
        formFieldHintText: 'mt-1.5 text-xs text-gray-500',
        formButtonPrimary: `${buttonBase} bg-[#E86A10] text-white shadow-lg shadow-[#E86A10]/25 hover:bg-[#d45e0d] focus-visible:ring-2 focus-visible:ring-[#E86A10] focus-visible:ring-offset-2`,
        formButtonReset: `${buttonBase} text-[#E86A10] hover:text-[#d45e0d]`,
        formResendCodeLink:
            'font-medium text-[#E86A10] transition-colors duration-200 hover:text-[#d45e0d]',
        socialButtonsBlockButton: `rounded-full border border-[#1a3d1a]/20 bg-white px-4 py-3 normal-case shadow-none transition-colors duration-200 hover:bg-[#EFFDF0] focus-visible:ring-2 focus-visible:ring-[#1a3d1a] focus-visible:ring-offset-2`,
        socialButtonsBlockButtonText: 'text-sm font-semibold text-[#1a3d1a]',
        socialButtonsIconButton:
            'rounded-2xl border-[#1a3d1a]/15 shadow-sm hover:bg-[#EFFDF0]',
        alternativeMethodsBlockButton:
            'rounded-full border border-[#1a3d1a]/20 bg-white px-4 py-3 normal-case shadow-none transition-colors duration-200 hover:bg-[#EFFDF0]',
        alternativeMethodsBlockButtonText: 'text-sm font-semibold text-[#1a3d1a]',
        otpCodeField: 'justify-center',
        otpCodeFieldInput:
            'rounded-2xl border-[#1a3d1a]/15 text-[#1a3d1a] shadow-sm focus:border-[#1a3d1a] focus:ring-4 focus:ring-[#1a3d1a]/15',
        identityPreview:
            'rounded-2xl border border-[#1a3d1a]/15 bg-[#EFFDF0] px-4 py-3',
        identityPreviewText: 'text-sm font-medium text-[#1a3d1a]',
        identityPreviewEditButton:
            'font-medium text-[#E86A10] transition-colors duration-200 hover:text-[#d45e0d]',
        alert: 'rounded-2xl border border-red-200 bg-red-50 px-4 py-3',
        alertText: 'text-sm text-red-700',
        badge: 'bg-[#EFFDF0] text-[#1a3d1a]',
    },
};

/**
 * Placeholder rendered by Clerk until its JS is ready. Matching the real
 * field rhythm keeps the card from jumping when the form mounts.
 */
function ClerkFormSkeleton() {
    return (
        <div>
            <span role="status" className="sr-only">
                Loading secure sign-in…
            </span>

            {/* `h-12` fields and an `h-11` button match the measured heights of
                Clerk's inputs and the primary button, so nothing shifts when
                the real form mounts. */}
            <div aria-hidden="true" className="animate-pulse space-y-5">
                {[0, 1].map((row) => (
                    <div key={row} className="space-y-2">
                        <div className="h-4 w-24 rounded-full bg-[#1a3d1a]/10" />
                        <div className="h-12 w-full rounded-2xl bg-[#1a3d1a]/5" />
                    </div>
                ))}

                <div className="h-11 w-full rounded-full bg-[#E86A10]/20" />
            </div>
        </div>
    );
}

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
                    className="mt-5 flex items-center justify-center gap-2.5 rounded-2xl border border-[#2a5a2a]/20 bg-[#EFFDF0] px-4 py-3 text-sm font-medium text-[#1a3d1a]"
                >
                    <Spinner className="h-4 w-4 text-[#2a5a2a]" />
                    Finishing sign-in…
                </div>
            )}

            {error && (
                <div
                    role="alert"
                    className="mt-5 flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                    <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                        <p className="font-semibold">
                            We couldn&rsquo;t finish signing you in.
                        </p>
                        <p className="mt-0.5 leading-relaxed">{error}</p>
                    </div>
                </div>
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
                    <div className="space-y-3 text-center text-sm text-gray-600">
                        <p>
                            {isSignUp
                                ? 'Already have an account? '
                                : 'New to MyVet? '}
                            <Link
                                href={counterpart}
                                className="rounded font-semibold text-[#E86A10] underline-offset-4 transition-colors duration-200 hover:text-[#d45e0d] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E86A10] focus-visible:ring-offset-2"
                            >
                                {isSignUp ? 'Sign in' : 'Create an account'}
                            </Link>
                        </p>

                        {canUseClerk && (
                            <p className="text-xs text-gray-500">
                                Prefer email?{' '}
                                <Link
                                    href={
                                        isSignUp
                                            ? route('register')
                                            : route('login')
                                    }
                                    className="font-medium text-gray-600 underline underline-offset-4 transition-colors duration-200 hover:text-[#E86A10]"
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
                    <>
                        <SessionBridge>
                            {isSignUp ? (
                                <SignUp
                                    routing="hash"
                                    appearance={clerkAppearance}
                                    fallback={<ClerkFormSkeleton />}
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
                                    fallback={<ClerkFormSkeleton />}
                                    signUpUrl={route('clerk.signup')}
                                    forceRedirectUrl={route('clerk.signin')}
                                />
                            )}
                        </SessionBridge>

                        {/* Clerk owns the credential, so users never hand a
                            password to this application — worth saying plainly. */}
                        <div className="mt-6 flex items-start justify-center gap-2 rounded-2xl bg-[#EFFDF0] px-4 py-3 text-center text-xs leading-relaxed text-[#1a3d1a]/70">
                            <Icon
                                name="lock"
                                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2a5a2a]"
                            />
                            <span>
                                Secured by Clerk. Your password is never stored
                                on our servers.
                            </span>
                        </div>
                    </>
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
                            className="mt-4 inline-flex items-center gap-1.5 rounded text-sm font-semibold text-[#1a3d1a] underline-offset-4 transition-colors duration-200 hover:text-[#E86A10] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a] focus-visible:ring-offset-2"
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
