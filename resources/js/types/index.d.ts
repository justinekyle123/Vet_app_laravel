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
    profile_photo_url: string | null;
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
 * One channel the clinic accepts an online payment through, as
 * `config/payments.php` lists it. The portal renders exactly this list and the
 * server accepts nothing else.
 */
export interface PaymentMethodOption {
    /** The name recorded against the payment, e.g. "GCash". */
    name: string;
    /** One line on when a client would use it. */
    description: string;
    /** Which picture the portal draws for it. */
    icon: 'wallet' | 'card' | 'bank';
}

/**
 * Shared state for the owner portal navbar. Null for guests and staff, who
 * have no notification feed of their own.
 */
export interface PortalProps {
    notifications: PortalNotification[];
    unreadNotifications: number;
    /** The channels the portal can take a payment through. */
    paymentMethods: PaymentMethodOption[];
}

/**
 * One booking request awaiting confirmation, as the admin console bell lists
 * it. Mirrors `AdminNotifications::shared()`.
 */
export interface AdminNotification {
    id: number;
    date: string | null;
    time: string | null;
    dog: string | null;
    owner: string | null;
    service: string | null;
    status: string | null;
}

/**
 * One payment taken in the portal, as the console lists it — in the bell and on
 * the operations page, so a payment reads the same in both places. Mirrors
 * `PortalPayments::paymentSummary()`.
 */
export interface AdminPayment {
    id: number;
    amount: string;
    method: string | null;
    reference: string | null;
    proof_url: string | null;
    paid_at: string | null;
    /** True when the money arrived before the visit was due. */
    advance: boolean;
    /** Where the visit stands now this payment is on it. */
    state: SettlementState;
    price: string | null;
    paid_total: string | null;
    balance: string | null;
    owner: string | null;
    owner_id: number | null;
    dog: string | null;
    service: string | null;
    visit_on: string | null;
    visit_time: string | null;
    visit_status: string | null;
}

/**
 * Shared state for the admin console topbar. Null for guests and non-admin
 * accounts, who have no console notification feed.
 */
export interface AdminNotificationsProps {
    notifications: AdminNotification[];
    /** Payments taken in the portal, newest first. */
    payments: AdminPayment[];
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
    /** Kept so a past visit can be booked again from its own row. */
    service_id: number | null;
    duration_minutes: number | null;
    price: string | null;
    staff: string | null;
    notes: string | null;
    /** True while the owner may move the visit (requested or confirmed). */
    reschedulable: boolean;
    /** True while the portal should still offer to take a payment. */
    payable: boolean;
    /** The money on this visit: price, paid, balance, and what may be paid. */
    settlement: PortalSettlement;
    /** True for a completed visit the client has not reviewed yet. */
    reviewable: boolean;
    /** The client's own review of this visit, once they have left one. */
    feedback: PortalFeedback | null;
}

/** Where a visit stands on money: nothing taken, part of it, or settled. */
export type SettlementState = 'unpaid' | 'part' | 'paid';

/**
 * The money on one visit, as the portal shows it back. A visit can collect
 * several payments — a deposit ahead of the day, the balance at the desk — so
 * this is the settled picture rather than a single row. `last_payment.reference`
 * is the number the client's wallet or bank gave them, when they cared to add
 * it, so the desk can match the payment against its own statement.
 */
export interface PortalSettlement {
    price: string;
    paid: string;
    balance: string;
    /** Money handed back on a visit the clinic called off. */
    refunded: string;
    state: SettlementState;
    /** True while the visit is still ahead, so part of it may be paid now. */
    advance: boolean;
    last_payment: {
        method: string | null;
        amount: string;
        reference: string | null;
        paid_at: string | null;
    } | null;
}

/** An owner's rating of one completed visit, as the portal shows it back. */
export interface PortalFeedback {
    rating: number;
    comment: string | null;
    date: string | null;
}

/** The service fields the menu card and the service page both carry. */
export interface PortalServiceSummary {
    id: number;
    service_name: string;
    description: string | null;
    duration_minutes: number | null;
    price: string | null;
    /** Resolved photo URL, null when the clinic has not set one. */
    image: string | null;
    /**
     * The staff role the clinic books for this service: grooming goes to a
     * groomer, every other discipline to a veterinarian.
     */
    provider_role: 'veterinarian' | 'groomer';
    /** Average published rating, or null before anyone has rated it. */
    rating: number | null;
    /** How many published reviews that average covers. */
    rating_count: number;
}

/** A service on the clinic's active menu, with the comments its card previews. */
export interface PortalService extends PortalServiceSummary {
    /** The most recent published reviews, newest first. */
    reviews: PortalReview[];
}

/**
 * One service's rating in full, as its own page breaks it down: the spread
 * behind the average, and how many clients were happy with it.
 */
export interface ServiceSummary {
    rating: number | null;
    count: number;
    /** How many reviews gave each score, keyed 5 down to 1. */
    distribution: Record<string, number>;
    /** Share of clients who rated four stars or more; null with no reviews. */
    satisfied: number | null;
}

/**
 * A service on its own page: the shared fields, the spread behind its average,
 * and what this client's own history with it looks like.
 */
export interface PortalServiceDetail
    extends PortalServiceSummary,
        ServiceSummary {
    category: string | null;
    /** The date this client last had the service, if they ever have. */
    last_visit: string | null;
}

/** One published review of a service, as a card or its page lists it. */
export interface PortalReview {
    id: number;
    rating: number;
    comment: string | null;
    /** First name and initial only — the clinic never publishes a full name. */
    client: string | null;
    /** When the review was written. */
    date: string | null;
    /** The date of the visit it came from, so a reader can judge it. */
    visited_on: string | null;
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

/** One published question the FAQ chat offers as a next step. */
export interface FaqQuestion {
    id: number;
    question: string;
}

/** One answer the FAQ chat matched against what the client asked. */
export interface FaqMatch {
    id: number;
    question: string;
    answer: string;
    category: string | null;
    /** 0–1: how much of the client's question this answer covers. */
    score: number;
}

/**
 * What the FAQ chat sends back for one question. `found` is false when the
 * clinic has published nothing that covers it, which the panel turns into an
 * offer to raise a complaint instead.
 */
export interface FaqAnswer {
    found: boolean;
    /** The chat's own line, above the answers or in place of them. */
    reply: string;
    matches: FaqMatch[];
    suggestions: FaqQuestion[];
}

/** Opening the FAQ chat: the greeting and what the desk can answer. */
export interface FaqChatStart {
    greeting: string;
    suggestions: FaqQuestion[];
}

/** One message in a complaint thread, as the help panel renders it. */
export interface PortalComplaintMessage {
    id: number;
    body: string;
    /** True when the client wrote it rather than the clinic. */
    from_owner: boolean;
    /** True for the reader's own side of the conversation. */
    mine: boolean;
    /** Who wrote it: the client's name, or the staff member's. */
    author: string | null;
    at: string | null;
}

/** A complaint a client raised, with the conversation so far. */
export interface PortalComplaintThread {
    id: number;
    subject: string;
    description: string;
    status: string;
    priority: ComplaintPriority;
    /** True once the clinic considers the complaint finished. */
    settled: boolean;
    opened_at: string | null;
    updated_at: string | null;
    messages_count: number;
    client: string | null;
    client_id: number | null;
    appointment_id: number | null;
    visit_on: string | null;
    resolution_notes: string | null;
    assigned_to: string | null;
    messages: PortalComplaintMessage[];
}

export type ComplaintPriority = 'Low' | 'Medium' | 'High';

/** One of the client's own visits, as the complaint form offers it. */
export interface ComplaintVisitOption {
    id: number;
    label: string;
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
 *
 * The landing page shows one clinic-wide rating rather than a score per
 * service, so the per-service rating fields are not sent with it.
 */
export interface PublicService
    extends Omit<PortalServiceSummary, 'rating' | 'rating_count'> {
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
 * A client-facing staff member on the landing page's care team and in the
 * owner portal. `role` is the human-readable label and `role_value` the raw
 * role, which the portal matches against a service's `provider_role`. `image`
 * is null for anyone without a portrait, which the page renders as an initials
 * monogram.
 */
export interface PublicTeamMember {
    id: number;
    name: string;
    role: string;
    role_value: StaffRole;
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
    /** Shared from HandleInertiaRequests; drives the admin notification bell. */
    adminNotifications?: AdminNotificationsProps | null;
    /** One-shot flash messages, surfaced as SweetAlert toasts in the console. */
    flash?: {
        status: string | null;
        error: string | null;
    };
    /** Shared from HandleInertiaRequests; gates the Google sign-in button. */
    firebase?: {
        /** Server master switch (FIREBASE_ENABLED); false hides every surface. */
        enabled: boolean;
        /** True when the server has a project id and the browser a web config. */
        configured: boolean;
    };
};
