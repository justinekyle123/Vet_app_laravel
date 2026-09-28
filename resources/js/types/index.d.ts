/** The roles a staff row can hold, matching the `staff.role` column. */
export type StaffRole = 'admin' | 'front_desk' | 'veterinarian' | 'groomer';

/**
 * Every role the console recognises. Dog owners are not staff: their accounts
 * live in their own table and report the single "owner" role.
 */
export type UserRole = StaffRole | 'owner';

export interface User {
    id: number;
    name: string;
    email: string;
    role: UserRole;
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
    /** Shared from HandleInertiaRequests; gates the Google sign-in button. */
    firebase?: {
        /** Server master switch (FIREBASE_ENABLED); false hides every surface. */
        enabled: boolean;
        /** True when the server has a project id and the browser a web config. */
        configured: boolean;
    };
};
