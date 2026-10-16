import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

/**
 * The month grid the booking page picks a day from.
 *
 * Only dates the server says have a free slot are selectable, so the calendar
 * never offers a day the clinic cannot actually take. Dates are handled as bare
 * `YYYY-MM-DD` strings to match the API and avoid a timezone sliding a day.
 * The grid sits inside the schedule card rather than in a card of its own, and
 * a month change replays a short slide-up so the new days never just appear.
 */

/** Monday first, so the weekend columns sit together at the end of the row. */
const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

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

    // Leading blanks line the 1st up under its weekday column (Monday first).
    const days = useMemo(() => {
        const first = startOfMonth(month);
        const offset = (first.getDay() + 6) % 7;
        const total = new Date(
            month.getFullYear(), month.getMonth() + 1, 0,
        ).getDate();

        return [
            ...Array.from({ length: offset }, () => null),
            ...Array.from(
                { length: total },
                (_, index) =>
                    new Date(month.getFullYear(), month.getMonth(), index + 1),
            ),
        ];
    }, [month]);

    // Remounting the grid on a month change replays the slide-up entrance.
    const monthKey = `${month.getFullYear()}-${month.getMonth()}`;

    const navButtonClass =
        'flex h-8 w-8 items-center justify-center rounded-full text-[#1a3d1a] transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0 disabled:hover:bg-transparent disabled:hover:shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]';

    return (
        <div>
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#1a3d1a]/10 bg-[#EFFDF0]/40 px-3 py-2.5">
                <button
                    type="button"
                    onClick={() => shiftMonth(-1)}
                    disabled={!canGoBack}
                    aria-label="Previous month"
                    className={navButtonClass}
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>

                <p className="font-serif-display text-base font-semibold text-[#1a3d1a]">
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

            <div className="mt-3">
                <div className="grid grid-cols-7 gap-1">
                    {WEEKDAYS.map((day) => (
                        <span
                            key={day}
                            className={`text-center text-[0.58rem] font-bold uppercase tracking-wider ${
                                day === 'Su'
                                    ? 'text-[#1a3d1a]/25'
                                    : 'text-[#1a3d1a]/40'
                            }`}
                        >
                            {day}
                        </span>
                    ))}
                </div>

                <div
                    key={monthKey}
                    className="month-transition mt-1 grid grid-cols-7 gap-1"
                >
                    {days.map((day, index) => {
                        if (!day) {
                            return (
                                <span key={`blank-${index}`} aria-hidden="true" />
                            );
                        }

                        const iso = isoDate(day);
                        const open = availableDates.has(iso);
                        const isSelected = selected === iso;
                        const isToday = iso === isoDate(today);

                        if (!open) {
                            return (
                                <span
                                    key={iso}
                                    aria-hidden="true"
                                    title="Not available"
                                    className="date-cell flex aspect-square items-center justify-center rounded-xl text-sm font-semibold text-[#1a3d1a]/20"
                                >
                                    {day.getDate()}
                                </span>
                            );
                        }

                        return (
                            <button
                                key={iso}
                                type="button"
                                role="radio"
                                aria-checked={isSelected}
                                onClick={() => onSelect(iso)}
                                className={`date-cell relative flex aspect-square items-center justify-center rounded-xl border text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a] ${
                                    isSelected
                                        ? 'border-[#1a3d1a] bg-[#1a3d1a] text-white shadow-md shadow-[#1a3d1a]/25'
                                        : isToday
                                          ? 'border-[#E86A10]/40 bg-white text-[#d45e0d] hover:border-[#E86A10] hover:shadow-sm'
                                          : 'border-[#1a3d1a]/10 bg-white text-[#1a3d1a]/75 hover:border-[#1a3d1a]/30 hover:text-[#1a3d1a]'
                                }`}
                            >
                                {day.getDate()}
                                {isToday && !isSelected && (
                                    <span
                                        aria-hidden="true"
                                        className="absolute bottom-1 h-1 w-1 rounded-full bg-[#E86A10]"
                                    />
                                )}
                                {isToday && <span className="sr-only"> (today)</span>}
                            </button>
                        );
                    })}
                </div>
            </div>

            {availableDates.size === 0 && (
                <p className="mt-3 text-[0.68rem] leading-relaxed text-[#1a3d1a]/40">
                    No open days in the booking window.
                </p>
            )}
        </div>
    );
}
