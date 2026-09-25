/**
 * Active / inactive marker for staff console lists. Row-level record status
 * only — role badges and other labels keep their own treatments.
 */
export default function StatusPill({
    active,
    activeLabel = 'Active',
    inactiveLabel = 'Inactive',
}: {
    active: boolean;
    activeLabel?: string;
    inactiveLabel?: string;
}) {
    return (
        <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[0.68rem] font-semibold ${
                active
                    ? 'bg-[#2a5a2a]/10 text-[#2a5a2a]'
                    : 'bg-[#1a3d1a]/10 text-[#1a3d1a]/50'
            }`}
        >
            {active ? activeLabel : inactiveLabel}
        </span>
    );
}
