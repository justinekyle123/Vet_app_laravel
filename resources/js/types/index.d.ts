export type UserRole = 'admin' | 'front_desk' | 'owner';

export interface User {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    email_verified_at?: string;
}

export type PageProps<
    T extends Record<string, unknown> = Record<string, unknown>,
> = T & {
    auth: {
        user: User;
    };
    /** Shared from HandleInertiaRequests; gates the Clerk sign-in buttons. */
    clerk?: {
        configured: boolean;
    };
};
