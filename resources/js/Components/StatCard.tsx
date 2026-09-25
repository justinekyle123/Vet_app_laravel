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
    /** Small caption under the value. */
    hint?: string;
    accent?: StatAccent;
}

export default function StatCard({
    label,
    value,
    icon,
    hint,
    accent = 'brand',
}: StatCardProps) {
    const styles = accentStyles[accent];

    return (
        <div className="flex flex-col rounded-2xl border border-[#1a3d1a]/10 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#1a3d1a]/20 hover:shadow-lg hover:shadow-[#1a3d1a]/5">
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
                <CountUp end={value} />
            </p>

            {hint && (
                <p className="mt-2 text-xs leading-relaxed text-[#1a3d1a]/50">
                    {hint}
                </p>
            )}
        </div>
    );
}
