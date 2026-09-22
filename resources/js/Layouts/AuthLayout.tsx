import Icon from '@/Components/Icon';
import Marquee from '@/Components/Marquee';
import Reveal from '@/Components/Reveal';
import { Link } from '@inertiajs/react';
import { type ReactNode } from 'react';

/**
 * Shell for every sign-in / sign-up screen.
 *
 * Two columns from `lg` up: a fixed-height brand panel on the left and a
 * scrollable form column on the right. Below `lg` the panel collapses into a
 * compact gradient band so the form is reachable without scrolling past a
 * full-height hero.
 */
const assurances = [
    {
        icon: 'calendar',
        title: 'Booking that takes seconds',
        description: 'Pick a slot online and get instant confirmation.',
    },
    {
        icon: 'shield',
        title: 'Records kept private',
        description: 'Clinical notes stay between you and your veterinarian.',
    },
    {
        icon: 'heart',
        title: 'One vet who knows them',
        description: 'The same faces at every visit, so nothing gets missed.',
    },
] as const;

const accreditations = [
    'AAHA Accredited',
    'Fear-Free Certified',
    'In-House Diagnostic Lab',
    '24/7 Emergency Team',
    'Digital Records',
    'Board-Certified Surgeons',
];

interface AuthLayoutProps {
    /** Page title rendered above the form. */
    heading: string;
    /** Optional supporting line under the heading. */
    description?: ReactNode;
    children: ReactNode;
    /** Links rendered in a bordered strip below the form. */
    footer?: ReactNode;
}

export default function AuthLayout({
    heading,
    description,
    children,
    footer,
}: AuthLayoutProps) {
    return (
        <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 antialiased lg:grid lg:h-screen lg:grid-cols-2">
            <aside className="relative isolate shrink-0 overflow-hidden bg-brand-950 px-6 py-6 text-white sm:px-8 lg:flex lg:h-full lg:flex-col lg:px-12 lg:py-14">
                {/* Ambient gradient wash — purely decorative, so it stays out
                    of the accessibility tree and behind everything else. */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 -z-10"
                >
                    <div className="absolute -left-24 -top-28 h-72 w-72 animate-blob rounded-full bg-brand-500/40 blur-3xl" />
                    <div className="absolute -right-20 top-1/3 h-80 w-80 animate-blob-delayed rounded-full bg-teal-400/25 blur-3xl" />
                    <div className="absolute -bottom-24 left-1/4 h-72 w-72 animate-blob rounded-full bg-cyan-400/15 blur-3xl" />
                </div>

                <div className="flex items-center justify-between gap-4">
                    <Link
                        href="/"
                        className="group flex items-center gap-2.5 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-950"
                    >
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-brand-200 ring-1 ring-inset ring-white/20 transition-transform duration-300 group-hover:-rotate-6">
                            <Icon name="paw" className="h-5 w-5" />
                        </span>
                        <span className="text-lg font-bold tracking-tight">
                            My<span className="text-brand-300">Vet</span>
                        </span>
                    </Link>

                    <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 rounded-lg text-xs font-medium text-brand-100/80 transition-colors duration-200 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                    >
                        Back to site
                        <Icon name="arrowRight" className="h-3.5 w-3.5" />
                    </Link>
                </div>

                {/* Mobile stand-in for the full panel below. */}
                <p className="mt-4 max-w-md text-sm leading-relaxed text-brand-100/80 lg:hidden">
                    24/7 emergency cover, an in-house lab, and records you can
                    read the moment a visit ends.
                </p>

                <div className="hidden lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:justify-center lg:py-10">
                    <Reveal>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-300">
                            Client portal
                        </p>
                        <h2 className="mt-4 text-3xl font-bold leading-[1.15] tracking-tight xl:text-4xl">
                            Care your pet will actually remember.
                        </h2>
                        <p className="mt-4 max-w-md text-sm leading-relaxed text-brand-100/80">
                            Book visits, follow lab results, and keep every
                            vaccination on schedule — all in one place.
                        </p>
                    </Reveal>

                    <ul className="mt-10 space-y-5">
                        {assurances.map((item, index) => (
                            <li key={item.title}>
                                <Reveal delay={140 + index * 130}>
                                    <div className="flex items-start gap-4">
                                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-brand-200 ring-1 ring-inset ring-white/15">
                                            <Icon
                                                name={item.icon}
                                                className="h-5 w-5"
                                            />
                                        </span>
                                        <span className="min-w-0">
                                            <span className="block text-sm font-semibold text-white">
                                                {item.title}
                                            </span>
                                            <span className="mt-0.5 block text-sm leading-relaxed text-brand-100/75">
                                                {item.description}
                                            </span>
                                        </span>
                                    </div>
                                </Reveal>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="hidden lg:block">
                    <div className="border-t border-white/10 pt-6">
                        <Marquee speed={34} className="mask-fade-x">
                            {accreditations.map((label) => (
                                <span
                                    key={label}
                                    className="mx-4 flex items-center gap-2 whitespace-nowrap text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-brand-100/70"
                                >
                                    <Icon
                                        name="check"
                                        className="h-3.5 w-3.5 text-brand-300"
                                    />
                                    {label}
                                </span>
                            ))}
                        </Marquee>
                    </div>
                </div>
            </aside>

            <main className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8 lg:h-full lg:overflow-y-auto lg:px-12 lg:py-16">
                <Reveal className="w-full max-w-[26rem]">
                    {/* A card on small screens; flat against the panel's own
                        whitespace at `lg`, where a nested box would be noise. */}
                    <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8 lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                            {heading}
                        </h1>

                        {description && (
                            <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                {description}
                            </p>
                        )}

                        <div className="mt-8">{children}</div>
                    </div>

                    {footer && (
                        <div className="mt-6 border-t border-slate-200 pt-6">
                            {footer}
                        </div>
                    )}
                </Reveal>
            </main>
        </div>
    );
}
