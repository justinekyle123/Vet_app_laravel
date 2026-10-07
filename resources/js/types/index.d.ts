/** The roles a staff row can hold, matching the `staff.role` column. */
export type StaffRole = 'admin' | 'veterinarian' | 'groomer';

/**
 * Every role the console recognises. Dog owners are not staff: their accounts
 * live in their own table and report the single "owner" role.
 */
export type UserRole = 'admin' | 'owner';

export interface User {
    id: number;
    name: string;
    email: string;
    role: UserRole;
}

/**
 * A delivery the clinic logged for an owner, as the portal bell renders it.
 * The schema records the channel and delivery state, not whether it was read.
 */
export interface PortalNotification {
    id: number;
    channel: string;
    message: string;
    status: string | null;
    scheduled_at: string | null;
    sent_at: string | null;
    created_at: string | null;
}

/**
 * Shared state for the owner portal navbar. Null for guests and staff, who
 * have no notification feed of their own.
 */
export interface PortalProps {
    notifications: PortalNotification[];
    unreadNotifications: number;
}

/** One of the owner's own dogs, as the portal lists it. */
export interface PortalDog {
    id: number;
    dog_name: string;
    breed: string | null;
    sex: string | null;
    birth_date: string | null;
    is_vaccinated: boolean;
    is_active: boolean;
}

/**
 * One of the owner's own bookings. Mirrors `OwnerAppointments::present()`, so
 * the dashboard preview and the appointments page render the same record.
 */
export interface PortalAppointment {
    id: number;
    date: string | null;
    time: string | null;
    status: string | null;
    dog: string | null;
    dog_id: number | null;
    service: string | null;
    duration_minutes: number | null;
    price: string | null;
    staff: string | null;
    notes: string | null;
    /** True while the visit can still be cancelled (requested or confirmed). */
    cancellable: boolean;
}

/** A service on the clinic's active menu. */
export interface PortalService {
    id: number;
    service_name: string;
    description: string | null;
    duration_minutes: number | null;
    price: string | null;
    /** Resolved photo URL, null when the clinic has not set one. */
    image: string | null;
}

/** One published help question, as the floating FAQ button lists it. */
export interface PortalFaq {
    id: number;
    question: string;
    answer: string;
}

/** Help questions grouped under their category for the FAQ panel. */
export interface PortalFaqCategory {
    name: string;
    faqs: PortalFaq[];
}

/** Services grouped under their category for the menu page. */
export interface PortalServiceCategory {
    name: string;
    services: PortalService[];
}

/**
 * A service on the landing page, with the category the desk files it under and
 * its own picture. `image` is null when none is set, and the page falls back to
 * the clinic's own artwork.
 */
export interface PublicService extends PortalService {
    category: string;
}

/**
 * The landing page's headline numbers, counted from the clinic's own records
 * rather than written into the copy.
 */
export interface PublicStats {
    /** Dogs with at least one completed visit. */
    pets_cared_for: number;
    /** Average published rating, or null before anyone has left one. */
    rating: number | null;
    /** How many published ratings that average covers. */
    rating_count: number;
}

/**
 * A client-facing staff member on the landing page's care team. `image` is null
 * for anyone without a portrait, which the page renders as an initials
 * monogram.
 */
export interface PublicTeamMember {
    id: number;
    name: string;
    role: string;
    specialization: string | null;
    background: string | null;
    experience_years: number | null;
    qualifications: string | null;
    license_number: string | null;
    image: string | null;
}

/**
 * The clinic's own details, as the landing page and its footer render them.
 * Times are trimmed to "HH:MM" server-side so the page formats one shape.
 */
export interface PublicClinic {
    clinic_name: string;
    address_line: string;
    city: string;
    province: string;
    zip_code: string;
    contact_number: string;
    email: string;
    opening_time: string;
    closing_time: string;
    days_open: string;
}

/** One bookable time in the clinic's day. */
export interface BookingSlot {
    /** 24-hour "HH:MM", the shape the booking endpoint accepts. */
    value: string;
    /** Display form, e.g. "9:00 AM". */
    label: string;
}

/**
 * The days and times one service can be booked, as `BookingAvailability`
 * returns it. `times` is keyed by ISO date and only holds dates in `dates`.
 */
export interface ServiceAvailability {
    windowDays: number;
    dates: string[];
    times: Record<string, BookingSlot[]>;
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
    /** Shared from HandleInertiaRequests; drives the portal navbar. */
    portal?: PortalProps | null;
    /** Shared from HandleInertiaRequests; gates the Google sign-in button. */
    firebase?: {
        /** Server master switch (FIREBASE_ENABLED); false hides every surface. */
        enabled: boolean;
        /** True when the server has a project id and the browser a web config. */
        configured: boolean;
    };
};
