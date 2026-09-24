import '../css/app.css';
import './bootstrap';

import { ClerkProvider } from '@clerk/clerk-react';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

/*
 * Clerk is only mounted when a publishable key was baked in at build time AND
 * the server has not switched the integration off. Without this guard,
 * installs that have not configured Clerk would crash on boot instead of
 * falling back to the Breeze sign-in screens.
 */
const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as
    | string
    | undefined;

/** Minimal shape of the server config we read off the first Inertia page. */
interface ClerkSetupProps {
    initialPage?: { props?: unknown };
}

function withClerk(node: ReactNode, props: ClerkSetupProps): ReactNode {
    const shared = props.initialPage?.props as
        | { clerk?: { enabled?: boolean } }
        | undefined;

    /*
     * The server's CLERK_ENABLED switch is honoured here as well, so a disabled
     * install never even fetches Clerk's script instead of merely hiding the
     * components that use it.
     */
    if (!clerkPublishableKey || shared?.clerk?.enabled === false) {
        return node;
    }

    return (
        <ClerkProvider
            publishableKey={clerkPublishableKey}
            afterSignOutUrl="/"
        >
            {node}
        </ClerkProvider>
    );
}

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(withClerk(<App {...props} />, props));
    },
    progress: {
        color: '#4B5563',
    },
});
