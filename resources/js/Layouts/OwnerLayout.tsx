import Spinner from '@/Components/Spinner';
import {
    PageProps,
    PortalFaqCategory,
    PortalNotification,
    User,
} from '@/types';
import { initials } from '@/utils/format';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Bell,
    CheckCheck,
    ChevronDown,
    HelpCircle,
    LogOut,
    Menu,
    PawPrint,
    Search,
    User as UserIcon,
    X,
} from 'lucide-react';
import {
    PropsWithChildren,
    ReactNode,
    RefObject,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';

/**
 * The dog owner portal's chrome.
 *
 * Deliberately the landing page's own header rather than the staff console's
 * sidebar: clients should recognise the site they signed up on. Same mint
 * surface, serif wordmark, and orange accents, with the client's own data wired
 * into the search box, the notification bell, and the account menu.
 */

interface NavItem {
    label: string;
    href: string;
    /** Ziggy pattern compared against the current route name. */
    pattern: string;
}

interface SearchRow {
    id: number;
    label: string;
    meta: string;
    href: string;
}

interface SearchGroups {
    dogs: SearchRow[];
    appointments: SearchRow[];
    services: SearchRow[];
}

/** The groups the navbar search can match, in the order they render. */
const SEARCH_SECTIONS: { key: keyof SearchGroups; title: string }[] = [
    { key: 'dogs', title: 'My dogs' },
    { key: 'appointments', title: 'Appointments' },
    { key: 'services', title: 'Services' },
];

/**
 * Closes a dropdown when the pointer lands outside it or Escape is pressed.
 * Returns the ref to hang on the dropdown's wrapper, which must contain both
 * the trigger and the panel.
 */
function useDismiss<T extends HTMLElement>(open: boolean, close: () => void) {
    const ref = useRef<T>(null);
    // Held in a ref so the listeners only re-subscribe when `open` flips.
    const closeRef = useRef(close);
    closeRef.current = close;

    useEffect(() => {
        if (!open) {
            return;
        }

        const handlePointerDown = (event: MouseEvent) => {
            if (!ref.current?.contains(event.target as Node)) {
                closeRef.current();
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                closeRef.current();
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [open]);

    return ref;
}

/** Compact date and time for the notification feed. */
function shortDateTime(iso: string | null): string {
    if (!iso) {
        return '';
    }

    const date = new Date(iso);

    return Number.isNaN(date.getTime())
        ? ''
        : date.toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
          });
}

/**
 * The navbar's search panel, dressed the same as the landing page's own
 * search: a single row for the query, then the matches grouped by what they
 * are, each with a title and a supporting line. The matches are fetched
 * server-side and scoped to the signed-in owner.
 */
function SearchPanel({
    query,
    onQueryChange,
    groups,
    loading,
    onClose,
    inputRef,
}: {
    query: string;
    onQueryChange: (value: string) => void;
    groups: SearchGroups | null;
    loading: boolean;
    onClose: () => void;
    inputRef: RefObject<HTMLInputElement>;
}) {
    const term = query.trim();

    const sections = groups
        ? SEARCH_SECTIONS.map((section) => ({
              title: section.title,
              items: groups[section.key],
          })).filter((section) => section.items.length > 0)
        : [];

    return (
        <div
            id="portal-search"
            className="absolute inset-x-0 top-full z-40 animate-dropdown px-4 pt-1 sm:px-6 lg:px-8"
        >
            <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-[#1a3d1a]/10 bg-white shadow-2xl shadow-[#1a3d1a]/10">
                <div className="flex items-center gap-3 border-b border-[#1a3d1a]/10 px-4">
                    <Search className="h-4 w-4 shrink-0 text-[#1a3d1a]/40" />
                    <label htmlFor="portal-search-input" className="sr-only">
                        Search
                    </label>
                    <input
                        ref={inputRef}
                        id="portal-search-input"
                        type="search"
                        value={query}
                        autoComplete="off"
                        placeholder="Search dogs, visits, services"
                        onChange={(event) =>
                            onQueryChange(event.target.value)
                        }
                        className="w-full border-0 bg-transparent py-3.5 text-sm text-[#1a3d1a] placeholder:text-[#1a3d1a]/40 focus:outline-none focus:ring-0"
                    />
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close search"
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#1a3d1a]/50 transition-colors duration-200 hover:bg-[#EFFDF0] hover:text-[#1a3d1a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {term.length < 2 ? (
                    <p className="px-5 py-6 text-sm leading-relaxed text-[#1a3d1a]/55">
                        Type at least two letters to search your dogs, your
                        visits, and the clinic's services.
                    </p>
                ) : sections.length > 0 ? (
                    <div className="max-h-[60vh] overflow-y-auto p-2">
                        {sections.map((section) => (
                            <div key={section.title} className="py-1">
                                <p className="px-3 pb-1 pt-2 text-[0.66rem] font-bold uppercase tracking-[0.14em] text-[#1a3d1a]/40">
                                    {section.title}
                                </p>
                                <ul>
                                    {section.items.map((row) => (
                                        <li
                                            key={`${section.title}-${row.id}`}
                                        >
                                            <Link
                                                href={row.href}
                                                onClick={onClose}
                                                className="group flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors duration-150 hover:bg-[#EFFDF0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]"
                                            >
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate text-sm font-medium text-[#1a3d1a]">
                                                        {row.label}
                                                    </span>
                                                    {row.meta && (
                                                        <span className="mt-0.5 block truncate text-xs text-[#1a3d1a]/55">
                                                            {row.meta}
                                                        </span>
                                                    )}
                                                </span>
                                                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-[#1a3d1a]/25 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-[#1a3d1a]/60" />
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="px-5 py-6 text-sm text-[#1a3d1a]/55">
                        {loading
                            ? 'Searching…'
                            : `No matches for “${term}”.`}
                    </p>
                )}
            </div>
        </div>
    );
}

/**
 * The clinic's message feed. The schema records delivery, not whether the owner
 * has read a message, so the badge counts what arrived since this browser last
 * opened the bell and "mark all as read" moves that bookmark.
 */
function NotificationBell({
    notifications,
    unread,
}: {
    notifications: PortalNotification[];
    unread: number;
}) {
    const [open, setOpen] = useState(false);

    const close = useCallback(() => setOpen(false), []);
    const wrapperRef = useDismiss<HTMLDivElement>(open, close);

    const markAllRead = () => {
        router.patch(
            route('owner.notifications.read'),
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: close,
            },
        );
    };

    return (
        <div ref={wrapperRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-label={
                    unread > 0
                        ? `Notifications, ${unread} unread`
                        : 'Notifications'
                }
                aria-expanded={open}
                className="relative flex h-11 w-11 items-center justify-center rounded-full border border-[#1a3d1a]/15 bg-white text-[#1a3d1a] transition-colors duration-200 hover:bg-[#EFFDF0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]"
            >
                <Bell className="h-5 w-5" />
                {unread > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#E86A10] px-1 text-[0.64rem] font-semibold text-white ring-2 ring-white">
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-full z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] animate-dropdown overflow-hidden rounded-2xl border border-[#1a3d1a]/10 bg-white shadow-2xl shadow-[#1a3d1a]/10">
                    <div className="flex items-center justify-between gap-3 border-b border-[#1a3d1a]/10 px-5 py-3.5">
                        <h2 className="text-sm font-semibold text-[#1a3d1a]">
                            Notifications
                        </h2>
                        {unread > 0 && (
                            <span className="rounded-full bg-[#E86A10]/10 px-2.5 py-1 text-[0.68rem] font-semibold text-[#E86A10]">
                                {unread} new
                            </span>
                        )}
                    </div>

                    {notifications.length === 0 ? (
                        <p className="px-5 py-6 text-sm leading-relaxed text-[#1a3d1a]/55">
                            Nothing yet. Messages from the clinic will appear
                            here.
                        </p>
                    ) : (
                        <ul className="max-h-[60vh] divide-y divide-[#1a3d1a]/5 overflow-y-auto">
                            {notifications.map((notification) => (
                                <li
                                    key={notification.id}
                                    className="px-5 py-3.5"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="rounded-full bg-[#EFFDF0] px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-[#1a3d1a]/70">
                                            {notification.channel}
                                        </span>
                                        <span className="text-[0.68rem] text-[#1a3d1a]/45">
                                            {shortDateTime(
                                                notification.sent_at ??
                                                    notification.created_at,
                                            )}
                                        </span>
                                    </div>
                                    <p className="mt-1.5 text-sm leading-relaxed text-[#1a3d1a]">
                                        {notification.message}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    )}

                    {unread > 0 && (
                        <div className="border-t border-[#1a3d1a]/10 p-2">
                            <button
                                type="button"
                                onClick={markAllRead}
                                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#1a3d1a] transition-colors duration-150 hover:bg-[#EFFDF0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]"
                            >
                                <CheckCheck className="h-4 w-4 text-[#1a3d1a]/50" />
                                Mark all as read
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/** The circular avatar and its dropdown: account, profile, and sign out. */
function AccountMenu({ user }: { user: User }) {
    const [open, setOpen] = useState(false);

    const close = useCallback(() => setOpen(false), []);
    const wrapperRef = useDismiss<HTMLDivElement>(open, close);

    const itemClass =
        'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-[#1a3d1a] transition-colors duration-150 hover:bg-[#EFFDF0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]';

    return (
        <div ref={wrapperRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-label="Account menu"
                aria-expanded={open}
                className="flex items-center gap-2 rounded-full border border-[#1a3d1a]/15 bg-white py-1.5 pl-1.5 pr-2.5 transition-colors duration-200 hover:bg-[#EFFDF0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]"
            >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a3d1a] text-xs font-semibold text-white">
                    {initials(user.name)}
                </span>
                <ChevronDown
                    className={`h-4 w-4 text-[#1a3d1a]/40 transition-transform duration-200 ${
                        open ? 'rotate-180' : ''
                    }`}
                />
            </button>

            {open && (
                <div className="absolute right-0 top-full z-40 mt-2 w-64 animate-dropdown overflow-hidden rounded-2xl border border-[#1a3d1a]/10 bg-white p-1.5 shadow-2xl shadow-[#1a3d1a]/10">
                    <div className="flex items-center gap-3 px-3 py-2.5">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1a3d1a] text-sm font-semibold text-white">
                            {initials(user.name)}
                        </span>
                        <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-[#1a3d1a]">
                                {user.name}
                            </span>
                            <span className="block truncate text-xs text-[#1a3d1a]/55">
                                {user.email}
                            </span>
                        </span>
                    </div>

                    <div className="my-1 h-px bg-[#1a3d1a]/10" />

                    <Link
                        href={route('owner.account.edit')}
                        onClick={close}
                        className={itemClass}
                    >
                        <PawPrint className="h-4 w-4 text-[#1a3d1a]/50" />
                        My account &amp; dogs
                    </Link>
                    <Link
                        href={route('profile.edit')}
                        onClick={close}
                        className={itemClass}
                    >
                        <UserIcon className="h-4 w-4 text-[#1a3d1a]/50" />
                        Profile &amp; password
                    </Link>

                    <div className="my-1 h-px bg-[#1a3d1a]/10" />

                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-[#b3261e] transition-colors duration-150 hover:bg-[#b3261e]/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b3261e]"
                    >
                        <LogOut className="h-4 w-4 text-[#b3261e]/60" />
                        Log out
                    </Link>
                </div>
            )}
        </div>
    );
}

/**
 * The floating help button, pinned to the bottom-right of every portal page.
 * Opening it lazily loads the clinic's published questions — grouped the way
 * the front desk files them — and each one expands in place.
 */
function FaqButton() {
    const [open, setOpen] = useState(false);
    const [categories, setCategories] = useState<PortalFaqCategory[] | null>(
        null,
    );
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState<number | null>(null);

    /* Load the questions the first time the panel is opened. */
    useEffect(() => {
        if (!open || categories !== null) {
            return;
        }

        let cancelled = false;
        setLoading(true);

        fetch(route('owner.faqs'), {
            headers: { Accept: 'application/json' },
            credentials: 'same-origin',
        })
            .then(
                (response) =>
                    response.json() as Promise<{
                        categories: PortalFaqCategory[];
                    }>,
            )
            .then((data) => {
                if (!cancelled) {
                    setCategories(data.categories);
                }
            })
            .catch(() => {
                // A failed load is just an empty panel; the button still closes.
                if (!cancelled) {
                    setCategories([]);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [open, categories]);

    /* Escape closes the panel, like the header's own dropdowns. */
    useEffect(() => {
        if (!open) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open]);

    return (
        <div className="fixed bottom-5 right-4 z-40 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
            {open && (
                <div
                    id="portal-faq"
                    className="w-[min(24rem,calc(100vw-2rem))] animate-dropdown overflow-hidden rounded-2xl border border-[#1a3d1a]/10 bg-white shadow-2xl shadow-[#1a3d1a]/15"
                >
                    <div className="flex items-center justify-between gap-3 border-b border-[#1a3d1a]/10 bg-[#EFFDF0]/70 px-5 py-3.5">
                        <h2 className="text-sm font-semibold text-[#1a3d1a]">
                            Frequently asked questions
                        </h2>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            aria-label="Close FAQs"
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#1a3d1a]/50 transition-colors duration-200 hover:bg-white hover:text-[#1a3d1a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto p-2">
                        {loading && categories === null ? (
                            <p className="flex items-center gap-2 px-4 py-6 text-sm text-[#1a3d1a]/55">
                                <Spinner className="h-4 w-4" />
                                Loading questions…
                            </p>
                        ) : categories && categories.length > 0 ? (
                            categories.map((category) => (
                                <div key={category.name} className="py-1">
                                    <p className="px-3 pb-1 pt-2 text-[0.66rem] font-bold uppercase tracking-[0.14em] text-[#1a3d1a]/40">
                                        {category.name}
                                    </p>
                                    <ul>
                                        {category.faqs.map((faq) => (
                                            <li key={faq.id}>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setExpanded(
                                                            (current) =>
                                                                current ===
                                                                faq.id
                                                                    ? null
                                                                    : faq.id,
                                                        )
                                                    }
                                                    aria-expanded={
                                                        expanded === faq.id
                                                    }
                                                    className="flex w-full items-start justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-150 hover:bg-[#EFFDF0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]"
                                                >
                                                    <span className="text-sm font-medium text-[#1a3d1a]">
                                                        {faq.question}
                                                    </span>
                                                    <ChevronDown
                                                        className={`mt-0.5 h-4 w-4 shrink-0 text-[#1a3d1a]/40 transition-transform duration-200 ${
                                                            expanded === faq.id
                                                                ? 'rotate-180'
                                                                : ''
                                                        }`}
                                                    />
                                                </button>
                                                {expanded === faq.id && (
                                                    <p className="px-3 pb-3 text-sm leading-relaxed text-[#1a3d1a]/60">
                                                        {faq.answer}
                                                    </p>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))
                        ) : (
                            <p className="px-4 py-6 text-sm leading-relaxed text-[#1a3d1a]/55">
                                No help articles yet. Call the front desk and
                                they will be glad to help.
                            </p>
                        )}
                    </div>

                    <p className="border-t border-[#1a3d1a]/10 bg-[#EFFDF0]/40 px-5 py-3 text-xs leading-relaxed text-[#1a3d1a]/55">
                        Still stuck? Call the front desk — they can change or
                        cancel a booking for you.
                    </p>
                </div>
            )}

            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-label="Frequently asked questions"
                aria-expanded={open}
                aria-controls="portal-faq"
                className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1a3d1a] text-white shadow-xl shadow-[#1a3d1a]/30 transition-colors duration-200 hover:bg-[#2a5a2a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a] focus-visible:ring-offset-2"
            >
                {open ? (
                    <X className="h-6 w-6" />
                ) : (
                    <HelpCircle className="h-6 w-6" />
                )}
            </button>
        </div>
    );
}

export default function OwnerLayout({
    title,
    heading,
    description,
    actions,
    children,
}: PropsWithChildren<{
    /** Document title. */
    title: string;
    /** Optional page heading rendered at the top of the body. */
    heading?: string;
    description?: string;
    actions?: ReactNode;
}>) {
    const { auth, portal } = usePage<PageProps>().props;
    const user = auth.user;

    const [mobileOpen, setMobileOpen] = useState(false);
    const headerRef = useRef<HTMLElement>(null);

    /* The mobile panel sits inside the header, so one ref covers both. */
    useEffect(() => {
        if (!mobileOpen) {
            return;
        }

        const handlePointerDown = (event: MouseEvent) => {
            if (!headerRef.current?.contains(event.target as Node)) {
                setMobileOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setMobileOpen(false);
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };    }, [mobileOpen]);

    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchGroups, setSearchGroups] = useState<SearchGroups | null>(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    /* Focusing on open means the panel is usable the moment it appears. */
    useEffect(() => {
        if (searchOpen) {
            searchInputRef.current?.focus();
        }
    }, [searchOpen]);

    /* The header shows one overlay at a time, so opening search closes the menu. */
    const openSearch = useCallback(() => {
        setMobileOpen(false);
        setSearchOpen(true);
    }, []);

    const closeSearch = useCallback(() => {
        setSearchOpen(false);
        setSearchQuery('');
        setSearchGroups(null);
    }, []);

    /* Escape and outside clicks close the search panel. It lives inside the
       header, so the header's own ref covers it. */
    useEffect(() => {
        if (!searchOpen) {
            return;
        }

        const handlePointerDown = (event: MouseEvent) => {
            if (!headerRef.current?.contains(event.target as Node)) {
                closeSearch();
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                closeSearch();
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [searchOpen, closeSearch]);

    /* Debounced server-side search, so typing does not fire a request per key. */
    useEffect(() => {
        const term = searchQuery.trim();

        // One character is noise, and matches the server's own threshold.
        if (term.length < 2) {
            setSearchGroups(null);
            setSearchLoading(false);

            return;
        }

        let cancelled = false;
        setSearchLoading(true);

        const timer = setTimeout(async () => {
            try {
                const response = await fetch(
                    `${route('owner.search')}?q=${encodeURIComponent(term)}`,
                    {
                        headers: { Accept: 'application/json' },
                        credentials: 'same-origin',
                    },
                );

                const data = (await response.json()) as SearchGroups;

                if (!cancelled) {
                    setSearchGroups(data);
                }
            } catch {
                // A failed lookup is just an empty one; the panel stays usable.
                if (!cancelled) {
                    setSearchGroups({
                        dogs: [],
                        appointments: [],
                        services: [],
                    });
                }
            } finally {
                if (!cancelled) {
                    setSearchLoading(false);
                }
            }
        }, 250);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [searchQuery]);


    const navItems: NavItem[] = [
        {
            label: 'Home',
            href: route('owner.dashboard'),
            pattern: 'owner.dashboard',
        },
        {
            label: 'Services',
            href: route('owner.services.index'),
            pattern: 'owner.services.*',
        },
        {
            label: 'Appointments',
            href: route('owner.appointments.index'),
            pattern: 'owner.appointments.*',
        },
    ];

    const notifications = portal?.notifications ?? [];
    const unread = portal?.unreadNotifications ?? 0;

    const accountLinks = (
        <>
            <Link
                href={route('owner.account.edit')}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-[#1a3d1a] transition-colors duration-200 hover:bg-[#EFFDF0]"
            >
                <PawPrint className="h-4 w-4 text-[#1a3d1a]/50" />
                My account &amp; dogs
            </Link>
            <Link
                href={route('profile.edit')}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-[#1a3d1a] transition-colors duration-200 hover:bg-[#EFFDF0]"
            >
                <UserIcon className="h-4 w-4 text-[#1a3d1a]/50" />
                Profile &amp; password
            </Link>
            <Link
                href={route('logout')}
                method="post"
                as="button"
                onClick={() => setMobileOpen(false)}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-[#b3261e] transition-colors duration-200 hover:bg-[#b3261e]/5"
            >
                <LogOut className="h-4 w-4 text-[#b3261e]/60" />
                Log out
            </Link>
        </>
    );

    return (
        <div className="flex min-h-screen flex-col bg-white font-inter text-[#1a3d1a] antialiased">
            <header
                ref={headerRef}
                className="sticky top-0 z-30 shrink-0 border-b border-[#1a3d1a]/10 bg-white/90 backdrop-blur-md"
            >
                <div className="mx-auto flex h-20 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
                    <Link
                        href={route('owner.dashboard')}
                        onClick={() => setMobileOpen(false)}
                        className="group flex shrink-0 items-center gap-2.5 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]"
                    >
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1a3d1a] text-white transition-colors duration-200 group-hover:bg-[#2a5a2a]">
                            <PawPrint className="h-5 w-5" />
                        </span>
                        <span className="font-serif-display text-xl leading-none text-[#1a3d1a] sm:text-2xl">
                            My<span className="text-[#E86A10]">Vet</span>
                        </span>
                    </Link>

                    <nav className="ml-4 hidden items-center gap-1 lg:flex">
                        {navItems.map((item) => {
                            const active = route().current(item.pattern);

                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    aria-current={active ? 'page' : undefined}
                                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a] ${
                                        active
                                            ? 'bg-[#EFFDF0] text-[#1a3d1a] shadow-sm'
                                            : 'text-[#1a3d1a]/65 hover:bg-[#EFFDF0]/70 hover:text-[#1a3d1a]'
                                    }`}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="ml-auto flex shrink-0 items-center gap-2">
                        <button
                            type="button"
                            onClick={() =>
                                searchOpen ? closeSearch() : openSearch()
                            }
                            aria-label="Search"
                            aria-expanded={searchOpen}
                            aria-controls="portal-search"
                            className="hidden h-11 w-11 items-center justify-center rounded-full border border-[#1a3d1a]/15 bg-white text-[#1a3d1a] transition-colors duration-200 hover:bg-[#EFFDF0] md:flex focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]"
                        >
                            <Search className="h-5 w-5" />
                        </button>

                        <NotificationBell
                            notifications={notifications}
                            unread={unread}
                        />
                        <AccountMenu user={user} />

                        <button
                            type="button"
                            onClick={() => {
                                setMobileOpen((value) => !value);
                                setSearchOpen(false);
                            }}
                            aria-label="Toggle navigation menu"
                            aria-expanded={mobileOpen}
                            aria-controls="portal-mobile-nav"
                            className="flex h-11 w-11 items-center justify-center rounded-full border border-[#1a3d1a]/15 bg-white text-[#1a3d1a] transition-colors duration-200 hover:bg-[#EFFDF0] lg:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]"
                        >
                            {mobileOpen ? (
                                <X className="h-5 w-5" />
                            ) : (
                                <Menu className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                </div>

                {searchOpen && (
                    <SearchPanel
                        query={searchQuery}
                        onQueryChange={setSearchQuery}
                        groups={searchGroups}
                        loading={searchLoading}
                        onClose={closeSearch}
                        inputRef={searchInputRef}
                    />
                )}

                {/* Mobile nav. Below `md` the header has no room for the search
                    button, so it becomes a row inside this panel. */}
                {mobileOpen && (
                    <div
                        id="portal-mobile-nav"
                        className="absolute inset-x-0 top-full z-40 animate-dropdown px-4 pt-1 sm:px-6 lg:hidden"
                    >
                        <div className="mx-auto max-h-[calc(100vh-6rem)] max-w-2xl overflow-y-auto overflow-x-hidden rounded-2xl border border-[#1a3d1a]/10 bg-white shadow-2xl shadow-[#1a3d1a]/10">
                            <div className="border-b border-[#1a3d1a]/10 p-2 md:hidden">
                                <button
                                    type="button"
                                    onClick={openSearch}
                                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-[#1a3d1a] transition-colors duration-200 hover:bg-[#EFFDF0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]"
                                >
                                    <Search className="h-4 w-4 text-[#1a3d1a]/50" />
                                    Search
                                </button>
                            </div>

                            <nav className="flex flex-col p-2">
                                {navItems.map((item) => {
                                    const active = route().current(
                                        item.pattern,
                                    );

                                    return (
                                        <Link
                                            key={item.label}
                                            href={item.href}
                                            onClick={() => setMobileOpen(false)}
                                            aria-current={
                                                active ? 'page' : undefined
                                            }
                                            className={`rounded-xl px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                                                active
                                                    ? 'bg-[#EFFDF0] text-[#1a3d1a]'
                                                    : 'text-[#1a3d1a]/70 hover:bg-[#EFFDF0] hover:text-[#1a3d1a]'
                                            }`}
                                        >
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </nav>

                            <div className="border-t border-[#1a3d1a]/10 p-2">
                                <div className="flex items-center gap-3 px-4 py-3">
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1a3d1a] text-sm font-semibold text-white">
                                        {initials(user.name)}
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block truncate text-sm font-semibold text-[#1a3d1a]">
                                            {user.name}
                                        </span>
                                        <span className="block truncate text-xs text-[#1a3d1a]/55">
                                            {user.email}
                                        </span>
                                    </span>
                                </div>

                                {accountLinks}
                            </div>
                        </div>
                    </div>
                )}
            </header>

            <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-20 pt-10 sm:px-6 lg:px-8">
                {heading && (
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div className="min-w-0">
                            <h1 className="font-serif-display text-3xl leading-tight tracking-tight text-[#1a3d1a] sm:text-[2.4rem]">
                                {heading}
                            </h1>
                            {description && (
                                <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[#1a3d1a]/60">
                                    {description}
                                </p>
                            )}
                        </div>

                        {actions && (
                            <div className="flex flex-wrap items-center gap-2.5">
                                {actions}
                            </div>
                        )}
                    </div>
                )}

                <div className={heading ? 'mt-8' : ''}>{children}</div>
            </main>

            <FaqButton />

            <Head title={title} />
        </div>
    );
}
