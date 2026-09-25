import { PageProps } from '@/types';
import { firebaseClientConfigured, signInWithGoogle } from '@/utils/firebase';
import { usePage } from '@inertiajs/react';
import { useCallback, useState } from 'react';

/**
 * Turns the SDK's error codes into copy a user can act on. Codes not listed
 * here fall back to whatever message the SDK gave us.
 */
function friendlyMessage(code: string | undefined, fallback: string): string {
    switch (code) {
        case 'auth/popup-closed-by-user':
        case 'auth/cancelled-popup-request':
            return 'Sign-in was cancelled. You can try again whenever you are ready.';
        case 'auth/popup-blocked':
            return 'Your browser blocked the sign-in window. Allow popups for this site and try again.';
        case 'auth/unauthorized-domain':
            return 'This domain is not authorised in the Firebase console. Add it under Authentication, Settings, Authorized domains.';
        case 'auth/operation-not-allowed':
            return 'Google sign-in is not enabled for this Firebase project yet.';
        case 'auth/network-request-failed':
            return 'Could not reach Google. Check your connection and try again.';
        default:
            return fallback;
    }
}

/**
 * Drives a Google sign-in and trades the resulting Firebase ID token for a
 * real Laravel session.
 *
 * Firebase only proves who the user is in the browser. Until the exchange
 * below runs, the server still sees a guest, so nothing protected can load.
 */
export default function useGoogleSignIn() {
    const { firebase } = usePage<PageProps>().props;

    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /*
     * Both halves are required before the button is worth showing: the server
     * needs a project id to verify against, and the browser needs a web config
     * to obtain a token. FIREBASE_ENABLED folds in on top of both.
     */
    const available =
        firebase?.enabled !== false &&
        Boolean(firebase?.configured) &&
        firebaseClientConfigured;

    const signIn = useCallback(async () => {
        if (processing) {
            return;
        }

        setProcessing(true);
        setError(null);

        try {
            const idToken = await signInWithGoogle();

            const { data } = await window.axios.post(
                route('firebase.session'),
                { id_token: idToken },
            );

            // A full navigation, not an Inertia visit, so the new session
            // cookie and every shared prop are re-read from scratch.
            window.location.assign(data?.redirect ?? '/dashboard');
        } catch (caught) {
            const response = (
                caught as {
                    response?: {
                        data?: { errors?: Record<string, string[]> };
                    };
                }
            ).response;

            setError(
                // A validation error from our own bridge wins: it is more
                // specific than anything the SDK can say.
                response?.data?.errors?.id_token?.[0] ??
                    friendlyMessage(
                        (caught as { code?: string }).code,
                        (caught as Error).message ??
                            'Could not complete sign-in. Please try again.',
                    ),
            );

            // Only reset on failure — on success the page is navigating away.
            setProcessing(false);
        }
    }, [processing]);

    return { available, processing, error, signIn };
}
