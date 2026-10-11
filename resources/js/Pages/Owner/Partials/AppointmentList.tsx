import AppointmentStatusChip from '@/Components/AppointmentStatusChip';
import {
    dangerButtonClass,
    primaryButtonClass,
    secondaryButtonClass,
} from '@/Components/buttonStyles';
import { fieldClass, labelClass } from '@/Components/formStyles';
import Modal from '@/Components/Modal';
import Spinner from '@/Components/Spinner';
import StarRating, { StarPicker } from '@/Components/StarRating';
import { PortalAppointment } from '@/types';
import { currency } from '@/utils/format';
import { Link, router, useForm } from '@inertiajs/react';
import { CalendarDays, Clock, RotateCcw } from 'lucide-react';
import { ReactNode, useState } from 'react';

/**
 * One appointment row, shared by the portal dashboard's "next visits" preview
 * and the full appointments page so a booking always reads the same way.
 *
 * A visit the clinic has not carried out yet — requested or confirmed — can be
 * cancelled here, behind a confirmation so a stray tap does not lose a booking.
 * A completed visit can be rated in place, and any past visit can be booked
 * again for the same service.
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
    const [pending, setPending] = useState<PortalAppointment | null>(null);
    const [cancelling, setCancelling] = useState(false);
    const [reviewing, setReviewing] = useState<PortalAppointment | null>(null);

    const reviewForm = useForm({ rating: 5, comment: '' });

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

    const confirmCancel = () => {
        if (!pending) {
            return;
        }

        setCancelling(true);

        router.patch(
            route('owner.appointments.cancel', pending.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => setPending(null),
                onFinish: () => setCancelling(false),
            },
        );
    };

    return (
        <>
            <ul className="divide-y divide-[#1a3d1a]/5">
                {appointments.map((appointment) => {
                    const badge = dateBadge(appointment.date);
                    const when = relativeDay(appointment.date);
                    const isUpcoming = appointment.cancellable;

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

                                {isUpcoming && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setPending(appointment)
                                        }
                                        className="rounded-full px-2.5 py-1 text-[0.68rem] font-semibold text-[#b3261e] transition-colors duration-150 hover:bg-[#b3261e]/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b3261e]"
                                    >
                                        Cancel
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

                                {!isUpcoming && appointment.service_id && (
                                    <Link
                                        href={route('owner.services.index', {
                                            book: appointment.service_id,
                                        })}
                                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.68rem] font-semibold text-[#1a3d1a]/70 transition-colors duration-150 hover:bg-[#EFFDF0] hover:text-[#1a3d1a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]"
                                    >
                                        <RotateCcw className="h-3 w-3" />
                                        Book again
                                    </Link>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>

            <Modal
                show={pending !== null}
                onClose={() => {
                    if (!cancelling) {
                        setPending(null);
                    }
                }}
                maxWidth="md"
            >
                <div className="p-6">
                    <h2 className="font-serif-display text-xl leading-tight text-[#1a3d1a]">
                        Cancel this visit?
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-[#1a3d1a]/60">
                        {pending
                            ? `${pending.service ?? 'This visit'} for ${
                                  pending.dog ?? 'your dog'
                              } on ${fullDate(pending.date)} at ${
                                  pending.time ?? 'the booked time'
                              } will be cancelled. You can book a new time from the services page.`
                            : ''}
                    </p>

                    <div className="mt-6 flex flex-wrap justify-end gap-2.5">
                        <button
                            type="button"
                            onClick={() => setPending(null)}
                            disabled={cancelling}
                            className={secondaryButtonClass}
                        >
                            Keep visit
                        </button>
                        <button
                            type="button"
                            onClick={confirmCancel}
                            disabled={cancelling}
                            className={dangerButtonClass}
                        >
                            {cancelling && <Spinner className="h-4 w-4" />}
                            Cancel visit
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
