import CountUp from './CountUp';
import Icon, { IconName } from './Icon';

/** Accent families drawn from the MyVet palette. */
export type StatAccent = 'brand' | 'deep' | 'accent';

const accentStyles: Record<StatAccent, { tile: string; icon: string }> = {
    brand: { tile: 'bg-[#1a3d1a]/10', icon: 'text-[#1a3d1a]' },
    deep: { tile: 'bg-[#2a5a2a]/10', icon: 'text-[#2a5a2a]' },
    accent: { tile: 'bg-[#E86A10]/10', icon: 'text-[#E86A10]' },
};

interface StatCardProps {
    label: string;
    value: number;
    icon?: IconName;
    image?: { src: string; alt: string };
    /** Small caption under the value. */
    hint?: string;
    accent?: StatAccent;
    /**
     * The value rendered as written instead of counted up — for a figure that
     * is not a plain number, such as a formatted amount.
     */
    display?: string;
}

export default function StatCard({
    label,
    value,
    icon,
    image,
    hint,
    accent = 'brand',
    display,
}: StatCardProps) {
    const styles = accentStyles[accent];

    return (
        <div className="relative min-h-36 overflow-hidden rounded-2xl border border-[#1a3d1a]/10 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#1a3d1a]/20 hover:shadow-lg hover:shadow-[#1a3d1a]/5">
            {image ? (
                <img
                    src={image.src}
                    alt={image.alt}
                    draggable={false}
                    className="absolute inset-y-0 right-0 h-full w-1/2 object-cover"
                />
            ) : (
                <div className="flex h-full flex-col p-5">
            <div className="flex items-start justify-between gap-3">
                <p className="pt-1 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[#1a3d1a]/45">
                    {label}
                </p>
                {icon && (
                    <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${styles.tile} ${styles.icon}`}
                    >
                        <Icon name={icon} className="h-5 w-5" />
                    </span>
                )}
            </div>

            <p className="mt-3 font-serif-display text-[2rem] leading-none text-[#1a3d1a]">
                {display ?? <CountUp end={value} />}
            </p>

            {hint && (
                <p className="mt-2 text-xs leading-relaxed text-[#1a3d1a]/50">
                    {hint}
                </p>
            )}
                </div>
            )}
        </div>
    );
}
