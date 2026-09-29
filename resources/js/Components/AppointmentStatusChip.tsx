/**
 * Status marker for an appointment row.
 *
 * Shared by the owner portal's visit lists and the staff console's desk view so
 * a booking reads the same way wherever it appears. Unknown statuses stay
 * neutral rather than inventing a colour.
 */

/** How each status the clinic uses is toned. */
const statusTones: Record<string, string> = {
    Confirmed: 'bg-[#2a5a2a]/10 text-[#2a5a2a]',
    Requested: 'bg-[#E86A10]/10 text-[#E86A10]',
    Completed: 'bg-[#1a3d1a]/10 text-[#1a3d1a]/70',
    Cancelled: 'bg-[#b3261e]/10 text-[#b3261e]',
    'No-show': 'bg-[#b3261e]/10 text-[#b3261e]',
};

export default function AppointmentStatusChip({
    status,
}: {
    status: string | null;
}) {
    const label = status ?? 'Scheduled';

    return (
        <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[0.68rem] font-semibold ${
                statusTones[label] ?? 'bg-[#1a3d1a]/10 text-[#1a3d1a]/60'
            }`}
        >
            {label}
        </span>
    );
}
