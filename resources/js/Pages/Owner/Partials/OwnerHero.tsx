import { ReactNode } from 'react';

/**
 * The owner portal's shared page furniture.
 *
 * Every portal page opens with a dark-green hero band so the page has one
 * unmistakable focal point on the white surface, then groups its content under
 * quiet uppercase section labels. Keeping both here means the dashboard, the
 * appointments page, and the services menu all read with the same rhythm.
 */

interface OwnerHeroProps {
    /** Small uppercase kicker above the title. */
    eyebrow: string;
    /** The headline itself. */
    title: string;
    /** Supporting line, shown when there is no richer `children` block. */
    description?: string;
    /** Detail rows under the title, e.g. icons and meta. */
    children?: ReactNode;
    /** Buttons rendered at the foot of the hero. */
    actions?: ReactNode;
    /** Small chip shown beside the actions, e.g. a booking status. */
    badge?: ReactNode;
}

export function OwnerHero({
    eyebrow,
    title,
    description,
    children,
    actions,
    badge,
}: OwnerHeroProps) {
    return (
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a3d1a] via-[#1a3d1a] to-[#2a5a2a] p-6 text-white shadow-xl shadow-[#1a3d1a]/20 sm:p-8">
            <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#E86A10]/25 blur-3xl"
            />

            <div className="relative flex flex-wrap items-end justify-between gap-6">
                <div className="min-w-0">
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-white/50">
                        {eyebrow}
                    </p>
                    <h2 className="mt-2 font-serif-display text-3xl leading-tight sm:text-4xl">
                        {title}
                    </h2>

                    {description && (
                        <p className="mt-3 max-w-md text-sm leading-relaxed text-white/70">
                            {description}
                        </p>
                    )}

                    {children}
                </div>

                {(actions || badge) && (
                    <div className="flex flex-wrap items-center gap-2.5">
                        {badge}
                        {actions}
                    </div>
                )}
            </div>
        </section>
    );
}

/** A quiet uppercase label that groups the band of content beneath it. */
export function SectionLabel({ children }: { children: ReactNode }) {
    return (
        <h2 className="mb-3 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[#1a3d1a]/45">
            {children}
        </h2>
    );
}
