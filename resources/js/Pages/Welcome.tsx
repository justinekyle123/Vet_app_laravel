import CountUp from '@/Components/CountUp';
import Reveal from '@/Components/Reveal';
import {
    primaryButtonClass,
    secondaryButtonClass,
} from '@/Components/buttonStyles';
import {
    PageProps,
    PublicClinic,
    PublicService,
    PublicStats,
    PublicTeamMember,
} from '@/types';
import { currency, initials } from '@/utils/format';
import { Head } from '@inertiajs/react';
import {
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    Clock,
    Mail,
    MapPin,
    Menu,
    PawPrint,
    Phone,
    Plus,
    Search,
    Star,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

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
 * Client stories for the reviews rail. Sample copy — swap in feedback the
 * clinic has permission to publish.
 */
const reviews = [
    {
        name: 'Sarah L.',
        dog: 'Bella',
        detail: 'Golden Retriever',
        rating: 5,
        quote: 'Dr. Reyes was amazing with Bella. She explained everything clearly and made sure Bella was comfortable throughout the exam.',
    },
    {
        name: 'Miguel T.',
        dog: 'Milo',
        detail: 'French Bulldog',
        rating: 5,
        quote: "Milo's dental cleaning was smooth and stress-free. The team is incredibly gentle, and they walked me through the aftercare.",
    },
    {
        name: 'Emily R.',
        dog: 'Charlie',
        detail: 'Poodle',
        rating: 5,
        quote: 'Charlie loves the grooming spa. He comes out looking and smelling fantastic, and they always flag anything odd on his skin.',
    },
    {
        name: 'Nena P.',
        dog: 'Bantay',
        detail: 'Aspin (mixed breed)',
        rating: 5,
        quote: 'They fitted Bantay in the same afternoon I called, and the lab results were ready before we left the clinic.',
    },
    {
        name: 'Carlos M.',
        dog: 'Rex',
        detail: 'German Shepherd',
        rating: 4,
        quote: 'Booking from the portal is quick and the reminders mean Rex is never late for a booster. Parking is the only tight part.',
    },
    {
        name: 'Priya N.',
        dog: 'Kopi',
        detail: 'Shih Tzu',
        rating: 5,
        quote: 'Dr. Bautista planned Kopi\'s whole vaccine schedule and set the reminders for us. First clinic where I have never lost track.',
    },
];

/*
 * The clinic's own artwork, cycled across the service cards so the new
 * sections use the same photography as the hero instead of a second set.
 */
const servicePhotos = [
    assets.product,
    assets.galleryLeft,
    assets.galleryCenter,
    assets.galleryRight,
    assets.video,
];

/*
 * How much of the menu the landing page shows: one row on a wide screen. The
 * rest lives in the client portal, behind "View all services".
 */
const FEATURED_SERVICE_COUNT = 4;

/** The footer's service column stops at this many names before "view all". */
const FOOTER_SERVICE_COUNT = 3;

/** Numbered kicker that opens a section, e.g. "01 — Services". */
function SectionMarker({ children }: { children: ReactNode }) {
    return (
        <p className="flex items-center gap-3 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#1a3d1a]/45">
            <span aria-hidden="true" className="h-px w-8 bg-[#E86A10]" />
            {children}
        </p>
    );
}

/** Five stars, filled to the rating, so a score reads at a glance. */
function Stars({ rating }: { rating: number }) {
    return (
        <span
            className="flex items-center gap-1"
            aria-label={`Rated ${rating} out of 5`}
        >
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`h-4 w-4 ${
                        star <= Math.round(rating)
                            ? 'fill-[#E86A10] text-[#E86A10]'
                            : 'text-[#1a3d1a]/20'
                    }`}
                />
            ))}
        </span>
    );
}

/** "Monday-Saturday" reads as "Mon–Sat" where space is tight. */
function shortDaysOpen(days: string | null): string {
    if (!days) {
        return '—';
    }

    const parts = days
        .split('-')
        .map((day) => day.trim().slice(0, 3))
        .filter(Boolean);

    return parts.length === 2 ? parts.join('–') : days;
}

/** "08:00" as the clinic signs it: "8:00 AM". */
function clockTime(time: string | null): string {
    if (!time) {
        return '';
    }

    const [hours, minutes] = time.split(':');
    const hour = Number(hours);

    if (Number.isNaN(hour)) {
        return time;
    }

    const suffix = hour < 12 ? 'AM' : 'PM';
    const display = hour % 12 === 0 ? 12 : hour % 12;

    return `${display}:${minutes ?? '00'} ${suffix}`;
}

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
 * Big counts read compactly, the way the design writes them: 98000 becomes
 * "98K", and a small count stays exact rather than being rounded away.
 */
function compactCount(value: number): string {
    if (value < 1000) {
        return `${value}`;
    }

    const thousands = value / 1000;
    const rounded = thousands >= 10 ? Math.round(thousands) : Math.round(thousands * 10) / 10;

    return `${rounded}K`;
}

/**
 * The three flush bottom photos. On tablets and up they carry the stat,
 * headline and rating overlays; on phones the same numbers are shown in
 * their own row above, so the overlays stay off.
 */
function BottomGallery({
    withOverlays = false,
    petsCaredFor,
    rating,
}: {
    withOverlays?: boolean;
    petsCaredFor: number;
    rating: number | null;
}) {
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
                            {compactCount(petsCaredFor)}
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
                            href="#services"
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
                            {rating === null ? '—' : rating.toFixed(1)}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * One service on the public menu, in the same shape the portal's menu uses, so
 * a visitor reads exactly what the desk can book.
 */
function ServiceCard({
    service,
    index,
    photo,
    bookHref,
    anchorId,
}: {
    service: PublicService;
    index: number;
    photo: string;
    bookHref: string;
    anchorId?: string;
}) {
    return (
        <article
            id={anchorId}
            className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#1a3d1a]/10 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#1a3d1a]/20 hover:shadow-lg hover:shadow-[#1a3d1a]/5"
        >
            <div className="relative h-44 overflow-hidden">
                <img
                    src={photo}
                    alt=""
                    draggable={false}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-[#1a3d1a] via-[#1a3d1a]/40 to-transparent"
                />
                <span className="absolute left-4 top-4 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-white/70">
                    {String(index + 1).padStart(2, '0')} / {service.category}
                </span>
                <span className="absolute right-4 top-4 rounded-full bg-[#E86A10] px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-white">
                    {currency(service.price)}
                </span>
                <h3 className="absolute inset-x-4 bottom-4 line-clamp-2 font-serif-display text-2xl leading-tight text-white">
                    {service.service_name}
                </h3>
            </div>

            <div className="flex flex-1 flex-col p-5">
                <p className="line-clamp-3 text-sm leading-relaxed text-[#1a3d1a]/60">
                    {service.description ?? 'Ask the clinic for details.'}
                </p>

                <dl className="mt-auto mb-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-[#1a3d1a]/10 pt-5">
                    <div>
                        <dt className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[#1a3d1a]/40">
                            Duration
                        </dt>
                        <dd className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-[#1a3d1a]">
                            <Clock className="h-3.5 w-3.5 text-[#E86A10]" />
                            {service.duration_minutes
                                ? `${service.duration_minutes} min`
                                : '—'}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[#1a3d1a]/40">
                            Filed under
                        </dt>
                        <dd className="mt-1 text-sm font-semibold text-[#1a3d1a]">
                            {service.category}
                        </dd>
                    </div>
                </dl>

                <a
                    href={bookHref}
                    className="flex items-center justify-between border-t border-[#1a3d1a]/10 pt-4 text-sm font-semibold text-[#1a3d1a] transition-colors duration-200 hover:text-[#E86A10] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]"
                >
                    Book this service
                    <ArrowRight className="h-4 w-4 text-[#E86A10] transition-transform duration-200 group-hover:translate-x-1" />
                </a>
            </div>
        </article>
    );
}

/**
 * One member of the care team as a flip card, the way the reference layout's
 * coach cards work: the front holds their portrait — or an initials monogram
 * when none is on file — and the back their profile. A hover or keyboard
 * focus turns the card over, and the card itself is focusable so a tap does
 * the same on a touch screen.
 */
function CareTeamMemberCard({
    member,
    index,
    bookHref,
}: {
    member: PublicTeamMember;
    index: number;
    bookHref: string;
}) {
    const [isFlipped, setIsFlipped] = useState(false);

    return (
        <article
            role="button"
            tabIndex={0}
            aria-pressed={isFlipped}
            aria-label={`${member.name} — ${member.role}`}
            onClick={() => setIsFlipped((value) => !value)}
            onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setIsFlipped((value) => !value);
                }
            }}
            className={`flip-card group h-[30rem] cursor-pointer focus:outline-none ${
                isFlipped ? 'is-flipped' : ''
            }`}
        >
            <div className="flip-card-inner">
                {/* Front — the portrait, with the details a visitor scans for. */}
                <div className="flip-face flex flex-col rounded-2xl border border-[#1a3d1a]/10 bg-white shadow-sm">
                    <div className="relative h-[68%] overflow-hidden rounded-t-2xl bg-[#EFFDF0]">
                        {member.image ? (
                            <img
                                src={member.image}
                                alt={member.name}
                                draggable={false}
                                className="h-full w-full object-cover object-top"
                            />
                        ) : (
                            <span className="flex h-full w-full items-center justify-center font-serif-display text-4xl leading-none text-[#1a3d1a]/60">
                                {initials(member.name)}
                            </span>
                        )}
                        <span
                            aria-hidden="true"
                            className="absolute inset-0 bg-gradient-to-t from-[#1a3d1a]/80 via-[#1a3d1a]/10 to-transparent"
                        />
                        <span className="absolute left-4 top-4 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-white/80">
                            / {String(index + 1).padStart(2, '0')}
                        </span>
                        <span className="absolute right-4 top-4 rounded-full bg-black/40 px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-white backdrop-blur-sm">
                            {member.role}
                        </span>
                        {member.specialization && (
                            <span className="absolute inset-x-4 bottom-4 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-white/90">
                                {member.specialization}
                            </span>
                        )}
                    </div>

                    <div className="flex flex-1 flex-col justify-between p-6">
                        <div>
                            <h3 className="font-serif-display text-2xl leading-none text-[#1a3d1a]">
                                {member.name}
                            </h3>
                            <p className="mt-2 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#1a3d1a]/50">
                                {member.role}
                            </p>
                        </div>
                        <div className="mt-4 flex items-center justify-between border-t border-[#1a3d1a]/10 pt-4 text-[0.62rem] font-bold uppercase tracking-[0.14em]">
                            <span className="text-[#1a3d1a]/40">
                                Care team
                            </span>
                            <span className="text-[#E86A10]">Hover →</span>
                        </div>
                    </div>
                </div>

                {/* Back — the profile, so a visitor learns more than a name. */}
                <div className="flip-face flip-face-back flex flex-col rounded-2xl border border-[#1a3d1a]/10 bg-[#1a3d1a] p-7 text-white shadow-sm">
                    <p className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-[#E86A10]">
                        / {member.name} — Profile
                    </p>
                    <h3 className="mt-4 font-serif-display text-2xl leading-tight">
                        {member.role}
                    </h3>
                    <p className="mt-4 text-sm leading-relaxed text-white/70">
                        {member.background ??
                            (member.specialization
                                ? `Works with your dog on ${member.specialization.toLowerCase()}.`
                                : 'Part of the team who sees your dog at every visit.')}
                    </p>
                    <div className="mt-5 space-y-2 text-xs text-white/60">
                        {member.experience_years !== null && (
                            <p>{member.experience_years} years of experience</p>
                        )}
                        {member.qualifications && <p>{member.qualifications}</p>}
                        {member.license_number && <p>License: {member.license_number}</p>}
                    </div>
                    <a
                        href={bookHref}
                        onClick={(event) => event.stopPropagation()}
                        className="mt-auto flex items-center justify-between border-t border-white/15 pt-4 text-sm font-semibold text-white transition-colors duration-200 hover:text-[#E86A10] focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                        Book a visit
                        <ArrowRight className="h-4 w-4 text-[#E86A10]" />
                    </a>
                </div>
            </div>
        </article>
    );
}

/** One client story in the reviews rail. */
function ReviewCard({ review }: { review: (typeof reviews)[number] }) {
    return (
        <article className="flex w-[min(21rem,82vw)] shrink-0 snap-start flex-col rounded-2xl border border-[#1a3d1a]/10 bg-white p-6 shadow-sm sm:w-[22rem]">
            <div className="flex items-center justify-between gap-3">
                <Stars rating={review.rating} />
                <span className="text-[0.68rem] font-semibold text-[#1a3d1a]/40">
                    {review.rating.toFixed(1)}
                </span>
            </div>

            <p className="mt-4 flex-1 text-sm italic leading-relaxed text-[#1a3d1a]/70">
                “{review.quote}”
            </p>

            <div className="mt-5 flex items-center gap-3 border-t border-[#1a3d1a]/10 pt-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EFFDF0] text-sm font-semibold text-[#1a3d1a]">
                    {initials(review.name)}
                </span>
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#1a3d1a]">
                        {review.name}
                    </p>
                    <p className="truncate text-xs text-[#1a3d1a]/55">
                        {review.dog} · {review.detail}
                    </p>
                </div>
            </div>
        </article>
    );
}

export default function Welcome({
    auth,
    canLogin,
    canRegister,
    services,
    team,
    stats,
    clinic,
}: PageProps<{
    canLogin: boolean;
    canRegister: boolean;
    services: PublicService[];
    team: PublicTeamMember[];
    stats: PublicStats;
    clinic: PublicClinic;
}>) {
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

    /*
     * The full menu lives inside the client portal, so "view all services"
     * sends owners straight to it and everyone else to an auth screen — the
     * same sign-up-first rule the booking CTAs use.
     */
    const allServicesHref = isOwner
        ? route('owner.services.index')
        : isSignedIn
          ? route('dashboard')
          : canRegister
            ? route('register')
            : route('login');

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

    /*
     * The header search matches the clinic's live menu, so a visitor who finds
     * a service there reads the same name, price, and length the desk books.
     */
    const searchIndex = services.map((service) => ({
        title: service.service_name,
        description: service.description ?? service.category,
    }));

    const normalizedQuery = searchQuery.trim().toLowerCase();
    const searchResults =
        normalizedQuery === ''
            ? searchIndex
            : searchIndex.filter((service) =>
                  `${service.title} ${service.description}`
                      .toLowerCase()
                      .includes(normalizedQuery),
              );

    /* The navbar's "Vaccinations" link lands on the first vaccination card. */
    const vaccinationAnchorId = services.find(
        (service) => service.category === 'Vaccination',
    )?.id;

    /* One card per press, so the reviews rail moves a readable amount. */
    const reviewsRef = useRef<HTMLDivElement>(null);

    const scrollReviews = (direction: -1 | 1) => {
        reviewsRef.current?.scrollBy({
            left: direction * 340,
            behavior: 'smooth',
        });
    };

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
                className="flex min-h-screen flex-col bg-[#EFFDF0] font-inter text-slate-900 antialiased selection:bg-[#1a3d1a]/10"
            >
                {/* -----------------------------------------------------------
                    Header — logo, centre nav, and quick actions.

                    Below `sm` the three icon actions collapse into the mobile
                    menu, which labels them instead of leaving them as cryptic
                    glyphs on a narrow bar.
                ------------------------------------------------------------ */}
                <header
                    ref={headerRef}
                    className="sticky top-0 z-40 shrink-0 animate-fade-in border-b border-[#1a3d1a]/10 bg-[#EFFDF0]/90 px-4 py-4 backdrop-blur-md anim-delay-100 sm:px-6 lg:px-12"
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

                            {/*
                                Sign-in actions. Below `sm` only the primary
                                one shows, so the logo, the button, and the
                                hamburger still fit on a phone.
                            */}
                            {isSignedIn ? (
                                <a
                                    href={route('dashboard')}
                                    className="inline-flex h-10 items-center justify-center rounded-full bg-[#1a3d1a] px-5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#2a5a2a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]"
                                >
                                    My portal
                                </a>
                            ) : (
                                <>
                                    {canLogin && (
                                        <a
                                            href={route('login')}
                                            className="hidden h-10 items-center justify-center rounded-full border border-[#1a3d1a]/15 bg-white/60 px-5 text-sm font-semibold text-[#1a3d1a] transition-colors duration-200 hover:bg-white sm:inline-flex focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]"
                                        >
                                            Log in
                                        </a>
                                    )}
                                    {canRegister && (
                                        <a
                                            href={route('register')}
                                            className="inline-flex h-10 items-center justify-center rounded-full bg-[#E86A10] px-5 text-sm font-semibold text-white shadow-lg shadow-[#E86A10]/25 transition-colors duration-200 hover:bg-[#d45e0d] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E86A10]"
                                        >
                                            Register
                                        </a>
                                    )}
                                </>
                            )}

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
                                                    href={route('register')}
                                                    onClick={closeOverlays}
                                                    className="flex items-center justify-center gap-2 rounded-xl bg-[#E86A10] px-4 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#d45e0d]"
                                                >
                                                    Register
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

                <section className="relative flex min-h-[calc(100svh_-_4.5rem)] flex-1 flex-col overflow-hidden">
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

                        <div className="mt-6 flex animate-fade-up items-center justify-between px-6 anim-delay-700">
                            <div className="flex items-center gap-3">
                                <AvatarStack size="h-8 w-8" />
                                <div>
                                    <p className="text-lg font-semibold leading-none text-[#1a3d1a]">
                                        {compactCount(stats.pets_cared_for)}
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
                                        {stats.rating === null
                                            ? '—'
                                            : stats.rating.toFixed(1)}
                                    </p>
                                    <p className="mt-0.5 text-[11px] text-gray-500">
                                        Owner rating
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto">
                            <BottomGallery
                                petsCaredFor={stats.pets_cared_for}
                                rating={stats.rating}
                            />
                        </div>
                    </div>

                    {/* -------------------------------------------------------
                        Tablet and desktop — centred headline over the photos
                        pinned to the bottom edge.
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

                        <div className="absolute inset-x-0 bottom-0 z-10">
                            <BottomGallery
                                withOverlays
                                petsCaredFor={stats.pets_cared_for}
                                rating={stats.rating}
                            />
                        </div>
                    </div>
                </section>

                {/* -----------------------------------------------------------
                    At a glance — the numbers a visitor looks for first, on a
                    band that separates the hero from the page below it.
                ------------------------------------------------------------ */}
                <section
                    aria-label="The clinic at a glance"
                    className="border-y border-[#1a3d1a]/10 bg-white/50"
                >
                    <div className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-y-10 px-4 py-12 sm:px-6 lg:grid-cols-4 lg:px-8 lg:py-14">
                        <Reveal className="border-l border-[#1a3d1a]/10 pl-5 sm:pl-6">
                            <p className="font-serif-display text-4xl leading-none text-[#1a3d1a] sm:text-5xl">
                                <CountUp end={stats.pets_cared_for} />
                            </p>
                            <p className="mt-2 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#1a3d1a]/45">
                                Pets cared for
                            </p>
                        </Reveal>

                        <Reveal
                            delay={80}
                            className="border-l border-[#1a3d1a]/10 pl-5 sm:pl-6"
                        >
                            <p className="font-serif-display text-4xl leading-none text-[#1a3d1a] sm:text-5xl">
                                {stats.rating === null ? (
                                    '—'
                                ) : (
                                    <CountUp end={stats.rating} decimals={1} />
                                )}
                            </p>
                            <p className="mt-2 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#1a3d1a]/45">
                                {stats.rating_count > 0
                                    ? `Owner rating · ${stats.rating_count} review${
                                          stats.rating_count === 1 ? '' : 's'
                                      }`
                                    : 'Owner rating'}
                            </p>
                        </Reveal>

                        <Reveal
                            delay={160}
                            className="border-l border-[#1a3d1a]/10 pl-5 sm:pl-6"
                        >
                            <p className="font-serif-display text-4xl leading-none text-[#1a3d1a] sm:text-5xl">
                                <CountUp end={services.length} />
                            </p>
                            <p className="mt-2 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#1a3d1a]/45">
                                Services on the menu
                            </p>
                        </Reveal>

                        <Reveal
                            delay={240}
                            className="border-l border-[#1a3d1a]/10 pl-5 sm:pl-6"
                        >
                            <p className="font-serif-display text-4xl leading-none text-[#E86A10] sm:text-5xl">
                                {shortDaysOpen(clinic.days_open)}
                            </p>
                            <p className="mt-2 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#1a3d1a]/45">
                                {clockTime(clinic.opening_time)} –{' '}
                                {clockTime(clinic.closing_time)}
                            </p>
                        </Reveal>
                    </div>
                </section>

                {/* -----------------------------------------------------------
                    Services — the live menu, in the same shape the portal's
                    menu uses.
                ------------------------------------------------------------ */}
                <section
                    id="services"
                    className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
                >
                    <div className="mx-auto w-full max-w-7xl">
                        <Reveal>
                            <SectionMarker>01 — Services</SectionMarker>

                            <div className="mt-6 grid gap-8 lg:grid-cols-12">
                                <div className="lg:col-span-7">
                                    <h2 className="font-serif-display text-4xl leading-[1.05] text-[#1a3d1a] sm:text-5xl">
                                        Everything your dog needs,
                                        <br />
                                        <span className="text-[#E86A10]">
                                            under one roof.
                                        </span>
                                    </h2>
                                </div>

                                <div className="flex flex-col justify-end lg:col-span-4 lg:col-start-9">
                                    <p className="text-sm leading-relaxed text-[#1a3d1a]/60">
                                        The menu the front desk books from,
                                        with the clinic's own prices and visit
                                        lengths. Every visit ends with a record
                                        in your dog's file.
                                    </p>
                                    <a
                                        href={bookHref}
                                        className={`${primaryButtonClass} mt-5 self-start`}
                                    >
                                        Book a visit
                                        <ArrowRight className="h-4 w-4" />
                                    </a>
                                    <a
                                        href={allServicesHref}
                                        className="mt-3 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-[#E86A10] transition-colors duration-200 hover:text-[#1a3d1a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]"
                                    >
                                        View all services
                                        <ArrowRight className="h-4 w-4" />
                                    </a>
                                </div>
                            </div>
                        </Reveal>

                        {services.length === 0 ? (
                            <Reveal className="mt-12">
                                <p className="rounded-2xl border border-dashed border-[#1a3d1a]/15 bg-white/60 px-5 py-6 text-sm leading-relaxed text-[#1a3d1a]/60">
                                    The service menu is being updated. Please
                                    check back shortly, or call the clinic and
                                    the desk will help.
                                </p>
                            </Reveal>
                        ) : (
                            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                                {services
                                    .slice(0, FEATURED_SERVICE_COUNT)
                                    .map((service, index) => (
                                        <Reveal
                                            key={service.id}
                                            delay={index * 80}
                                            className="h-full"
                                        >
                                            <ServiceCard
                                                service={service}
                                                index={index}
                                                photo={
                                                    service.image ??
                                                    servicePhotos[
                                                        index %
                                                            servicePhotos.length
                                                    ]
                                                }
                                                bookHref={bookHref}
                                                anchorId={
                                                    service.id ===
                                                    vaccinationAnchorId
                                                        ? 'vaccinations'
                                                        : undefined
                                                }
                                            />
                                        </Reveal>
                                    ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* -----------------------------------------------------------
                    Care team — who the owner hands their dog to.
                ------------------------------------------------------------ */}
                <section
                    id="team"
                    className="border-t border-[#1a3d1a]/10 bg-white/50 px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
                >
                    <div className="mx-auto w-full max-w-7xl">
                        <Reveal>
                            <SectionMarker>02 — Care team</SectionMarker>

                            <div className="mt-6 grid gap-8 lg:grid-cols-12">
                                <div className="lg:col-span-7">
                                    <h2 className="font-serif-display text-4xl leading-[1.05] text-[#1a3d1a] sm:text-5xl">
                                        The people who'll
                                        <br />
                                        <span className="text-[#E86A10]">
                                            see your dog.
                                        </span>
                                    </h2>
                                </div>

                                <div className="flex flex-col justify-end lg:col-span-4 lg:col-start-9">
                                    <p className="text-sm leading-relaxed text-[#1a3d1a]/60">
                                        The same faces at every visit, so your
                                        dog is handled by someone who already
                                        knows its history. Portraits come from
                                        the clinic's staff records.
                                    </p>
                                </div>
                            </div>
                        </Reveal>

                        {team.length === 0 ? (
                            <Reveal className="mt-12">
                                <p className="rounded-2xl border border-dashed border-[#1a3d1a]/15 bg-white/60 px-5 py-6 text-sm leading-relaxed text-[#1a3d1a]/60">
                                    Team profiles are being updated. The front
                                    desk can tell you who is on duty today.
                                </p>
                            </Reveal>
                        ) : (
                            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                                {team.map((member, index) => (
                                    <Reveal
                                        key={member.id}
                                        delay={index * 80}
                                        className="h-full"
                                    >
                                        <CareTeamMemberCard
                                            member={member}
                                            index={index}
                                            bookHref={bookHref}
                                        />
                                    </Reveal>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* -----------------------------------------------------------
                    Client stories — a rail rather than a grid, so the page
                    keeps the hero's horizontal rhythm.
                ------------------------------------------------------------ */}
                <section
                    id="reviews"
                    className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
                >
                    <div className="mx-auto w-full max-w-7xl">
                        <Reveal>
                            <SectionMarker>03 — Client stories</SectionMarker>

                            <div className="mt-6 grid gap-8 lg:grid-cols-12">
                                <div className="lg:col-span-7">
                                    <h2 className="font-serif-display text-4xl leading-[1.05] text-[#1a3d1a] sm:text-5xl">
                                        Loved by pets and
                                        <br />
                                        <span className="text-[#E86A10]">
                                            their people.
                                        </span>
                                    </h2>
                                </div>

                                <div className="flex flex-col justify-end lg:col-span-4 lg:col-start-9">
                                    <p className="text-sm leading-relaxed text-[#1a3d1a]/60">
                                        What owners say after a visit. Use the
                                        arrows to move along the rail.
                                    </p>

                                    <div className="mt-5 flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => scrollReviews(-1)}
                                            aria-label="Previous reviews"
                                            className="flex h-11 w-11 items-center justify-center rounded-full border border-[#1a3d1a]/15 bg-white text-[#1a3d1a] transition-colors duration-200 hover:bg-[#EFFDF0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => scrollReviews(1)}
                                            aria-label="Next reviews"
                                            className="flex h-11 w-11 items-center justify-center rounded-full border border-[#1a3d1a]/15 bg-white text-[#1a3d1a] transition-colors duration-200 hover:bg-[#EFFDF0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Reveal>

                        <div
                            ref={reviewsRef}
                            className="mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                        >
                            {reviews.map((review) => (
                                <ReviewCard
                                    key={review.name}
                                    review={review}
                                />
                            ))}
                        </div>
                    </div>
                </section>

                {/* -----------------------------------------------------------
                    Booking — the steps the portal's flow actually takes,
                    plus the clinic's own address and opening hours.
                ------------------------------------------------------------ */}
                <section
                    id="visit"
                    className="border-t border-[#1a3d1a]/10 bg-white/50 px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
                >
                    <div className="mx-auto w-full max-w-7xl">
                        <Reveal>
                            <SectionMarker>04 — Book a visit</SectionMarker>
                            <h2 className="mt-6 max-w-3xl font-serif-display text-4xl leading-[1.05] text-[#1a3d1a] sm:text-5xl lg:text-6xl">
                                Two taps from the{' '}
                                <span className="text-[#E86A10]">
                                    front desk.
                                </span>
                            </h2>
                        </Reveal>

                        <div className="mt-12 grid gap-6 lg:grid-cols-12">
                            <Reveal className="lg:col-span-7">
                                <div className="flex h-full flex-col rounded-3xl border border-[#1a3d1a]/10 bg-white p-6 shadow-sm sm:p-8">
                                    <p className="font-serif-display text-2xl leading-tight text-[#1a3d1a]">
                                        How booking works
                                    </p>

                                    <ol className="mt-6 space-y-5">
                                        <li className="flex gap-4">
                                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EFFDF0] font-serif-display text-sm text-[#1a3d1a]">
                                                1
                                            </span>
                                            <span className="min-w-0">
                                                <span className="block text-sm font-semibold text-[#1a3d1a]">
                                                    Pick a service
                                                </span>
                                                <span className="mt-1 block text-sm leading-relaxed text-[#1a3d1a]/60">
                                                    The full menu, with the
                                                    clinic's prices and visit
                                                    lengths.
                                                </span>
                                            </span>
                                        </li>
                                        <li className="flex gap-4">
                                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EFFDF0] font-serif-display text-sm text-[#1a3d1a]">
                                                2
                                            </span>
                                            <span className="min-w-0">
                                                <span className="block text-sm font-semibold text-[#1a3d1a]">
                                                    Request a time
                                                </span>
                                                <span className="mt-1 block text-sm leading-relaxed text-[#1a3d1a]/60">
                                                    Choose a day and slot inside
                                                    the clinic's opening hours.
                                                    The desk sees it straight
                                                    away.
                                                </span>
                                            </span>
                                        </li>
                                        <li className="flex gap-4">
                                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EFFDF0] font-serif-display text-sm text-[#1a3d1a]">
                                                3
                                            </span>
                                            <span className="min-w-0">
                                                <span className="block text-sm font-semibold text-[#1a3d1a]">
                                                    Come in
                                                </span>
                                                <span className="mt-1 block text-sm leading-relaxed text-[#1a3d1a]/60">
                                                    We confirm your slot, and
                                                    your dog's record is ready
                                                    before you arrive.
                                                </span>
                                            </span>
                                        </li>
                                    </ol>

                                    <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-[#1a3d1a]/10 pt-6">
                                        <a
                                            href={bookHref}
                                            className={primaryButtonClass}
                                        >
                                            Book a visit
                                            <ArrowRight className="h-4 w-4" />
                                        </a>
                                        <a
                                            href="#services"
                                            className={secondaryButtonClass}
                                        >
                                            Browse the menu
                                        </a>
                                    </div>

                                    <p className="mt-4 text-xs leading-relaxed text-[#1a3d1a]/45">
                                        {isSignedIn
                                            ? 'Your portal keeps every visit, price, and reminder in one place.'
                                            : 'New clients create an account in a minute — no card needed to request a visit.'}
                                    </p>
                                </div>
                            </Reveal>

                            <Reveal delay={120} className="lg:col-span-5">
                                <div className="flex h-full flex-col gap-6">
                                    <div className="rounded-3xl border border-[#1a3d1a]/10 bg-white p-6 shadow-sm">
                                        <p className="flex items-center gap-2 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#1a3d1a]/40">
                                            <MapPin className="h-3.5 w-3.5 text-[#E86A10]" />
                                            Find us
                                        </p>
                                        <p className="mt-3 font-serif-display text-2xl leading-tight text-[#1a3d1a]">
                                            {clinic.clinic_name}
                                        </p>
                                        <p className="mt-2 text-sm leading-relaxed text-[#1a3d1a]/60">
                                            {clinic.address_line}
                                            <br />
                                            {[
                                                clinic.city,
                                                clinic.province,
                                                clinic.zip_code,
                                            ]
                                                .filter(Boolean)
                                                .join(', ')}
                                        </p>

                                        <div className="mt-4 space-y-2">
                                            <a
                                                href={`tel:${clinic.contact_number}`}
                                                className="flex items-center gap-2 text-sm font-semibold text-[#1a3d1a] transition-colors duration-200 hover:text-[#E86A10] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]"
                                            >
                                                <Phone className="h-4 w-4 text-[#E86A10]" />
                                                {clinic.contact_number}
                                            </a>
                                            <a
                                                href={`mailto:${clinic.email}`}
                                                className="flex items-center gap-2 break-all text-sm font-semibold text-[#1a3d1a] transition-colors duration-200 hover:text-[#E86A10] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]"
                                            >
                                                <Mail className="h-4 w-4 shrink-0 text-[#E86A10]" />
                                                {clinic.email}
                                            </a>
                                        </div>
                                    </div>

                                    <div className="rounded-3xl border border-[#1a3d1a]/10 bg-white p-6 shadow-sm">
                                        <p className="flex items-center gap-2 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#1a3d1a]/40">
                                            <Clock className="h-3.5 w-3.5 text-[#E86A10]" />
                                            Opening hours
                                        </p>
                                        <p className="mt-3 font-serif-display text-2xl leading-tight text-[#1a3d1a]">
                                            {clinic.days_open}
                                        </p>
                                        <p className="mt-2 text-sm text-[#1a3d1a]/60">
                                            {clockTime(clinic.opening_time)} –{' '}
                                            {clockTime(clinic.closing_time)}
                                        </p>
                                        <p className="mt-4 rounded-xl bg-[#EFFDF0]/70 px-4 py-3 text-xs leading-relaxed text-[#1a3d1a]/60">
                                            Urgent cases are seen during
                                            opening hours — call the clinic and
                                            the desk will fit you in.
                                        </p>
                                    </div>
                                </div>
                            </Reveal>
                        </div>
                    </div>
                </section>

                {/* -----------------------------------------------------------
                    Footer — the clinic's own details, so a visitor never has
                    to hunt for a phone number.
                ------------------------------------------------------------ */}
                <footer className="bg-[#1a3d1a] text-white">
                    <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
                            <div className="lg:col-span-4">
                                <a
                                    href="#top"
                                    className="flex items-center gap-2.5 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                                >
                                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
                                        <PawPrint className="h-5 w-5" />
                                    </span>
                                    <span className="font-serif-display text-2xl leading-none">
                                        My
                                        <span className="text-[#E86A10]">
                                            Vet
                                        </span>
                                    </span>
                                </a>

                                <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
                                    Modern veterinary care for the whole
                                    family, with in-house lab work and records
                                    you can read from your own portal.
                                </p>
                            </div>

                            <div className="lg:col-span-3">
                                <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-white/40">
                                    Services
                                </p>                                <ul className="mt-4 space-y-2.5">
                                    {services
                                        .slice(0, FOOTER_SERVICE_COUNT)
                                        .map((service) => (
                                            <li key={service.id}>
                                                <a
                                                    href="#services"
                                                    className="text-sm text-white/70 transition-colors duration-200 hover:text-[#E86A10]"
                                                >
                                                    {service.service_name}
                                                </a>
                                            </li>
                                        ))}
                                    <li>
                                        <a
                                            href={allServicesHref}
                                            className="text-sm font-semibold text-white/80 transition-colors duration-200 hover:text-[#E86A10]"
                                        >
                                            View all services →
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href={bookHref}
                                            className="text-sm font-semibold text-[#E86A10] transition-colors duration-200 hover:text-white"
                                        >
                                            Book a visit →
                                        </a>
                                    </li>
                                </ul>
                            </div>

                            <div className="lg:col-span-2">
                                <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-white/40">
                                    Clinic
                                </p>
                                <ul className="mt-4 space-y-2.5">
                                    <li>
                                        <a
                                            href="#team"
                                            className="text-sm text-white/70 transition-colors duration-200 hover:text-[#E86A10]"
                                        >
                                            Our team
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href="#reviews"
                                            className="text-sm text-white/70 transition-colors duration-200 hover:text-[#E86A10]"
                                        >
                                            Reviews
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href={isSignedIn ? route('dashboard') : route('login')}
                                            className="text-sm text-white/70 transition-colors duration-200 hover:text-[#E86A10]"
                                        >
                                            {isSignedIn
                                                ? 'My portal'
                                                : 'Log in'}
                                        </a>
                                    </li>
                                </ul>
                            </div>

                            <div className="lg:col-span-3">
                                <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-white/40">
                                    Visit us
                                </p>
                                <p className="mt-4 text-sm leading-relaxed text-white/70">
                                    {clinic.address_line}
                                    <br />
                                    {[
                                        clinic.city,
                                        clinic.province,
                                        clinic.zip_code,
                                    ]
                                        .filter(Boolean)
                                        .join(', ')}
                                </p>
                                <p className="mt-3 text-sm text-white/70">
                                    {shortDaysOpen(clinic.days_open)},{' '}
                                    {clockTime(clinic.opening_time)} –{' '}
                                    {clockTime(clinic.closing_time)}
                                </p>
                                <a
                                    href={`tel:${clinic.contact_number}`}
                                    className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-white transition-colors duration-200 hover:text-[#E86A10]"
                                >
                                    <Phone className="h-4 w-4" />
                                    {clinic.contact_number}
                                </a>
                            </div>
                        </div>

                        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
                            <p>
                                © {new Date().getFullYear()} {clinic.clinic_name}
                            </p>
                            <p className="text-white/40">
                                {clinic.email}
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
