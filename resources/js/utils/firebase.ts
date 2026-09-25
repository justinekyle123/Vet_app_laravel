/**
 * Firebase Auth, browser side.
 *
 * The web config below is public by design: it identifies the Firebase project
 * to Google, it does not authorise anything on its own. Trust is established
 * server-side by verifying the ID token's signature and audience against the
 * project id, so there is nothing secret to leak here.
 */

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
    appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

/** True when a Firebase web config was baked into this build. */
export const firebaseClientConfigured = Boolean(
    firebaseConfig.apiKey &&
        firebaseConfig.authDomain &&
        firebaseConfig.projectId &&
        firebaseConfig.appId,
);

/**
 * Opens the Google account picker and resolves with a Firebase ID token for the
 * account that was chosen.
 *
 * The SDK is imported lazily: it is by far the largest dependency in the app,
 * and most page views never sign anybody in, so it is only fetched when someone
 * actually presses the button. That keeps it out of the entry chunk.
 *
 * The token is short-lived and is meant to be handed to this application's own
 * backend, which verifies it before trusting anything in it.
 */
export async function signInWithGoogle(): Promise<string> {
    if (!firebaseClientConfigured) {
        throw new Error('Firebase is not configured for this build.');
    }

    const [{ initializeApp, getApps }, { getAuth, GoogleAuthProvider, signInWithPopup }] =
        await Promise.all([import('firebase/app'), import('firebase/auth')]);

    // Reuse an app from an earlier attempt rather than registering a second one.
    const app = getApps()[0] ?? initializeApp(firebaseConfig);

    const provider = new GoogleAuthProvider();

    // Always show the account picker instead of silently reusing the last
    // Google account, which would make switching accounts impossible.
    provider.setCustomParameters({ prompt: 'select_account' });

    const credential = await signInWithPopup(getAuth(app), provider);

    return credential.user.getIdToken();
}
