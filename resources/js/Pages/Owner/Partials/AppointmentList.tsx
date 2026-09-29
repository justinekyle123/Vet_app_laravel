import AppointmentStatusChip from '@/Components/AppointmentStatusChip';
import { PortalAppointment } from '@/types';
import { currency } from '@/utils/format';
import { CalendarDays, Clock } from 'lucide-react';

/**
 * One appointment row, shared by the portal dashboard's "next visits" preview
 * and the full appointments page so a booking always reads the same way.
 */

/**
 * The API sends bare `YYYY-MM-DD` strings; parsing those in local time keeps
 * the calendar day from slipping back a day in western timezones.
 */
function localDate(iso: string | null): Date | null {
    if (!iso) {
        return null;
    }

    const parsed = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);

    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function dateBadge(iso: string | null): { month: string; day: string } {
    const date = localDate(iso);

    return date
        ? {
              month: date.toLocaleDateString('en-US', { month: 'short' }),
              day: date.toLocaleDateString('en-US', { day: 'numeric' }),
          }
        : { month: '—', day: '—' };
}

export function fullDate(iso: string | null): string {
    const date = localDate(iso);

    return date
        ? date.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
          })
        : '—';
}

export default function AppointmentList({
    appointments,
    emptyMessage,
}: {
    appointments: PortalAppointment[];
    emptyMessage: string;
}) {
    if (appointments.length === 0) {
        return (
            <p className="my-auto rounded-xl bg-[#EFFDF0]/70 px-4 py-4 text-sm leading-relaxed text-[#1a3d1a]/60">
                {emptyMessage}
            </p>
        );
    }

    return (
        <ul className="divide-y divide-[#1a3d1a]/5">
            {appointments.map((appointment) => {
                const badge = dateBadge(appointment.date);

                return (
                    <li
                        key={appointment.id}
                        className="flex flex-wrap items-start justify-between gap-3 py-4 first:pt-0 last:pb-0"
                    >
                        <div className="flex min-w-0 items-start gap-3">
                            <span
                                aria-hidden="true"
                                className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-[#EFFDF0] leading-none text-[#1a3d1a]"
                            >
                                <span className="text-[0.58rem] font-bold uppercase tracking-wider text-[#1a3d1a]/50">
                                    {badge.month}
                                </span>
                                <span className="mt-0.5 text-sm font-semibold">
                                    {badge.day}
                                </span>
                            </span>

                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-[#1a3d1a]">
                                    {appointment.service ?? 'Visit'}
                                </p>
                                <p className="mt-0.5 truncate text-xs text-[#1a3d1a]/55">
                                    {[
                                        appointment.dog,
                                        appointment.staff
                                            ? `with ${appointment.staff}`
                                            : null,
                                    ]
                                        .filter(Boolean)
                                        .join(' · ')}
                                </p>
                                <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#1a3d1a]/55">
                                    <span className="inline-flex items-center gap-1">
                                        <CalendarDays className="h-3.5 w-3.5" />
                                        {fullDate(appointment.date)}
                                    </span>
                                    {appointment.time && (
                                        <span className="inline-flex items-center gap-1">
                                            <Clock className="h-3.5 w-3.5" />
                                            {appointment.time}
                                        </span>
                                    )}
                                    {appointment.price && (
                                        <span>{currency(appointment.price)}</span>
                                    )}
                                </p>
                                {appointment.notes && (
                                    <p className="mt-1.5 text-xs italic leading-relaxed text-[#1a3d1a]/50">
                                        {appointment.notes}
                                    </p>
                                )}
                            </div>
                        </div>

                        <AppointmentStatusChip status={appointment.status} />
                    </li>
                );
            })}
        </ul>
    );
}
