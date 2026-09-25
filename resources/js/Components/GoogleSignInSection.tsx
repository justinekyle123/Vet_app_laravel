import GoogleMark from '@/Components/GoogleMark';
import Icon from '@/Components/Icon';
import Spinner from '@/Components/Spinner';
import useGoogleSignIn from '@/hooks/useGoogleSignIn';

/**
 * The alternative sign-in block shared by the login and register screens.
 *
 * Reference order on both pages: the password form and its primary action come
 * first, and the alternative method sits below the divider. Renders nothing at
 * all when Firebase is not configured, so the pages never advertise a route
 * that cannot complete.
 */
export default function GoogleSignInSection() {
    const { available, processing, error, signIn } = useGoogleSignIn();

    if (!available) {
        return null;
    }

    return (
        <div>
            <div className="my-6 flex items-center gap-4">
                <span className="h-px flex-1 bg-[#1a3d1a]/10" />
                <span className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#1a3d1a]/40">
                    OR
                </span>
                <span className="h-px flex-1 bg-[#1a3d1a]/10" />
            </div>

            <button
                type="button"
                onClick={signIn}
                disabled={processing}
                aria-busy={processing}
                className="group flex w-full items-center justify-center gap-2.5 rounded-full border border-[#1a3d1a]/20 bg-white px-4 py-3 text-sm font-semibold text-[#1a3d1a] transition-colors duration-200 hover:bg-[#EFFDF0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {processing ? (
                    <Spinner className="h-4 w-4" />
                ) : (
                    <GoogleMark className="h-4 w-4" />
                )}
                {processing ? 'Connecting to Google…' : 'Continue with Google'}
            </button>

            {error && (
                <div
                    role="alert"
                    className="mt-4 flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
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

            <p className="mt-4 flex items-start justify-center gap-2 rounded-2xl bg-[#EFFDF0] px-4 py-3 text-center text-xs leading-relaxed text-[#1a3d1a]/70">
                <Icon
                    name="lock"
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2a5a2a]"
                />
                <span>
                    Google verifies who you are. Your password is never stored on
                    our servers.
                </span>
            </p>
        </div>
    );
}
