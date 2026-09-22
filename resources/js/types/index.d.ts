export type UserRole = 'admin' | 'front_desk' | 'owner';

export interface User {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    email_verified_at?: string;
}

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

/** Shape of a Laravel length-aware paginator serialized to Inertia props. */
export interface Paginated<T> {
    data: T[];
    links: PaginationLink[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
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
