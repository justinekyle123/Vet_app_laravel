import { PageProps } from '@/types';
import { Head } from '@inertiajs/react';
import {
    ArrowRight,
    ArrowUpRight,
    CalendarDays,
    Menu,
    PawPrint,
    Play,
    Plus,
    Search,
    Star,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/* Artwork is served from the design's CDN, not bundled. */
const assets = {
    avatar: 'https://polo-pecan-73837341.figma.site/_assets/v11/e62173d41f91350a59628e8a9a55ae078a886fb9.png?w=128',
    product:
        'https://polo-pecan-73837341.figma.site/_assets/v11/3e5158dad63d392ade022e81890edc9f54d750bc.png',
    video: 'https://polo-pecan-73837341.figma.site/_assets/v11/76be6ec3a93a703b15e9cc01e764a4e3f9d7d2c0.png',
    galleryLeft:
        'https://polo-pecan-73837341.figma.site/_assets/v11/8d44b25186ef45a5789c74668fb781cea4e1ff49.png',
    galleryCenter:
        'https://polo-pecan-73837341.figma.site/_assets/v11/96745c4e72ad5c5208e53a885df797fd82cd854a.png?h=1024',
    galleryRight:
        'https://polo-pecan-73837341.figma.site/_assets/v11/81bd2e7a66b58f3d8f3ad78fd1ebf01af8dfdee1.png',
};

/*
 * Max-heights keep the three bottom photos inside the viewport. They grow
 * with the screen, and the middle panel is allowed to run taller than the
 * two flanking it so the row reads as a composition rather than a strip.
 * The bare values cover phones, where the panels also appear in flow.
 */
const galleryHeight = {
    outer: 'max-h-[34vh] md:max-h-[60vh] lg:max-h-[min(70vh,55vw)]',
    center: 'max-h-[40vh] md:max-h-[75vh] lg:max-h-[min(85vh,70vw)]',
};

/*
 * What the header search matches against. These are the clinic's own
 * services, so results stay truthful without a search endpoint behind them.
 */
const searchIndex = [
    {
        title: 'Wellness Exams',
        description:
            'Routine check-ups that catch small problems early, and a full record after every visit.',
    },
    {
        title: 'Vaccinations',
        description:
            'Core and lifestyle vaccines, with a reminder the moment a booster is due.',
    },
    {
        title: 'In-House Lab',
        description:
            'Bloodwork and diagnostics back in minutes rather than days.',
    },
    {
        title: 'Surgery & Dental',
        description:
            'From routine neutering to soft-tissue procedures and scale-and-polish cleanings.',
    },
    {
        title: '24/7 Emergency',
        description:
            'A veterinarian on call every hour of the year, because accidents keep no schedule.',
    },
    {
        title: 'Grooming & Boarding',
        description:
            'Overnight care and grooming staffed by people your pet already trusts.',
    },
];

/** Client avatar paired with the "more" bubble, reused in the hero overlay. */
function AvatarStack({ size }: { size: string }) {
    return (
        <span className="flex items-center">
            <img
                src={assets.avatar}
                alt=""
                draggable={false}
                className={`${size} rounded-full border-2 border-white object-cover`}
            />
            <span
                className={`-ml-2 flex items-center justify-center rounded-full border-2 border-white bg-[#2a5a2a] text-white ${size}`}
            >
                <Plus className="h-3.5 w-3.5" />
            </span>
        </span>
    );
}

/**
 * The three flush bottom photos. On tablets and up they carry the stat,
 * headline and rating overlays; on phones the same numbers are shown in
 * their own row above, so the overlays stay off.
 */
function BottomGallery({ withOverlays = false }: { withOverlays?: boolean }) {
    return (
        <div className="flex items-end">
            <div className="relative flex-1">
                <img
                    src={assets.galleryLeft}
                    alt="A dog being examined at the clinic"
                    draggable={false}
                    className={`block h-auto w-full object-cover object-top ${galleryHeight.outer} ${
                        withOverlays ? 'animate-photo-reveal anim-delay-800' : ''
                    }`}
                />
                {withOverlays && (
                    <div className="absolute left-5 z-20 flex animate-scale-in items-center gap-3 anim-delay-1000 lg:left-8 bottom-[clamp(20px,4vh,50px)]">
                        <span className="font-serif-display text-[clamp(24px,2.8vw,40px)] leading-none text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                            98K+
                        </span>
                        <AvatarStack size="h-8 w-8" />
                    </div>
                )}
            </div>

            <div className="relative flex-[1.265]">
                <img
                    src={assets.galleryCenter}
                    alt="A happy pet at the clinic"
                    draggable={false}
                    className={`block h-auto w-full object-cover object-top ${galleryHeight.center} ${
                        withOverlays ? 'animate-photo-reveal anim-delay-600' : ''
                    }`}
                />
                {withOverlays && (
                    <div className="absolute inset-x-0 z-20 flex animate-scale-in flex-col items-center px-4 text-center anim-delay-1100 bottom-[clamp(20px,4vh,50px)]">
                        <h2 className="font-serif-display text-[clamp(20px,2.3vw,36px)] leading-[1.05] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.55)]">
                            Complete Care for Your Pet
                        </h2>
                        <a
                            href="#top"
                            className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#E86A10] px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-black/20 transition-colors duration-200 hover:bg-[#d45e0d] sm:text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                        >
                            Explore Services
                            <ArrowRight className="h-4 w-4" />
                        </a>
                    </div>
                )}
            </div>

            <div className="relative flex-1">
                <img
                    src={assets.galleryRight}
                    alt="A patient resting after a visit"
                    draggable={false}
                    className={`block h-auto w-full object-cover object-top ${galleryHeight.outer} ${
                        withOverlays ? 'animate-photo-reveal anim-delay-900' : ''
                    }`}
                />
                {withOverlays && (
                    <div className="absolute right-5 z-20 flex animate-scale-in items-center gap-1.5 anim-delay-1200 lg:right-8 bottom-[clamp(20px,4vh,50px)]">
                        <Star className="h-5 w-5 fill-[#E86A10] text-[#E86A10] lg:h-6 lg:w-6" />
                        <span className="text-[clamp(16px,1.6vw,22px)] font-semibold leading-none text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                            4.6
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function Welcome({
    auth,
    canLogin,
    canRegister,
}: PageProps<{ canLogin: boolean; canRegister: boolean }>) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const headerRef = useRef<HTMLElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const isSignedIn = Boolean(auth.user);
    const isOwner = auth.user?.role === 'owner';

    /*
     * Owners get sent straight to the portal panel the label names; other
     * signed-in staff go through the role funnel instead of hitting a 403,
     * and guests are asked to sign in before they can see either list.
     */
    const ownerPanelHref = route('owner.dashboard');

    const savedPetsHref = isOwner
        ? `${ownerPanelHref}#pets`
        : isSignedIn
          ? route('dashboard')
          : route('login');
    const appointmentsHref = isOwner
        ? `${ownerPanelHref}#appointments`
        : isSignedIn
          ? route('dashboard')
          : route('login');

    /*
     * The booking CTAs follow the same rule, so a signed-in visitor is never
     * bounced off the guest-only sign-up screen.
     */
    const bookHref = isOwner
        ? `${ownerPanelHref}#appointments`
        : isSignedIn
          ? route('dashboard')
          : canRegister
            ? route('register')
            : '#top';

    const navLinks = [
        { label: 'Home', href: '#top', current: true },
        { label: 'Services', href: '#services', current: false },
        { label: 'Vaccinations', href: '#vaccinations', current: false },
        { label: 'Our Vets', href: '#team', current: false },
        { label: 'Blog', href: '#blog', current: false },
    ];

    const closeOverlays = () => {
        setIsMenuOpen(false);
        setIsSearchOpen(false);
    };

    const normalizedQuery = searchQuery.trim().toLowerCase();
    const searchResults =
        normalizedQuery === ''
            ? searchIndex
            : searchIndex.filter((service) =>
                  `${service.title} ${service.description}`
                      .toLowerCase()
                      .includes(normalizedQuery),
              );

    /* Focusing on open means the panel is usable the moment it appears. */
    useEffect(() => {
        if (isSearchOpen) {
            searchInputRef.current?.focus();
        }
    }, [isSearchOpen]);

    /* Escape and outside clicks both close whichever overlay is open. */
    useEffect(() => {
        if (!isMenuOpen && !isSearchOpen) {
            return;
        }

        const handlePointerDown = (event: MouseEvent) => {
            if (!headerRef.current?.contains(event.target as Node)) {
                setIsMenuOpen(false);
                setIsSearchOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsMenuOpen(false);
                setIsSearchOpen(false);
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isMenuOpen, isSearchOpen]);

    return (
        <>
            <Head title="MyVet — Modern veterinary care for the whole family" />

            <div
                id="top"
                className="flex h-screen flex-col overflow-hidden bg-[#EFFDF0] font-inter text-slate-900 antialiased selection:bg-[#1a3d1a]/10"
            >
                {/* -----------------------------------------------------------
                    Header — logo, centre nav, and quick actions.

                    Below `sm` the three icon actions collapse into the mobile
                    menu, which labels them instead of leaving them as cryptic
                    glyphs on a narrow bar.
                ------------------------------------------------------------ */}
                <header
                    ref={headerRef}
                    className="relative z-30 shrink-0 animate-fade-in px-4 py-4 anim-delay-100 sm:px-6 lg:px-12"
                >
                    <div className="flex items-center justify-between gap-4">
                        <a
                            href="#top"
                            onClick={closeOverlays}
                            className="group flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]"
                        >
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1a3d1a] text-[#EFFDF0] transition-colors duration-200 group-hover:bg-[#2a5a2a] sm:h-10 sm:w-10">
                                <PawPrint className="h-5 w-5" />
                            </span>
                            <span className="font-serif-display text-xl leading-none text-[#1a3d1a] sm:text-2xl">
                                My<span className="text-[#E86A10]">Vet</span>
                            </span>
                        </a>

                        <nav className="hidden items-center gap-8 md:flex">
                            {navLinks.map((link) => (
                                <a
                                    key={link.label}
                                    href={link.href}
                                    className={`text-sm font-medium transition-colors duration-200 ${
                                        link.current
                                            ? 'text-gray-900'
                                            : 'text-gray-600 hover:text-[#1a3d1a]'
                                    }`}
                                >
                                    {link.label}
                                </a>
                            ))}
                        </nav>

                        <div className="flex items-center gap-2 sm:gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsSearchOpen((open) => !open);
                                    setIsMenuOpen(false);
                                }}
                                aria-label="Search services"
                                aria-expanded={isSearchOpen}
                                aria-controls="site-search"
                                className="hidden h-10 w-10 items-center justify-center rounded-full border border-[#1a3d1a]/15 bg-white/60 text-[#1a3d1a] transition-colors duration-200 hover:bg-white sm:flex focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]"
                            >
                                <Search className="h-4 w-4" />
                            </button>

                            <a
                                href={savedPetsHref}
                                aria-label="Saved pets"
                                className="hidden h-10 w-10 items-center justify-center rounded-full bg-[#E86A10] text-white transition-colors duration-200 hover:bg-[#d45e0d] sm:flex focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E86A10]"
                            >
                                <Star className="h-4 w-4 fill-current" />
                            </a>

                            <a
                                href={appointmentsHref}
                                aria-label="Appointments"
                                className="hidden h-10 w-10 items-center justify-center rounded-full border border-[#1a3d1a]/15 bg-white/60 text-[#1a3d1a] transition-colors duration-200 hover:bg-white sm:flex focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]"
                            >
                                <CalendarDays className="h-4 w-4" />
                            </a>

                            <img
                                src={assets.avatar}
                                alt=""
                                draggable={false}
                                className="h-10 w-10 rounded-full object-cover ring-1 ring-[#1a3d1a]/10"
                            />

                            <button
                                type="button"
                                onClick={() => {
                                    setIsMenuOpen((open) => !open);
                                    setIsSearchOpen(false);
                                }}
                                aria-label="Toggle navigation menu"
                                aria-expanded={isMenuOpen}
                                aria-controls="mobile-nav"
                                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#1a3d1a]/15 bg-white/60 text-[#1a3d1a] transition-colors duration-200 hover:bg-white md:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]"
                            >
                                {isMenuOpen ? (
                                    <X className="h-4 w-4" />
                                ) : (
                                    <Menu className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Inline service search. Matches client-side, so it needs
                        no route and works the same signed in or out. */}
                    {isSearchOpen && (
                        <div
                            id="site-search"
                            className="absolute inset-x-0 top-full z-40 animate-dropdown px-4 pt-1 sm:px-6 lg:px-12"
                        >
                            <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-[#1a3d1a]/10 bg-white shadow-2xl shadow-[#1a3d1a]/10">
                                <div className="flex items-center gap-3 border-b border-[#1a3d1a]/10 px-4">
                                    <Search className="h-4 w-4 shrink-0 text-[#1a3d1a]/40" />
                                    <input
                                        ref={searchInputRef}
                                        type="search"
                                        value={searchQuery}
                                        onChange={(event) =>
                                            setSearchQuery(event.target.value)
                                        }
                                        placeholder="Search services"
                                        aria-label="Search services"
                                        className="w-full border-0 bg-transparent py-3.5 text-sm text-[#1a3d1a] placeholder:text-[#1a3d1a]/40 focus:outline-none focus:ring-0"
                                    />
                                    <button
                                        type="button"
                                        onClick={closeOverlays}
                                        aria-label="Close search"
                                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#1a3d1a]/50 transition-colors duration-200 hover:bg-[#EFFDF0] hover:text-[#1a3d1a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>

                                {searchResults.length > 0 ? (
                                    <ul className="max-h-[45vh] overflow-y-auto p-2">
                                        {searchResults.map((result) => (
                                            <li key={result.title}>
                                                <a
                                                    href={bookHref}
                                                    onClick={closeOverlays}
                                                    className="group flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors duration-200 hover:bg-[#EFFDF0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]"
                                                >
                                                    <span className="min-w-0 flex-1">
                                                        <span className="block text-sm font-medium text-[#1a3d1a]">
                                                            {result.title}
                                                        </span>
                                                        <span className="mt-0.5 block text-xs leading-relaxed text-gray-500">
                                                            {
                                                                result.description
                                                            }
                                                        </span>
                                                    </span>
                                                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[#1a3d1a]/30 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[#1a3d1a]" />
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="px-5 py-6 text-sm text-gray-500">
                                        No services match “{searchQuery.trim()}”.
                                    </p>
                                )}

                                {!isSignedIn && searchResults.length > 0 && (
                                    <p className="border-t border-[#1a3d1a]/10 bg-[#EFFDF0]/60 px-5 py-3 text-xs text-gray-500">
                                        Create an account to book any of these
                                        services.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Mobile nav. Scrolls rather than overflowing the
                        viewport-locked page on short screens. */}
                    {isMenuOpen && (
                        <div
                            id="mobile-nav"
                            className="absolute inset-x-0 top-full z-40 animate-dropdown px-4 pt-1 sm:px-6 md:hidden"
                        >
                            <div className="max-h-[calc(100vh-6rem)] overflow-y-auto rounded-2xl border border-[#1a3d1a]/10 bg-white shadow-2xl shadow-[#1a3d1a]/10">
                                <nav className="flex flex-col p-2">
                                    {navLinks.map((link) => (
                                        <a
                                            key={link.label}
                                            href={link.href}
                                            onClick={closeOverlays}
                                            className="rounded-xl px-4 py-3 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-[#EFFDF0] hover:text-[#1a3d1a]"
                                        >
                                            {link.label}
                                        </a>
                                    ))}
                                </nav>

                                <div className="border-t border-[#1a3d1a]/10 p-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            setIsSearchOpen(true);
                                        }}
                                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-[#EFFDF0] hover:text-[#1a3d1a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]"
                                    >
                                        <Search className="h-4 w-4 text-[#1a3d1a]/50" />
                                        Search services
                                    </button>
                                    <a
                                        href={savedPetsHref}
                                        onClick={closeOverlays}
                                        className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-[#EFFDF0] hover:text-[#1a3d1a]"
                                    >
                                        <Star className="h-4 w-4 text-[#1a3d1a]/50" />
                                        Saved pets
                                    </a>
                                    <a
                                        href={appointmentsHref}
                                        onClick={closeOverlays}
                                        className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-[#EFFDF0] hover:text-[#1a3d1a]"
                                    >
                                        <CalendarDays className="h-4 w-4 text-[#1a3d1a]/50" />
                                        Appointments
                                    </a>
                                </div>

                                <div className="border-t border-[#1a3d1a]/10 p-2">
                                    {isSignedIn ? (
                                        <a
                                            href={route('dashboard')}
                                            onClick={closeOverlays}
                                            className="flex items-center justify-center rounded-xl bg-[#1a3d1a] px-4 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#2a5a2a]"
                                        >
                                            Go to dashboard
                                        </a>
                                    ) : (
                                        <div className="flex flex-col gap-2">
                                            {canRegister && (
                                                <a
                                                    href={bookHref}
                                                    onClick={closeOverlays}
                                                    className="flex items-center justify-center gap-2 rounded-xl bg-[#E86A10] px-4 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#d45e0d]"
                                                >
                                                    Book a Visit
                                                    <ArrowRight className="h-4 w-4" />
                                                </a>
                                            )}
                                            {canLogin && (
                                                <a
                                                    href={route('login')}
                                                    onClick={closeOverlays}
                                                    className="flex items-center justify-center rounded-xl border border-[#1a3d1a]/15 px-4 py-3 text-sm font-semibold text-[#1a3d1a] transition-colors duration-200 hover:bg-[#EFFDF0]"
                                                >
                                                    Log in
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </header>

                <section className="relative flex flex-1 flex-col overflow-hidden">
                    {/* -------------------------------------------------------
                        Phone layout — stacked, with the stats in their own row.
                    -------------------------------------------------------- */}
                    <div className="flex flex-1 flex-col md:hidden">
                        <div className="px-6 text-center">
                            <h1 className="animate-text-reveal font-serif-display text-[36px] leading-[0.98] tracking-tight text-[#1a3d1a] anim-delay-200">
                                Everything
                                <br />
                                Your Pets Need
                            </h1>
                            <p className="mx-auto mt-3 max-w-xs animate-fade-up text-sm leading-relaxed text-gray-600 anim-delay-400">
                                Modern veterinary care for the whole family,
                                seven days a week.
                            </p>
                            <a
                                href={bookHref}
                                className="mt-4 inline-flex animate-fade-up items-center gap-2 rounded-full bg-[#E86A10] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#E86A10]/25 transition-colors duration-200 hover:bg-[#d45e0d] anim-delay-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E86A10]"
                            >
                                Book a Visit
                                <ArrowRight className="h-4 w-4" />
                            </a>
                        </div>

                        <div className="mt-5 flex animate-fade-up items-start gap-3 px-6 anim-delay-600">
                            <div className="relative flex-1 overflow-hidden rounded-2xl bg-white/40 aspect-square">
                                <img
                                    src={assets.product}
                                    alt="Wellness checkup"
                                    draggable={false}
                                    className="h-full w-full object-cover"
                                />
                                <span className="absolute bottom-2.5 right-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-[#1a3d1a] text-white">
                                    <ArrowUpRight className="h-4 w-4" />
                                </span>
                            </div>

                            <div className="relative w-[38%] overflow-hidden rounded-2xl bg-white/40 aspect-[3/4]">
                                <img
                                    src={assets.video}
                                    alt=""
                                    draggable={false}
                                    className="h-full w-full object-cover"
                                />
                                <span className="absolute bottom-2.5 left-1/2 flex h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full bg-[#1a3d1a] text-white">
                                    <Play className="h-4 w-4 fill-current" />
                                </span>
                            </div>
                        </div>

                        <div className="mt-5 flex animate-fade-up items-center justify-between px-6 anim-delay-700">
                            <div className="flex items-center gap-3">
                                <AvatarStack size="h-8 w-8" />
                                <div>
                                    <p className="text-lg font-semibold leading-none text-[#1a3d1a]">
                                        98K+
                                    </p>
                                    <p className="mt-0.5 text-[11px] text-gray-500">
                                        Pets cared for
                                    </p>
                                </div>
                            </div>

                            <span className="h-10 w-px bg-[#1a3d1a]/10" />

                            <div className="flex items-center gap-2">
                                <Star className="h-5 w-5 fill-[#E86A10] text-[#E86A10]" />
                                <div>
                                    <p className="text-lg font-semibold leading-none text-[#1a3d1a]">
                                        4.6
                                    </p>
                                    <p className="mt-0.5 text-[11px] text-gray-500">
                                        Owner rating
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto">
                            <BottomGallery />
                        </div>
                    </div>

                    {/* -------------------------------------------------------
                        Tablet and desktop — centred headline, two floating
                        cards, and the photos pinned to the bottom edge.
                    -------------------------------------------------------- */}
                    <div className="relative hidden flex-1 md:block">
                        <div className="pointer-events-none absolute inset-x-0 top-0 z-[5] px-12 pt-[4.5rem] text-center lg:pt-[5.4rem]">
                            <h1 className="font-serif-display text-7xl leading-[0.95] tracking-tight text-[#1a3d1a] lg:text-[clamp(60px,7.5vw,110px)]">
                                <span className="block">
                                    <span className="mr-[0.22em] inline-block animate-word-pop anim-delay-200 last:mr-0">
                                        Everything
                                    </span>
                                </span>
                                <span className="block">
                                    <span className="mr-[0.22em] inline-block animate-word-pop anim-delay-300 last:mr-0">
                                        Your
                                    </span>
                                    <span className="mr-[0.22em] inline-block animate-word-pop anim-delay-400 last:mr-0">
                                        Pets
                                    </span>
                                    <span className="mr-[0.22em] inline-block animate-word-pop anim-delay-500 last:mr-0">
                                        Need
                                    </span>
                                </span>
                            </h1>
                        </div>

                        {/* Featured service card. */}
                        <div className="absolute left-4 top-[80px] z-20 hidden w-[160px] animate-slide-in-left anim-delay-600 md:block lg:left-12 lg:top-[50px] lg:w-[clamp(160px,14vw,260px)]">
                            <div className="relative overflow-hidden rounded-2xl bg-white/40 aspect-[260/257]">
                                <img
                                    src={assets.product}
                                    alt="Wellness checkup"
                                    draggable={false}
                                    className="h-full w-full object-cover"
                                />
                                <button
                                    type="button"
                                    aria-label="View the wellness checkup"
                                    className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#1a3d1a] text-white transition-colors duration-200 hover:bg-[#2a5a2a] lg:h-11 lg:w-11 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]"
                                >
                                    <ArrowUpRight className="h-4 w-4 lg:h-5 lg:w-5" />
                                </button>
                            </div>
                            <p className="mt-2.5 text-[clamp(12px,1.05vw,17px)] text-gray-700">
                                Wellness Checkup
                            </p>
                            <p className="text-[clamp(14px,1.15vw,19px)] font-semibold text-[#1a3d1a]">
                                $49.99
                            </p>
                        </div>

                        {/* Client stories card. */}
                        <div className="absolute right-4 top-[80px] z-20 hidden w-[120px] animate-slide-in-right anim-delay-700 md:block lg:right-12 lg:top-[50px] lg:w-[clamp(120px,10vw,177px)]">
                            <div className="relative overflow-hidden rounded-2xl aspect-[177/287]">
                                <img
                                    src={assets.video}
                                    alt=""
                                    draggable={false}
                                    className="h-full w-full object-cover"
                                />
                                <span
                                    aria-hidden="true"
                                    className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"
                                />
                                <div className="absolute inset-x-2 bottom-3 flex flex-col items-center">
                                    <button
                                        type="button"
                                        aria-label="Play client stories"
                                        className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1a3d1a] text-white transition-colors duration-200 hover:bg-[#2a5a2a] lg:h-11 lg:w-11 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                                    >
                                        <Play className="h-4 w-4 fill-current lg:h-5 lg:w-5" />
                                    </button>
                                    <p className="mt-2 text-center text-[9px] font-medium leading-snug text-white lg:text-[10px]">
                                        Watch Client Stories on TikTok and
                                        YouTube
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="absolute inset-x-0 bottom-0 z-10">
                            <BottomGallery withOverlays />
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}
