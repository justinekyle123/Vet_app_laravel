import Icon from '@/Components/Icon';
import { Link } from '@inertiajs/react';
import { type ReactNode } from 'react';

/**
 * Shell for every sign-in / sign-up screen.
 *
 * Composition follows the reference login design: a full-bleed media panel
 * carrying a status badge and a two-line display headline, with the form in a
 * card that overlaps it on phones and sits beside it from `lg` up.
 *
 * Re-skinned to this site's own theme rather than the reference palette: mint
 * surface, dark-green type, orange pill actions, DM Serif Display headings and
 * Inter for UI — plus the landing page's artwork and entrance choreography.
 */
const heroPhoto =
    'https://polo-pecan-73837341.figma.site/_assets/v11/96745c4e72ad5c5208e53a885df797fd82cd854a.png?h=1024';

interface AuthLayoutProps {
    /** Page title rendered above the form. */
    heading: string;
    /** Optional supporting line under the heading. */
    description?: ReactNode;
    children: ReactNode;
    /** Links rendered at the foot of the card. */
    footer?: ReactNode;
}

export default function AuthLayout({
    heading,
    description,
    children,
    footer,
}: AuthLayoutProps) {
    return (
        <div className="flex min-h-screen flex-col bg-[#EFFDF0] font-inter text-[#1a3d1a] antialiased lg:grid lg:grid-cols-2">
            {/* ---------------------------------------------------------------
                Media panel — brand row on top, badge and headline at the foot.
            ---------------------------------------------------------------- */}
            <section className="relative h-[clamp(240px,34svh,300px)] shrink-0 overflow-hidden lg:h-auto lg:min-h-screen">
                <img
                    src={heroPhoto}
                    alt=""
                    draggable={false}
                    className="absolute inset-0 h-full w-full object-cover object-center"
                />

                {/* Scrim. The headline and brand row are white, so they need a
                    floor of contrast whatever the photo underneath does. */}
                <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-[#08150c]/90 via-[#08150c]/35 to-[#08150c]/15"
                />

                <div className="absolute inset-x-0 top-0 flex animate-fade-in items-center justify-between gap-4 p-5 anim-delay-100 sm:p-6 lg:p-10">
                    <Link
                        href="/"
                        className="group flex items-center gap-2.5 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                    >
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-inset ring-white/25 backdrop-blur transition-colors duration-200 group-hover:bg-white/25">
                            <Icon name="paw" className="h-5 w-5" />
                        </span>
                        <span className="font-serif-display text-xl leading-none text-white sm:text-2xl">
                            My<span className="text-[#E86A10]">Vet</span>
                        </span>
                    </Link>

                    <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3.5 py-2 text-xs font-medium text-white backdrop-blur transition-colors duration-200 hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                        Back to site
                        <Icon name="arrowRight" className="h-3.5 w-3.5" />
                    </Link>
                </div>

                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 lg:p-12">
                    <span className="inline-flex animate-fade-up items-center gap-2.5 rounded-full bg-[#1a3d1a]/85 px-4 py-2 text-xs font-medium text-white shadow-lg shadow-black/20 backdrop-blur-md anim-delay-200">
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-pulse-soft rounded-full bg-[#EFFDF0]" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#EFFDF0]" />
                        </span>
                        24/7 emergency team
                    </span>

                    <h2 className="mt-4 animate-fade-up font-serif-display text-[clamp(30px,4.4vw,52px)] leading-[0.98] tracking-tight text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.45)] anim-delay-300">
                        <span className="block">Everything</span>
                        <span className="block">Your Pets Need</span>
                    </h2>
                </div>
            </section>

            {/* ---------------------------------------------------------------
                Form pane. On phones the card overlaps the media panel; from
                `lg` it is a floating card centred in its own column.
            ---------------------------------------------------------------- */}
            <main className="relative z-10 flex flex-1 justify-center lg:items-center lg:px-12 lg:py-16">
                <div className="flex w-full -mt-7 animate-fade-up flex-col rounded-t-[28px] bg-white p-6 shadow-[0_-10px_28px_rgba(26,61,26,0.10)] anim-delay-200 sm:p-8 lg:mt-0 lg:max-w-[26rem] lg:flex-none lg:rounded-2xl lg:shadow-2xl lg:shadow-[#1a3d1a]/5">
                    <h1 className="font-serif-display text-3xl tracking-tight text-[#1a3d1a] sm:text-[2.1rem]">
                        {heading}
                    </h1>

                    {description && (
                        <p className="mt-2 text-sm leading-relaxed text-gray-600">
                            {description}
                        </p>
                    )}

                    {/* `flex-1` lets the form absorb the spare height on
                        phones, where the card fills the screen, and settles
                        the footer against the bottom edge. */}
                    <div className="mt-8 flex-1">{children}</div>

                    {footer && (
                        <div className="mt-7 border-t border-[#1a3d1a]/10 pt-6">
                            {footer}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
