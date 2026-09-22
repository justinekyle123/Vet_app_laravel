import CountUp from '@/Components/CountUp';
import Icon from '@/Components/Icon';
import Marquee from '@/Components/Marquee';
import Reveal from '@/Components/Reveal';
import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const accreditations = [
    'AAHA Accredited',
    'Fear-Free Certified',
    'Board-Certified Surgeons',
    'In-House Diagnostic Lab',
    '24/7 Emergency Team',
    'Digital Records',
];

const services = [
    {
        icon: 'heart',
        title: 'Wellness Exams',
        description:
            'Routine check-ups that catch small problems long before they become expensive ones.',
    },
    {
        icon: 'shield',
        title: 'Vaccinations',
        description:
            'Core and lifestyle vaccines, with automatic reminders the moment a booster is due.',
    },
    {
        icon: 'flask',
        title: 'In-House Lab',
        description:
            'Bloodwork and diagnostics back in minutes rather than days, so you never need a second trip.',
    },
    {
        icon: 'scissors',
        title: 'Surgery & Dental',
        description:
            'From routine neutering to advanced soft-tissue procedures and scale-and-polish cleanings.',
    },
    {
        icon: 'clock',
        title: '24/7 Emergency',
        description:
            'A veterinarian on call every hour of the year, because accidents keep no schedule.',
    },
    {
        icon: 'sparkles',
        title: 'Grooming & Boarding',
        description:
            'Overnight care and grooming staffed by the same people your pet already trusts.',
    },
] as const;

const stats = [
    { value: 12000, suffix: '+', label: 'Pets cared for' },
    { value: 25, suffix: '', label: 'Years in practice' },
    { value: 98, suffix: '%', label: 'Client satisfaction' },
    { value: 24, suffix: '/7', label: 'Emergency cover' },
];

const steps = [
    {
        title: 'Book in seconds',
        description:
            'Choose a slot online or call us. You get an instant confirmation, not a place in a callback queue.',
    },
    {
        title: 'Meet your vet',
        description:
            'We pair you with the same veterinarian each visit, so somebody always knows your pet history.',
    },
    {
        title: 'Care that continues',
        description:
            'Notes, reminders and full records land in your account right after the appointment ends.',
    },
];

const testimonials = [
    {
        quote: 'They squeezed Biscuit in the same afternoon I called. The lab results were ready before we got home.',
        name: 'Amara Okafor',
        detail: 'Biscuit, 4-year-old beagle',
    },
    {
        quote: 'The reminder system is the reason our cat is finally up to date on everything. Nothing slipped through.',
        name: 'Daniel Reyes',
        detail: 'Miso, 7-year-old tabby',
    },
    {
        quote: 'Three clinics told us to wait. Here they operated the next morning and walked us through every step.',
        name: 'Priya Raman',
        detail: 'Nori, 2-year-old corgi',
    },
    {
        quote: 'Seeing the same vet every time matters. She remembered the allergy before I had to mention it.',
        name: 'Tom Vandenberg',
        detail: 'Juno, 6-year-old labrador',
    },
    {
        quote: 'Emergency line answered at 2am on a Sunday. I will never take that for granted again.',
        name: 'Sofia Marchetti',
        detail: 'Pumpkin, 9-year-old maine coon',
    },
];

const faqs = [
    {
        question: 'Do I need an appointment, or can I walk in?',
        answer: 'Booked appointments get priority, and you can grab one online in under a minute. Genuine emergencies are always seen immediately, appointment or not.',
    },
    {
        question: 'What should I bring to a first visit?',
        answer: 'Any previous vaccination records, a list of current medications, and your pet on a secure lead or in a carrier. If you have them, prior lab results save us repeating tests.',
    },
    {
        question: 'Do you treat exotic pets?',
        answer: 'We routinely see rabbits, guinea pigs, hamsters and birds. For reptiles and aquatics we will happily refer you to a specialist we trust rather than guess.',
    },
    {
        question: 'How does after-hours emergency care work?',
        answer: 'Our emergency line connects you to the on-call vet directly, day or night. If the case needs hospitalisation, we admit your pet on the spot and update you the same night.',
    },
    {
        question: 'Can I get my pet records digitally?',
        answer: 'Yes. Every visit note, lab result and treatment plan is attached to your account, and you can download or share the full history whenever you change clinics.',
    },
];

export default function Welcome({
    auth,
    canLogin,
    canRegister,
}: PageProps<{ canLogin: boolean; canRegister: boolean }>) {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [openFaq, setOpenFaq] = useState<number | null>(0);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 12);

        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { label: 'Services', href: '#services' },
        { label: 'How it works', href: '#how-it-works' },
        { label: 'Reviews', href: '#reviews' },
        { label: 'FAQ', href: '#faq' },
    ];

    return (
        <>
            <Head title="MyVet — Modern veterinary care for the whole family" />

            <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900 antialiased selection:bg-brand-200 selection:text-brand-950">
                {/* ---------------------------------------------------------------
                    Header — transparent over the hero, then frosts on scroll.
                ---------------------------------------------------------------- */}
                <header
                    className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
                        isScrolled
                            ? 'border-b border-slate-200/70 bg-white/80 shadow-sm backdrop-blur-xl'
                            : 'border-b border-transparent bg-transparent'
                    }`}
                >
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6 lg:px-8">
                        <a
                            href="#top"
                            className="group flex items-center gap-2.5 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                        >
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-600/25 transition-transform duration-300 group-hover:-rotate-6">
                                <Icon name="paw" className="h-5 w-5" />
                            </span>
                            <span className="text-lg font-bold tracking-tight">
                                My<span className="text-brand-600">Vet</span>
                            </span>
                        </a>

                        <nav className="hidden items-center gap-1 lg:flex">
                            {navLinks.map((link) => (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    className="group relative rounded-lg px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors duration-200 hover:text-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                                >
                                    {link.label}
                                    {/* Underline grows from the left on hover. */}
                                    <span className="pointer-events-none absolute inset-x-3.5 bottom-1 h-0.5 origin-left scale-x-0 rounded-full bg-brand-500 transition-transform duration-300 group-hover:scale-x-100" />
                                </a>
                            ))}
                        </nav>

                        <div className="flex items-center gap-2 sm:gap-3">
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    {canLogin && (
                                        <Link
                                            href={route('clerk.signin')}
                                            className="hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors duration-200 hover:text-brand-700 sm:block focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                                        >
                                            Log in
                                        </Link>
                                    )}
                                    {canRegister && (
                                        <Link
                                            href={route('clerk.signup')}
                                            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                                        >
                                            Book a visit
                                        </Link>
                                    )}
                                </>
                            )}

                            <button
                                type="button"
                                onClick={() => setIsMenuOpen((open) => !open)}
                                aria-expanded={isMenuOpen}
                                aria-controls="mobile-nav"
                                aria-label="Toggle navigation menu"
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/70 text-slate-700 transition-colors duration-200 hover:bg-white lg:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                            >
                                <Icon
                                    name={isMenuOpen ? 'close' : 'menu'}
                                    className="h-5 w-5"
                                />
                            </button>
                        </div>
                    </div>

                    {/* Mobile nav — grid-rows trick animates height without a fixed max-height. */}
                    <div
                        id="mobile-nav"
                        className={`grid overflow-hidden border-slate-200/70 bg-white/95 backdrop-blur-xl transition-all duration-500 ease-out lg:hidden ${
                            isMenuOpen
                                ? 'grid-rows-[1fr] border-t opacity-100'
                                : 'grid-rows-[0fr] opacity-0'
                        }`}
                    >
                        <div className="overflow-hidden">
                            <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6">
                                {navLinks.map((link) => (
                                    <a
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setIsMenuOpen(false)}
                                        className="rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition-colors duration-200 hover:bg-brand-50 hover:text-brand-700"
                                    >
                                        {link.label}
                                    </a>
                                ))}

                                {!auth.user && canLogin && (
                                    <Link
                                        href={route('clerk.signin')}
                                        className="rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition-colors duration-200 hover:bg-brand-50 hover:text-brand-700"
                                    >
                                        Log in
                                    </Link>
                                )}
                            </nav>
                        </div>
                    </div>
                </header>

                {/* ---------------------------------------------------------------
                    Hero
                ---------------------------------------------------------------- */}
                <section
                    id="top"
                    className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-slate-50 pb-20 pt-32 sm:pb-28 sm:pt-40"
                >
                    {/* Ambient blobs. aria-hidden so screen readers skip decoration. */}
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 overflow-hidden"
                    >
                        <div className="absolute -left-24 -top-24 h-72 w-72 animate-blob rounded-full bg-brand-300/40 blur-3xl" />
                        <div className="absolute right-0 top-8 h-80 w-80 animate-blob-delayed rounded-full bg-amber-200/40 blur-3xl" />
                        <div className="absolute bottom-0 left-1/3 h-64 w-64 animate-blob rounded-full bg-sky-200/40 blur-3xl" />
                    </div>

                    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-12">
                            <div className="animate-fade-in text-center lg:text-left">
                                <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-brand-700 shadow-sm backdrop-blur">
                                    <span className="relative flex h-2 w-2">
                                        <span className="absolute inline-flex h-full w-full animate-pulse-soft rounded-full bg-brand-500" />
                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-600" />
                                    </span>
                                    Urgent care open now
                                </span>

                                <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                                    Veterinary care that
                                    <span className="bg-gradient-to-r from-brand-600 via-brand-500 to-teal-400 bg-clip-text text-transparent">
                                        {' '}
                                        never rushes
                                    </span>{' '}
                                    your pet
                                </h1>

                                <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg lg:mx-0">
                                    Modern diagnostics, unhurried appointments and
                                    one team that knows your animal by name.
                                    Book online in under a minute.
                                </p>

                                <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
                                    {canRegister && (
                                        <Link
                                            href={route('clerk.signup')}
                                            className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand-600/35 sm:w-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                                        >
                                            Book an appointment
                                            <Icon
                                                name="arrowRight"
                                                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                                            />
                                        </Link>
                                    )}

                                    <a
                                        href="#services"
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-6 py-3.5 text-sm font-semibold text-slate-700 backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md sm:w-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                                    >
                                        Explore services
                                    </a>
                                </div>

                                <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
                                    <div className="flex -space-x-3">
                                        {[
                                            'from-brand-400 to-brand-600',
                                            'from-amber-300 to-amber-500',
                                            'from-sky-300 to-sky-500',
                                            'from-rose-300 to-rose-500',
                                        ].map((gradient) => (
                                            <span
                                                key={gradient}
                                                className={`h-9 w-9 rounded-full bg-gradient-to-br ${gradient} ring-2 ring-white`}
                                            />
                                        ))}
                                    </div>
                                    <div className="text-center sm:text-left">
                                        <div className="flex justify-center gap-0.5 sm:justify-start">
                                            {Array.from({ length: 5 }).map((_, index) => (
                                                <Icon
                                                    key={index}
                                                    name="star"
                                                    filled
                                                    className="h-3.5 w-3.5 text-amber-400"
                                                />
                                            ))}
                                        </div>
                                        <p className="mt-1 text-xs font-medium text-slate-500">
                                            Rated 4.9 from 2,400+ pet owners
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Product-style preview, built from divs so there is no image to load. */}
                            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
                                <div className="relative rounded-[28px] border border-white/60 bg-white/70 p-5 shadow-2xl shadow-brand-900/10 backdrop-blur-xl sm:p-6">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 to-brand-200 text-brand-700">
                                                <Icon name="paw" className="h-5 w-5" />
                                            </span>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">
                                                    Biscuit
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    Beagle · 4 yrs · 12.4 kg
                                                </p>
                                            </div>
                                        </div>
                                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                                            Healthy
                                        </span>
                                    </div>

                                    <div className="mt-5 rounded-2xl border border-slate-100 bg-white p-4">
                                        <div className="flex items-baseline justify-between">
                                            <p className="text-xs font-medium text-slate-500">
                                                Weight trend
                                            </p>
                                            <p className="text-xs font-semibold text-emerald-600">
                                                +2.1% this year
                                            </p>
                                        </div>
                                        {/* Simple bar sparkline. */}
                                        <div className="mt-3 flex h-16 items-end gap-1.5">
                                            {[38, 52, 44, 66, 58, 78, 71, 92].map(
                                                (height, index) => (
                                                    <div
                                                        key={index}
                                                        style={{ height: `${height}%` }}
                                                        className="flex-1 rounded-t-md bg-gradient-to-t from-brand-200 to-brand-500 transition-all duration-500 hover:from-brand-300 hover:to-brand-600"
                                                    />
                                                ),
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4">
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                                            <Icon name="calendar" className="h-5 w-5" />
                                        </span>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-slate-900">
                                                Annual booster
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                Tuesday, 10:30 — Dr. Mensah
                                            </p>
                                        </div>
                                        <span className="ml-auto hidden shrink-0 rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white sm:block">
                                            Confirmed
                                        </span>
                                    </div>
                                </div>

                                {/* Floating accents. */}
                                <div className="absolute -right-3 -top-5 animate-float sm:-right-6">
                                    <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-white px-3.5 py-2.5 shadow-xl shadow-slate-900/10">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                                            <Icon name="shield" className="h-4 w-4" />
                                        </span>
                                        <div>
                                            <p className="text-[11px] font-semibold text-slate-900">
                                                Vaccine due
                                            </p>
                                            <p className="text-[10px] text-slate-500">
                                                in 3 days
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="absolute -bottom-5 -left-3 animate-float-delayed sm:-left-6">
                                    <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-white px-3.5 py-2.5 shadow-xl shadow-slate-900/10">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                            <Icon name="check" className="h-4 w-4" />
                                        </span>
                                        <div>
                                            <p className="text-[11px] font-semibold text-slate-900">
                                                Lab results ready
                                            </p>
                                            <p className="text-[10px] text-slate-500">
                                                12 minutes
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ---------------------------------------------------------------
                    Accreditation marquee. Pauses while hovered.
                ---------------------------------------------------------------- */}
                <section className="border-y border-slate-200 bg-white py-6">
                    <Marquee className="mask-fade-x" speed={38}>
                        {accreditations.map((item) => (
                            <span
                                key={item}
                                className="flex shrink-0 items-center gap-3 px-6 text-sm font-semibold uppercase tracking-wider text-slate-400 transition-colors duration-300 hover:text-brand-600 sm:px-8"
                            >
                                <Icon name="check" className="h-4 w-4 text-brand-500" />
                                {item}
                            </span>
                        ))}
                    </Marquee>
                </section>

                {/* ---------------------------------------------------------------
                    Stats
                ---------------------------------------------------------------- */}
                <section className="bg-white py-16 sm:py-20">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
                            {stats.map((stat, index) => (
                                <Reveal key={stat.label} delay={index * 90}>
                                    <div className="text-center lg:text-left">
                                        <p className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                                            <CountUp
                                                end={stat.value}
                                                suffix={stat.suffix}
                                            />
                                        </p>
                                        <p className="mt-2 text-xs font-medium uppercase tracking-wider text-slate-500 sm:text-sm">
                                            {stat.label}
                                        </p>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ---------------------------------------------------------------
                    Services
                ---------------------------------------------------------------- */}
                <section id="services" className="bg-slate-50 py-20 sm:py-28">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <Reveal>
                            <div className="mx-auto max-w-2xl text-center">
                                <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">
                                    What we do
                                </span>
                                <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                                    Everything under one roof
                                </h2>
                                <p className="mt-4 text-base leading-relaxed text-slate-600">
                                    No referrals, no driving across town. Diagnostics,
                                    surgery and aftercare all happen in the same building.
                                </p>
                            </div>
                        </Reveal>

                        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {services.map((service, index) => (
                                <Reveal
                                    key={service.title}
                                    delay={index * 80}
                                    className="h-full"
                                >
                                    <article className="group h-full rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-200 hover:shadow-2xl hover:shadow-brand-900/10">
                                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 transition-all duration-300 group-hover:scale-110 group-hover:bg-brand-600 group-hover:text-white">
                                            <Icon
                                                name={service.icon}
                                                className="h-6 w-6"
                                            />
                                        </span>
                                        <h3 className="mt-5 text-lg font-bold text-slate-900">
                                            {service.title}
                                        </h3>
                                        <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
                                            {service.description}
                                        </p>
                                        <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">
                                            Learn more
                                            <Icon
                                                name="arrowRight"
                                                className="h-4 w-4"
                                            />
                                        </span>
                                    </article>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ---------------------------------------------------------------
                    How it works
                ---------------------------------------------------------------- */}
                <section id="how-it-works" className="bg-white py-20 sm:py-28">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <Reveal>
                            <div className="mx-auto max-w-2xl text-center">
                                <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">
                                    How it works
                                </span>
                                <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                                    Three steps, no paperwork
                                </h2>
                            </div>
                        </Reveal>

                        <div className="relative mt-16 grid gap-10 md:grid-cols-3">
                            {/* Connector line behind the step markers on wide screens. */}
                            <div
                                aria-hidden="true"
                                className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-brand-200 to-transparent md:block"
                            />

                            {steps.map((step, index) => (
                                <Reveal
                                    key={step.title}
                                    delay={index * 120}
                                    className="relative"
                                >
                                    <div className="flex flex-col items-center text-center">
                                        <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-lg font-bold text-white shadow-lg shadow-brand-600/30 transition-transform duration-300 hover:scale-110">
                                            {index + 1}
                                        </span>
                                        <h3 className="mt-6 text-lg font-bold text-slate-900">
                                            {step.title}
                                        </h3>
                                        <p className="mt-2.5 max-w-xs text-sm leading-relaxed text-slate-600">
                                            {step.description}
                                        </p>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ---------------------------------------------------------------
                    Testimonials — second marquee, travelling the other way.
                ---------------------------------------------------------------- */}
                <section
                    id="reviews"
                    className="overflow-hidden bg-slate-900 py-20 sm:py-28"
                >
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <Reveal>
                            <div className="mx-auto max-w-2xl text-center">
                                <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-400">
                                    Reviews
                                </span>
                                <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                                    Trusted by pet owners
                                </h2>
                                <p className="mt-4 text-base leading-relaxed text-slate-400">
                                    Hover to pause and read. These are unedited.
                                </p>
                            </div>
                        </Reveal>
                    </div>

                    <div className="mt-14">
                        <Marquee className="mask-fade-x" reverse speed={52}>
                            {testimonials.map((testimonial) => (
                                <figure
                                    key={testimonial.name}
                                    className="mx-3 w-[300px] shrink-0 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-brand-400/40 hover:bg-white/10 sm:w-[380px]"
                                >
                                    <div className="flex gap-0.5">
                                        {Array.from({ length: 5 }).map((_, index) => (
                                            <Icon
                                                key={index}
                                                name="star"
                                                filled
                                                className="h-4 w-4 text-amber-400"
                                            />
                                        ))}
                                    </div>
                                    <blockquote className="mt-4 text-sm leading-relaxed text-slate-200">
                                        {`"${testimonial.quote}"`}
                                    </blockquote>
                                    <figcaption className="mt-5 border-t border-white/10 pt-4">
                                        <p className="text-sm font-semibold text-white">
                                            {testimonial.name}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {testimonial.detail}
                                        </p>
                                    </figcaption>
                                </figure>
                            ))}
                        </Marquee>
                    </div>
                </section>

                {/* ---------------------------------------------------------------
                    FAQ accordion
                ---------------------------------------------------------------- */}
                <section id="faq" className="bg-slate-50 py-20 sm:py-28">
                    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                        <Reveal>
                            <div className="text-center">
                                <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">
                                    FAQ
                                </span>
                                <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                                    Questions owners ask us
                                </h2>
                            </div>
                        </Reveal>

                        <div className="mt-12 space-y-3">
                            {faqs.map((faq, index) => {
                                const isOpen = openFaq === index;

                                return (
                                    <Reveal key={faq.question} delay={index * 60}>
                                        <div
                                            className={`overflow-hidden rounded-2xl border bg-white transition-all duration-300 ${
                                                isOpen
                                                    ? 'border-brand-200 shadow-lg shadow-brand-900/5'
                                                    : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                        >
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setOpenFaq(isOpen ? null : index)
                                                }
                                                aria-expanded={isOpen}
                                                className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 sm:px-6"
                                            >
                                                <span className="text-sm font-semibold text-slate-900 sm:text-base">
                                                    {faq.question}
                                                </span>
                                                <span
                                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                                                        isOpen
                                                            ? 'rotate-180 bg-brand-600 text-white'
                                                            : 'bg-slate-100 text-slate-500'
                                                    }`}
                                                >
                                                    <Icon
                                                        name="chevronDown"
                                                        className="h-4 w-4"
                                                    />
                                                </span>
                                            </button>

                                            {/* 0fr → 1fr animates to the content's natural height. */}
                                            <div
                                                className={`grid transition-all duration-500 ease-out ${
                                                    isOpen
                                                        ? 'grid-rows-[1fr] opacity-100'
                                                        : 'grid-rows-[0fr] opacity-0'
                                                }`}
                                            >
                                                <div className="overflow-hidden">
                                                    <p className="px-5 pb-5 text-sm leading-relaxed text-slate-600 sm:px-6">
                                                        {faq.answer}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </Reveal>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* ---------------------------------------------------------------
                    Closing CTA
                ---------------------------------------------------------------- */}
                <section className="bg-slate-50 pb-20 sm:pb-28">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <Reveal>
                            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-brand-600 via-brand-700 to-teal-800 px-6 py-14 text-center shadow-2xl shadow-brand-900/20 sm:px-12 sm:py-20">
                                <div
                                    aria-hidden="true"
                                    className="pointer-events-none absolute inset-0 overflow-hidden"
                                >
                                    <div className="absolute -right-16 -top-16 h-64 w-64 animate-blob rounded-full bg-white/10 blur-2xl" />
                                    <div className="absolute -bottom-20 -left-10 h-64 w-64 animate-blob-delayed rounded-full bg-teal-300/20 blur-2xl" />
                                </div>

                                <div className="relative">
                                    <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                                        Ready when your pet needs us
                                    </h2>
                                    <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-brand-50">
                                        Create an account to book visits, track vaccinations
                                        and keep every record in one place.
                                    </p>

                                    <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                                        {canRegister && (
                                            <Link
                                                href={route('clerk.signup')}
                                                className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-semibold text-brand-700 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl sm:w-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-700"
                                            >
                                                Get started
                                                <Icon
                                                    name="arrowRight"
                                                    className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                                                />
                                            </Link>
                                        )}

                                        {canLogin && (
                                            <Link
                                                href={route('clerk.signin')}
                                                className="inline-flex w-full items-center justify-center rounded-2xl border border-white/40 px-6 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10 sm:w-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                                            >
                                                Log in to your account
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Reveal>
                    </div>
                </section>

                {/* ---------------------------------------------------------------
                    Footer
                ---------------------------------------------------------------- */}
                <footer className="border-t border-slate-200 bg-white py-12">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col items-center justify-between gap-8 sm:flex-row sm:items-start">
                            <div className="text-center sm:text-left">
                                <div className="flex items-center justify-center gap-2.5 sm:justify-start">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
                                        <Icon name="paw" className="h-4 w-4" />
                                    </span>
                                    <span className="text-base font-bold tracking-tight">
                                        My<span className="text-brand-600">Vet</span>
                                    </span>
                                </div>
                                <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500">
                                    Modern veterinary care for the whole family,
                                    seven days a week.
                                </p>
                            </div>

                            <div className="flex flex-col items-center gap-3 sm:items-end">
                                <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
                                    {navLinks.map((link) => (
                                        <a
                                            key={link.href}
                                            href={link.href}
                                            className="text-sm font-medium text-slate-600 transition-colors duration-200 hover:text-brand-700"
                                        >
                                            {link.label}
                                        </a>
                                    ))}
                                </div>
                                <p className="text-xs text-slate-400">
                                    © {new Date().getFullYear()} MyVet Clinic. All
                                    rights reserved.
                                </p>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
