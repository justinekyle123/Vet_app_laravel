import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

/**
 * The month grid the booking modal picks a day from.
 *
 * Only dates the server says have a free slot are selectable, so the calendar
 * never offers a day the clinic cannot actually take. Dates are handled as bare
 * `YYYY-MM-DD` strings to match the API and avoid a timezone sliding a day.
 */

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/** Local-time ISO date, so the calendar day does not slip a timezone back. */
function isoDate(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${date.getFullYear()}-${month}-${day}`;
}

function startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

function parseDate(iso: string): Date {
    return new Date(`${iso}T00:00:00`);
}

export default function BookingCalendar({
    availableDates,
    selected,
    onSelect,
}: {
    availableDates: Set<string>;
    selected: string | null;
    onSelect: (iso: string) => void;
}) {
    const today = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        return now;
    }, []);

    const [month, setMonth] = useState(() => startOfMonth(today));

    const sortedDates = useMemo(
        () => [...availableDates].sort(),
        [availableDates],
    );

    const firstOpen = sortedDates.length ? parseDate(sortedDates[0]) : null;
    const lastOpen = sortedDates.length
        ? parseDate(sortedDates[sortedDates.length - 1])
        : null;

    // Land on the first month with openings once availability arrives, rather
    // than leaving the client on a greyed-out current month.
    useEffect(() => {
        if (firstOpen) {
            setMonth((current) =>
                current < startOfMonth(firstOpen)
                    ? startOfMonth(firstOpen)
                    : current,
            );
        }
    }, [firstOpen?.getTime()]);

    const canGoBack = month > startOfMonth(today);
    const canGoForward = lastOpen !== null && month < startOfMonth(lastOpen);

    const shiftMonth = (offset: number) =>
        setMonth(
            (current) =>
                new Date(current.getFullYear(), current.getMonth() + offset, 1),
        );

    // Leading blanks line the 1st up under its weekday column.
    const days = useMemo(() => {
        const first = startOfMonth(month);
        const total = new Date(
            month.getFullYear(),
            month.getMonth() + 1,
            0,
        ).getDate();

        return [
            ...Array.from({ length: first.getDay() }, () => null),
            ...Array.from(
                { length: total },
                (_, index) =>
                    new Date(month.getFullYear(), month.getMonth(), index + 1),
            ),
        ];
    }, [month]);

    const navButtonClass =
        'flex h-8 w-8 items-center justify-center rounded-full border border-[#1a3d1a]/15 bg-white text-[#1a3d1a] transition-colors duration-150 hover:bg-[#EFFDF0] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]';

    return (
        <div className="rounded-2xl border border-[#1a3d1a]/10 bg-white p-4">
            <div className="flex items-center justify-between gap-2">
                <button
                    type="button"
                    onClick={() => shiftMonth(-1)}
                    disabled={!canGoBack}
                    aria-label="Previous month"
                    className={navButtonClass}
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>

                <p className="text-sm font-semibold text-[#1a3d1a]">
                    {month.toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric',
                    })}
                </p>

                <button
                    type="button"
                    onClick={() => shiftMonth(1)}
                    disabled={!canGoForward}
                    aria-label="Next month"
                    className={navButtonClass}
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>

            <div className="mt-3 grid grid-cols-7 gap-1 text-center">
                {WEEKDAYS.map((day) => (
                    <span
                        key={day}
                        className="py-1 text-[0.62rem] font-bold uppercase tracking-wider text-[#1a3d1a]/40"
                    >
                        {day}
                    </span>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => {
                    if (!day) {
                        return <span key={`blank-${index}`} />;
                    }

                    const iso = isoDate(day);
                    const open = availableDates.has(iso);
                    const isSelected = selected === iso;

                    return (
                        <button
                            key={iso}
                            type="button"
                            disabled={!open}
                            onClick={() => onSelect(iso)}
                            aria-pressed={isSelected}
                            className={`h-10 rounded-xl text-sm font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a] ${
                                isSelected
                                    ? 'bg-[#E86A10] text-white shadow-sm'
                                    : open
                                      ? 'text-[#1a3d1a] hover:bg-[#EFFDF0]'
                                      : 'cursor-not-allowed text-[#1a3d1a]/20'
                            }`}
                        >
                            {day.getDate()}
                            {iso === isoDate(today) && (
                                <span className="sr-only"> (today)</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {availableDates.size === 0 && (
                <p className="mt-3 text-xs leading-relaxed text-[#1a3d1a]/50">
                    No open days in the booking window.
                </p>
            )}
        </div>
    );
}
