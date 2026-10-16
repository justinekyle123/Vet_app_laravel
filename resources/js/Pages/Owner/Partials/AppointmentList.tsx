import AppointmentStatusChip from '@/Components/AppointmentStatusChip';
import {
    primaryButtonClass,
    secondaryButtonClass,
} from '@/Components/buttonStyles';
import { fieldClass, labelClass } from '@/Components/formStyles';
import Modal from '@/Components/Modal';
import Spinner from '@/Components/Spinner';
import StarRating, { StarPicker } from '@/Components/StarRating';
import { PortalAppointment, ServiceAvailability } from '@/types';
import { currency } from '@/utils/format';
import { useForm } from '@inertiajs/react';
import { CalendarDays, Clock } from 'lucide-react';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import BookingCalendar from './BookingCalendar';

/**
 * One appointment row, shared by the portal dashboard's "next visits" preview
 * and the full appointments page so a booking always reads the same way.
 *
 * A visit the clinic has not carried out yet — requested or confirmed — can be
 * rescheduled here, behind a confirmation so a stray tap does not lose a
 * booking, and a completed visit can be rated in place.
 *
 * Rescheduling reads the clinic's own calendar: the client picks a day from the
 * month grid and a time from the slots still free on it. Times that have
 * already gone, and days the clinic has nothing left on, are simply not
 * offered — the visit being moved is left out of the clash check so the slot it
 * already holds can be kept or handed back.
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

/**
 * How far away a visit is, in the words a client would use. Returns null for
 * days that have already passed, where the exact date says more.
 */
export function relativeDay(iso: string | null): string | null {
    const date = localDate(iso);

    if (!date) {
        return null;
    }

    const startOfDay = (value: Date) =>
        new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();

    const days = Math.round(
        (startOfDay(date) - startOfDay(new Date())) / 86_400_000,
    );

    if (days < 0) {
        return null;
    }

    if (days === 0) {
        return 'Today';
    }

    if (days === 1) {
        return 'Tomorrow';
    }

    if (days < 14) {
        return `In ${days} days`;
    }

    const weeks = Math.round(days / 7);

    return weeks === 1 ? 'In a week' : `In ${weeks} weeks`;
}

export default function AppointmentList({
    appointments,
    emptyMessage,
    emptyAction,
}: {
    appointments: PortalAppointment[];
    emptyMessage: string;
    /** Optional call to action shown with the empty message. */
    emptyAction?: ReactNode;
}) {
    const [rescheduling, setRescheduling] = useState<PortalAppointment | null>(null);
    const [reviewing, setReviewing] = useState<PortalAppointment | null>(null);
    const [availability, setAvailability] = useState<ServiceAvailability | null>(null);
    const [loadingAvailability, setLoadingAvailability] = useState(false);
    const reviewForm = useForm({ rating: 5, comment: '' });
    const rescheduleForm = useForm({ appointment_date: '', appointment_time: '' });

    // The grid the reschedule sheet draws: fetched when the sheet opens, with
    // this visit left out so its own slot stays selectable.
    useEffect(() => {
        if (!rescheduling?.service_id) {
            setAvailability(null);
            return;
        }

        let cancelled = false;
        setLoadingAvailability(true);

        fetch(
            `${route('owner.services.availability', rescheduling.service_id)}?ignore=${rescheduling.id}`,
            { headers: { Accept: 'application/json' }, credentials: 'same-origin' },
        )
            .then((response) => response.json())
            .then((payload: ServiceAvailability) => {
                if (!cancelled) {
                    setAvailability(payload);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setAvailability({ windowDays: 0, dates: [], times: {} });
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoadingAvailability(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [rescheduling?.id, rescheduling?.service_id]);

    const availableDates = useMemo(
        () => new Set(availability?.dates ?? []),
        [availability],
    );

    const slotsForChosenDay = useMemo(
        () =>
            rescheduleForm.data.appointment_date
                ? (availability?.times[
                      rescheduleForm.data.appointment_date
                  ] ?? [])
                : [],
        [availability, rescheduleForm.data.appointment_date],
    );

    const closeReview = () => {
        setReviewing(null);
        reviewForm.reset();
        reviewForm.clearErrors();
    };

    const submitReview = () => {
        if (!reviewing) {
            return;
        }

        reviewForm.post(route('owner.appointments.review', reviewing.id), {
            preserveScroll: true,
            onSuccess: () => closeReview(),
        });
    };

    if (appointments.length === 0) {
        return (
            <div className="my-auto rounded-xl bg-[#EFFDF0]/70 px-4 py-5 text-center sm:text-left">
                <p className="text-sm leading-relaxed text-[#1a3d1a]/60">
                    {emptyMessage}
                </p>
                {emptyAction && <div className="mt-3">{emptyAction}</div>}
            </div>
        );
    }

    const closeReschedule = () => {
        setRescheduling(null);
        setAvailability(null);
        rescheduleForm.reset();
        rescheduleForm.clearErrors();
    };

    const submitReschedule = () => {
        if (!rescheduling) {
            return;
        }

        rescheduleForm.patch(
            route('owner.appointments.reschedule', rescheduling.id),
            {
                preserveScroll: true,
                onSuccess: () => closeReschedule(),
            },
        );
    };

    return (
        <>
            <ul className="divide-y divide-[#1a3d1a]/5">
                {appointments.map((appointment) => {
                    const badge = dateBadge(appointment.date);
                    const when = relativeDay(appointment.date);
                    const isUpcoming = appointment.reschedulable;
                    const settlement = appointment.settlement;

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
                                            <span>
                                                {currency(appointment.price)}
                                            </span>
                                        )}
                                        {isUpcoming && when && (
                                            <span className="rounded-full bg-[#EFFDF0] px-2 py-0.5 font-semibold text-[#2a5a2a]">
                                                {when}
                                            </span>
                                        )}
                                    </p>
                                    {appointment.notes && (
                                        <p className="mt-1.5 text-xs italic leading-relaxed text-[#1a3d1a]/50">
                                            {appointment.notes}
                                        </p>
                                    )}

                                    {/* What the client said about this visit,
                                        read back to them once they have. */}
                                    {appointment.feedback && (
                                        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl bg-[#EFFDF0]/70 px-3 py-2">
                                            <StarRating
                                                value={appointment.feedback.rating}
                                                size="sm"
                                            />
                                            <span className="text-xs font-semibold text-[#1a3d1a]/70">
                                                You rated this{' '}
                                                {appointment.feedback.rating}/5
                                            </span>
                                            {appointment.feedback.comment && (
                                                <span className="w-full text-xs italic leading-relaxed text-[#1a3d1a]/55">
                                                    “
                                                    {
                                                        appointment.feedback
                                                            .comment
                                                    }
                                                    ”
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex shrink-0 flex-col items-end gap-2">
                                <AppointmentStatusChip
                                    status={appointment.status}
                                />

                                {settlement.state !== 'unpaid' && (
                                    <span className="flex flex-col items-end gap-0.5">
                                        <span
                                            className={`rounded-full px-2.5 py-1 text-[0.68rem] font-semibold ${
                                                settlement.state === 'paid'
                                                    ? 'bg-[#EFFDF0] text-[#2a5a2a]'
                                                    : 'bg-[#E86A10]/10 text-[#E86A10]'
                                            }`}
                                        >
                                            {settlement.state === 'paid'
                                                ? 'Paid'
                                                : 'Part paid'}
                                            {settlement.last_payment?.method
                                                ? ` · ${settlement.last_payment.method}`
                                                : ''}
                                        </span>

                                        <span className="text-[0.62rem] text-[#1a3d1a]/45">
                                            {currency(settlement.paid)} of{' '}
                                            {currency(settlement.price)}
                                            {settlement.state === 'part'
                                                ? ` · ${currency(settlement.balance)} to go`
                                                : ''}
                                        </span>

                                        {settlement.last_payment?.reference && (
                                            <span className="max-w-[12rem] truncate text-[0.62rem] text-[#1a3d1a]/45">
                                                Ref{' '}
                                                {
                                                    settlement.last_payment
                                                        .reference
                                                }
                                            </span>
                                        )}
                                    </span>
                                )}

                                {isUpcoming && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setRescheduling(appointment);
                                            rescheduleForm.setData({
                                                appointment_date: appointment.date ?? '',
                                                appointment_time: appointment.time ?? '',
                                            });
                                        }}
                                        className="rounded-full px-2.5 py-1 text-[0.68rem] font-semibold text-[#1a3d1a]/70 transition-colors duration-150 hover:bg-[#EFFDF0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]"
                                    >
                                        Reschedule
                                    </button>
                                )}

                                {appointment.reviewable && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setReviewing(appointment);
                                            reviewForm.setData('rating', 5);
                                        }}
                                        className="rounded-full px-2.5 py-1 text-[0.68rem] font-semibold text-[#E86A10] transition-colors duration-150 hover:bg-[#E86A10]/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E86A10]"
                                    >
                                        Rate this visit
                                    </button>
                                )}

                            </div>
                        </li>
                    );
                })}
            </ul>

            <Modal
                show={rescheduling !== null}
                onClose={() => {
                    if (!rescheduleForm.processing) {
                        closeReschedule();
                    }
                }}
                maxWidth="lg"
            >
                <div className="p-6">
                    <h2 className="font-serif-display text-xl leading-tight text-[#1a3d1a]">
                        Reschedule this visit
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-[#1a3d1a]/60">
                        {rescheduling
                            ? `${rescheduling.service ?? 'This visit'} for ${rescheduling.dog ?? 'your dog'}. Pick a new day and time from what the clinic still has open.`
                            : ''}
                    </p>

                    {loadingAvailability ? (
                        <div className="mt-5 flex h-64 items-center justify-center gap-2 rounded-2xl border border-[#1a3d1a]/10 text-sm text-[#1a3d1a]/55">
                            <Spinner className="h-4 w-4" /> Checking the clinic's
                            calendar...
                        </div>
                    ) : (
                        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <div>
                                <p className={labelClass}>New day</p>
                                <div className="mt-2">
                                    <BookingCalendar
                                        availableDates={availableDates}
                                        selected={
                                            rescheduleForm.data
                                                .appointment_date || null
                                        }
                                        onSelect={(date) => {
                                            rescheduleForm.setData(
                                                'appointment_date',
                                                date,
                                            );
                                            rescheduleForm.setData(
                                                'appointment_time',
                                                '',
                                            );
                                        }}
                                    />
                                </div>
                                {rescheduleForm.errors.appointment_date && (
                                    <p className="mt-1.5 text-xs text-[#b3261e]">
                                        {rescheduleForm.errors.appointment_date}
                                    </p>
                                )}
                            </div>

                            <div>
                                <p className={labelClass}>New time</p>

                                {!rescheduleForm.data.appointment_date ? (
                                    <p className="mt-2 rounded-2xl border border-dashed border-[#1a3d1a]/15 px-4 py-6 text-sm text-[#1a3d1a]/50">
                                        Pick a day first.
                                    </p>
                                ) : slotsForChosenDay.length === 0 ? (
                                    <p className="mt-2 rounded-2xl border border-dashed border-[#1a3d1a]/15 px-4 py-6 text-sm text-[#1a3d1a]/50">
                                        No times are left on that day. Choose
                                        another day.
                                    </p>
                                ) : (
                                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                                        {slotsForChosenDay.map((slot) => {
                                            const chosen =
                                                rescheduleForm.data
                                                    .appointment_time ===
                                                slot.value;

                                            return (
                                                <button
                                                    type="button"
                                                    key={slot.value}
                                                    onClick={() =>
                                                        rescheduleForm.setData(
                                                            'appointment_time',
                                                            slot.value,
                                                        )
                                                    }
                                                    aria-pressed={chosen}
                                                    className={`rounded-xl border px-2 py-2 text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a] ${
                                                        chosen
                                                            ? 'border-[#1a3d1a] bg-[#1a3d1a] text-white shadow-md shadow-[#1a3d1a]/20'
                                                            : 'border-[#1a3d1a]/12 bg-white text-[#1a3d1a]/70 hover:-translate-y-0.5 hover:border-[#1a3d1a]/30 hover:text-[#1a3d1a] hover:shadow-sm'
                                                    }`}
                                                >
                                                    {slot.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {rescheduleForm.errors.appointment_time && (
                                    <p className="mt-1.5 text-xs text-[#b3261e]">
                                        {rescheduleForm.errors.appointment_time}
                                    </p>
                                )}

                                <p className="mt-3 text-[0.68rem] leading-relaxed text-[#1a3d1a]/45">
                                    Times that have already passed, and times
                                    the clinic has taken, are not offered.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="mt-6 flex flex-wrap justify-end gap-2.5">
                        <button
                            type="button"
                            onClick={closeReschedule}
                            disabled={rescheduleForm.processing}
                            className={secondaryButtonClass}
                        >
                            Keep current time
                        </button>
                        <button
                            type="button"
                            onClick={submitReschedule}
                            disabled={
                                rescheduleForm.processing ||
                                !rescheduleForm.data.appointment_date ||
                                !rescheduleForm.data.appointment_time
                            }
                            className={primaryButtonClass}
                        >
                            {rescheduleForm.processing && (
                                <Spinner className="h-4 w-4" />
                            )}
                            Save new time
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                show={reviewing !== null}
                onClose={() => {
                    if (!reviewForm.processing) {
                        closeReview();
                    }
                }}
                maxWidth="md"
            >
                <div className="p-6">
                    <h2 className="font-serif-display text-xl leading-tight text-[#1a3d1a]">
                        How was the visit?
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-[#1a3d1a]/60">
                        {reviewing
                            ? `${reviewing.service ?? 'This visit'} for ${
                                  reviewing.dog ?? 'your dog'
                              } on ${fullDate(reviewing.date)}. Your rating is
                              shared with the clinic and shown to other clients.`
                            : ''}
                    </p>

                    <div className="mt-5">
                        <span className={labelClass}>Your rating</span>
                        <div className="mt-2">
                            <StarPicker
                                value={reviewForm.data.rating}
                                onChange={(rating) =>
                                    reviewForm.setData('rating', rating)
                                }
                                disabled={reviewForm.processing}
                            />
                        </div>
                        {reviewForm.errors.rating && (
                            <p className="mt-2 text-sm text-[#b3261e]">
                                {reviewForm.errors.rating}
                            </p>
                        )}
                    </div>

                    <div className="mt-4">
                        <label htmlFor="review-comment" className={labelClass}>
                            Anything you would like to add?
                        </label>
                        <textarea
                            id="review-comment"
                            rows={4}
                            value={reviewForm.data.comment}
                            onChange={(event) =>
                                reviewForm.setData(
                                    'comment',
                                    event.target.value,
                                )
                            }
                            maxLength={1000}
                            placeholder="The vet explained everything and Rex stayed calm…"
                            className={`${fieldClass} resize-none`}
                        />
                        {reviewForm.errors.comment && (
                            <p className="mt-2 text-sm text-[#b3261e]">
                                {reviewForm.errors.comment}
                            </p>
                        )}
                    </div>

                    <div className="mt-6 flex flex-wrap justify-end gap-2.5">
                        <button
                            type="button"
                            onClick={closeReview}
                            disabled={reviewForm.processing}
                            className={secondaryButtonClass}
                        >
                            Not now
                        </button>
                        <button
                            type="button"
                            onClick={submitReview}
                            disabled={reviewForm.processing}
                            className={primaryButtonClass}
                        >
                            {reviewForm.processing && (
                                <Spinner className="h-4 w-4" />
                            )}
                            Submit review
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
