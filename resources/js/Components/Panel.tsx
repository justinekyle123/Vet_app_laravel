import Icon, { IconName } from '@/Components/Icon';
import { ReactNode } from 'react';

interface PanelProps {
    title: string;
    icon?: IconName;
    /** Rendered top-right of the panel header, e.g. a count or link. */
    action?: ReactNode;
    /** Drops the body padding so lists and tables can run edge to edge. */
    flush?: boolean;
    /** Stretch to the tallest sibling when panels share a row. */
    fill?: boolean;
    /** Anchor target, so a link elsewhere can deep-link to this panel. */
    id?: string;
    children: ReactNode;
}

/**
 * The staff console's titled panel. Mirrors `DashboardCard` but in the brand
 * palette, and is shared by every admin and front-desk page so the whole console
 * reads the same way.
 */
export default function Panel({
    title,
    icon,
    action,
    flush = false,
    fill = false,
    id,
    children,
}: PanelProps) {
    return (
        <section
            id={id}
            className={`flex flex-col overflow-hidden rounded-2xl border border-[#1a3d1a]/10 bg-white shadow-sm ${
                fill ? 'h-full' : ''
            }`}
        >
            <header className="flex items-center justify-between gap-3 border-b border-[#1a3d1a]/10 px-5 py-4">
                <h2 className="flex items-center gap-2.5 text-sm font-semibold text-[#1a3d1a]">
                    {icon && (
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EFFDF0] text-[#1a3d1a]">
                            <Icon name={icon} className="h-4 w-4" />
                        </span>
                    )}
                    {title}
                </h2>
                {action}
            </header>

            <div className={`flex flex-1 flex-col ${flush ? '' : 'p-5'}`}>
                {children}
            </div>
        </section>
    );
}

/**
 * Honest placeholder for a widget whose feature has not shipped yet — dashed
 * rather than empty, so the panel reads as planned work instead of a bug.
 */
export function SoonState({ message }: { message: string }) {
    return (
        <div className="my-auto flex items-start gap-3 rounded-xl border border-dashed border-[#1a3d1a]/15 bg-[#EFFDF0]/60 px-4 py-4">
            <Icon
                name="clock"
                className="mt-0.5 h-4 w-4 shrink-0 text-[#1a3d1a]/45"
            />
            <p className="text-sm leading-relaxed text-[#1a3d1a]/60">
                {message}
            </p>
        </div>
    );
}

/** Small "Coming soon" chip for panel headers. */
export function SoonChip() {
    return (
        <span className="shrink-0 rounded-full bg-[#E86A10]/10 px-2.5 py-1 text-[0.68rem] font-semibold text-[#E86A10]">
            Coming soon
        </span>
    );
}

/**
 * Placeholder for a panel that is working fine but has nothing to show yet.
 * Softer than `SoonState`, which is reserved for unbuilt features.
 */
export function EmptyState({
    message,
    icon = 'paw',
}: {
    message: string;
    icon?: IconName;
}) {
    return (
        <div className="my-auto flex items-start gap-3 rounded-xl bg-[#EFFDF0]/70 px-4 py-4">
            <Icon
                name={icon}
                className="mt-0.5 h-4 w-4 shrink-0 text-[#1a3d1a]/45"
            />
            <p className="text-sm leading-relaxed text-[#1a3d1a]/60">
                {message}
            </p>
        </div>
    );
}
