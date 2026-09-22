import '../css/app.css';
import './bootstrap';

import { ClerkProvider } from '@clerk/clerk-react';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

/*
 * Clerk is only mounted when a publishable key was baked in at build time.
 * Without this guard, installs that have not configured Clerk would crash on
 * boot instead of falling back to the Breeze sign-in screens.
 */
const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as
    | string
    | undefined;

function withClerk(node: ReactNode): ReactNode {
    if (!clerkPublishableKey) {
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

        root.render(withClerk(<App {...props} />));
    },
    progress: {
        color: '#4B5563',
    },
});
