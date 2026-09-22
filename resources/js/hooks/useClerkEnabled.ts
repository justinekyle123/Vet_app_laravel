import { PageProps } from '@/types';
import { usePage } from '@inertiajs/react';

/**
 * Clerk needs a publishable key in the browser *and* a secret key on the
 * server before its sign-in buttons lead anywhere useful. Both are shared from
 * the backend so the pages never advertise a route that cannot complete.
 */
export default function useClerkEnabled(): boolean {
    const { clerk } = usePage<PageProps>().props;

    return (
        Boolean(clerk?.configured) &&
        Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)
    );
}
