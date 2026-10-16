import AppointmentStatusChip from '@/Components/AppointmentStatusChip';
import {
    dangerButtonClass,
    secondaryButtonClass,
} from '@/Components/buttonStyles';
import Panel, { EmptyState } from '@/Components/Panel';
import StatusPill from '@/Components/StatusPill';
import StaffLayout from '@/Layouts/StaffLayout';
import { PortalSettlement } from '@/types';
import { currency, dateTime, longDate } from '@/utils/format';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

interface OwnerDetail {
    id: number;
    first_name: string;
    last_name: string;
    email: string | null;
    phone_number: string | null;
    address: string | null;
    is_active: boolean;
    created_at: string;
}

interface DogSummary {
    id: number;
    dog_name: string;
    breed: string | null;
    sex: string | null;
    birth_date: string | null;
    is_vaccinated: boolean;
    is_active: boolean;
}

/** One payment made against a booking. */
interface BookingPayment {
    id: number;
    amount: string;
    method: string | null;
    reference: string | null;
    status: string;
    proof_url: string | null;
    paid_at: string | null;
}

/** One booked service, with everything the desk knows about it. */
interface BookingSummary {
    id: number;
    date: string | null;
    time: string | null;
    status: string | null;
    dog: string | null;
    dog_breed: string | null;
    service: string | null;
    service_description: string | null;
    duration_minutes: number | null;
    price: string | null;
    staff: string | null;
    notes: string | null;
    requested_at: string | null;
    settlement: PortalSettlement;
    payments: BookingPayment[];
    /** What an administrator may do with this visit, straight from the desk. */
    can_confirm: boolean;
    can_complete: boolean;
    can_no_show: boolean;
    can_cancel: boolean;
    /** True when calling the visit off hands money back at the desk. */
    refund_on_cancel: boolean;
}

type DeskAction = 'confirm' | 'complete' | 'no-show' | 'cancel';

/** Copy and tone for each action, so every confirmation reads the same here
 * as it does on the operations dashboard. */
const actionCopy: Record<
    DeskAction,
    { verb: string; title: string; icon: 'question' | 'warning'; tone: string }
> = {
    confirm: {
        verb: 'Confirm',
        title: 'Confirm this appointment?',
        icon: 'question',
        tone: '#2a5a2a',
    },
    complete: {
        verb: 'Mark completed',
        title: 'Mark this visit as completed?',
        icon: 'question',
        tone: '#1a3d1a',
    },
    'no-show': {
        verb: 'Record no-show',
        title: 'Record this visit as a no-show?',
        icon: 'warning',
        tone: '#b3261e',
    },
    cancel: {
        verb: 'Cancel appointment',
        title: 'Cancel this appointment?',
        icon: 'warning',
        tone: '#b3261e',
    },
};

/** Bare `YYYY-MM-DD` in local time, so the day cannot slip a timezone back. */
function shortDate(iso: string | null): string {
    if (!iso) {
        return '—';
    }

    const date = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);

    return Number.isNaN(date.getTime())
        ? '—'
        : date.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
          });
}

/**
 * How much of a visit has been paid for, in as few words as possible — the
 * one thing the desk needs from a row when a client is standing in front of
 * them. Matches the desk dashboard's wording so both pages read alike.
 */
function moneyLabel(settlement: PortalSettlement): string {
    if (settlement.state === 'paid') {
        return 'Paid in full';
    }

    if (settlement.state === 'part') {
        return `${currency(settlement.paid)} of ${currency(settlement.price)} paid`;
    }

    return `${currency(settlement.balance)} due`;
}

/** Tone for the money chip: settled, part-paid, or untouched. */
const moneyChipClass: Record<PortalSettlement['state'], string> = {
    paid: 'bg-[#EFFDF0] text-[#2a5a2a]',
    part: 'bg-[#E86A10]/10 text-[#E86A10]',
    unpaid: 'bg-[#1a3d1a]/5 text-[#1a3d1a]/55',
};

function Detail({ label, value }: { label: string; value: string | null }) {
    return (
        <div className="min-w-0">
            <dt className="text-[0.66rem] font-semibold uppercase tracking-[0.12em] text-[#1a3d1a]/45">
                {label}
            </dt>
            <dd className="mt-1 break-words text-sm text-[#1a3d1a]">
                {value && value !== '' ? value : '—'}
            </dd>
        </div>
    );
}

export default function Show({
    owner,
    dogs,
    bookings,
}: {
    owner: OwnerDetail;
    dogs: DogSummary[];
    bookings: BookingSummary[];
}) {
    const fullName = `${owner.first_name} ${owner.last_name}`;
    const [actionError, setActionError] = useState<string | null>(null);

    /*
     * Every transition changes a client's booking, so each is confirmed through
     * a themed dialog before the request goes out. A refusal — a visit called
     * out before it is due, one already cancelled — comes back on the
     * `appointment` key and is shown above the list rather than swallowed.
     */
    const changeStatus = (booking: BookingSummary, action: DeskAction) => {
        const copy = actionCopy[action];

        Swal.fire({
            title: copy.title,
            text: `${booking.service ?? 'This visit'} for ${booking.dog ?? 'the client'} on ${shortDate(booking.date)} at ${booking.time ?? '—'}.${
                action === 'cancel' && booking.refund_on_cancel
                    ? ' The money already paid is refunded at the desk, and the client is told how much to collect.'
                    : ''
            }`,
            icon: copy.icon,
            showCancelButton: true,
            confirmButtonText: copy.verb,
            cancelButtonText: 'Back',
            confirmButtonColor: copy.tone,
            cancelButtonColor: '#1a3d1a',
            reverseButtons: true,
            focusCancel: true,
        }).then((result) => {
            if (!result.isConfirmed) {
                return;
            }

            setActionError(null);

            router.patch(
                route(`admin.operations.appointments.${action}`, booking.id),
                {},
                {
                    preserveScroll: true,
                    onError: (errors) =>
                        setActionError(
                            errors.appointment ??
                                'That change could not be made.',
                        ),
                },
            );
        });
    };

    /*
     * Contact details are the owner's own to maintain through the portal, so
     * the console's only action here is switching the record's status. That
     * still affects who can sign in, so it is confirmed first.
     */
    const confirmToggle = () => {
        Swal.fire({
            title: owner.is_active
                ? `Deactivate ${fullName}?`
                : `Reactivate ${fullName}?`,
            text: owner.is_active
                ? 'The account leaves the active list and the owner can no longer sign in. Their dogs and history stay on file.'
                : 'The account returns to the active list and the owner can sign in again.',
            icon: owner.is_active ? 'warning' : 'question',
            showCancelButton: true,
            confirmButtonText: owner.is_active ? 'Deactivate' : 'Reactivate',
            cancelButtonText: 'Cancel',
            confirmButtonColor: owner.is_active ? '#b3261e' : '#1a3d1a',
            cancelButtonColor: '#1a3d1a',
            reverseButtons: true,
            focusCancel: true,
        }).then((result) => {
            if (!result.isConfirmed) {
                return;
            }

            router.patch(
                route(
                    owner.is_active
                        ? 'owners.deactivate'
                        : 'owners.activate',
                    owner.id,
                ),
                {},
                { preserveScroll: true },
            );
        });
    };

    return (
        <StaffLayout
            title={fullName}
            heading={fullName}
            description="Client record, contact details, and the dogs registered under this owner."
            actions={
                <>
                    <StatusPill active={owner.is_active} />
                    <button
                        type="button"
                        onClick={confirmToggle}
                        className={
                            owner.is_active
                                ? dangerButtonClass
                                : secondaryButtonClass
                        }
                    >
                        {owner.is_active ? 'Deactivate' : 'Reactivate'}
                    </button>
                </>
            }
        >
            <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <Panel
                            title="Contact details"
                            icon="user"
                            fill
                            action={
                                <span className="text-xs font-medium text-[#1a3d1a]/45">
                                    Client since {longDate(owner.created_at)}
                                </span>
                            }
                        >
                            <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <Detail label="Email" value={owner.email} />
                                <Detail label="Phone" value={owner.phone_number} />
                                <Detail label="Address" value={owner.address} />
                            </dl>
                        </Panel>
                    </div>

                    <Panel
                        title="Dogs"
                        icon="paw"
                        fill
                        action={
                            <span className="text-xs font-medium text-[#1a3d1a]/45">
                                {dogs.length} {dogs.length === 1 ? 'dog' : 'dogs'}
                            </span>
                        }
                    >
                        {dogs.length === 0 ? (
                            <EmptyState
                                icon="paw"
                                message="No dogs are registered under this owner yet."
                            />
                        ) : (
                            <ul className="divide-y divide-[#1a3d1a]/10">
                                {dogs.map((dog) => (
                                    <li
                                        key={dog.id}
                                        className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-[#1a3d1a]">
                                                {dog.dog_name}
                                            </p>
                                            <p className="truncate text-xs text-[#1a3d1a]/55">
                                                {[dog.breed, dog.sex]
                                                    .filter(Boolean)
                                                    .join(' · ')}
                                            </p>
                                            {dog.birth_date && (
                                                <p className="mt-0.5 text-[0.68rem] text-[#1a3d1a]/45">
                                                    Born {longDate(dog.birth_date)}
                                                </p>
                                            )}
                                        </div>
                                        <StatusPill
                                            active={dog.is_active}
                                            activeLabel="Active"
                                        />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Panel>
                </div>

                {/* Every service this client has booked, in full. */}
                <Panel
                    title="Booked services"
                    icon="calendar"
                    action={
                        <span className="text-xs font-medium text-[#1a3d1a]/45">
                            {bookings.length}
                            {bookings.length === 1 ? ' booking' : ' bookings'}
                        </span>
                    }
            >
                {actionError && (
                    <p
                        role="alert"
                        className="mb-4 rounded-xl bg-[#b3261e]/5 px-4 py-2.5 text-sm text-[#b3261e]"
                    >
                        {actionError}
                    </p>
                )}

                {bookings.length === 0 ? (
                    <EmptyState
                        icon="calendar"
                        message="No services have been booked under this owner yet."
                    />
                    ) : (
                        <ul className="divide-y divide-[#1a3d1a]/5">
                            {bookings.map((booking) => (
                                <li
                                    key={booking.id}
                                    className="py-4 first:pt-0 last:pb-0"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="truncate text-sm font-semibold text-[#1a3d1a]">
                                                    {booking.service ?? 'Visit'}
                                                </p>
                                                <AppointmentStatusChip
                                                    status={booking.status}
                                                />
                                            {/* Money called off comes back at the counter, so a
                                                refunded visit says that rather than "due". */}
                                            {booking.settlement.refunded !==
                                            '0.00' ? (
                                                <span
                                                    className="shrink-0 rounded-full bg-[#E86A10]/10 px-2.5 py-0.5 text-[0.62rem] font-semibold text-[#E86A10]"
                                                    title="This money is handed back at the front desk."
                                                >
                                                    Refund{' '}
                                                    {currency(
                                                        booking.settlement
                                                            .refunded,
                                                    )}{' '}
                                                    at desk
                                                </span>
                                            ) : (
                                                <span
                                                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[0.62rem] font-semibold ${moneyChipClass[booking.settlement.state]}`}
                                                    title={moneyLabel(
                                                        booking.settlement,
                                                    )}
                                                >
                                                    {moneyLabel(
                                                        booking.settlement,
                                                    )}
                                                </span>
                                            )}

                                            {booking.refund_on_cancel && (
                                                <span
                                                    className="shrink-0 rounded-full border border-dashed border-[#E86A10]/30 px-2.5 py-0.5 text-[0.62rem] font-semibold text-[#E86A10]"
                                                    title="Calling this visit off refunds the money at the desk."
                                                >
                                                    Refund if cancelled
                                                </span>
                                            )}
                                        </div>

                                            <p className="mt-0.5 truncate text-xs text-[#1a3d1a]/60">
                                                {[booking.dog, booking.dog_breed]
                                                    .filter(Boolean)
                                                    .join(' · ') ||
                                                    'Dog not recorded'}
                                            </p>
                                        </div>

                                        <div className="shrink-0 text-right">
                                            <p className="text-sm font-semibold text-[#1a3d1a]">
                                                {shortDate(booking.date)}
                                            </p>
                                            <p className="text-xs text-[#1a3d1a]/55">
                                                {booking.time ?? '—'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* The booking itself, field by field. */}
                                    <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl bg-[#EFFDF0]/60 px-4 py-3 sm:grid-cols-4">
                                        <Detail
                                            label="Duration"
                                            value={
                                                booking.duration_minutes
                                                    ? `${booking.duration_minutes} min`
                                                    : null
                                            }
                                        />
                                        <Detail
                                            label="Price"
                                            value={currency(booking.price)}
                                        />
                                        <Detail
                                            label="Assigned to"
                                            value={booking.staff}
                                        />
                                        <Detail
                                            label="Requested"
                                            value={
                                                booking.requested_at
                                                    ? dateTime(booking.requested_at)
                                                    : null
                                            }
                                        />
                                    </dl>

                                    {/* The money: every payment on this visit. */}
                                    <div className="mt-3">
                                        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[#1a3d1a]/45">
                                            Payments
                                        </p>
                                        {booking.payments.length === 0 ? (
                                            <p className="mt-1 text-xs text-[#1a3d1a]/50">
                                                No payment recorded yet —{' '}
                                                {currency(booking.settlement.balance)}{' '}
                                                outstanding.
                                            </p>
                                        ) : (
                                            <ul className="mt-1.5 space-y-1.5">
                                                {booking.payments.map((payment) => (
                                                    <li
                                                        key={payment.id}
                                                        className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs"
                                                    >
                                                        <span className="text-[#1a3d1a]/70">
                                                            {payment.method ??
                                                                'Payment'}{' '}
                                                            ·{' '}
                                                            <span className="font-semibold text-[#1a3d1a]">
                                                                {currency(
                                                                    payment.amount,
                                                                )}
                                                            </span>
                                                            {payment.reference && (
                                                                <>
                                                                    {' '}
                                                                    · ref{' '}
                                                                    <span className="font-mono">
                                                                        {
                                                                            payment.reference
                                                                        }
                                                                    </span>
                                                                </>
                                                            )}
                                                        </span>
                                                        <span className="flex items-center gap-2.5">
                                                            <span className="shrink-0 rounded-full bg-[#1a3d1a]/5 px-2 py-0.5 text-[0.62rem] font-semibold text-[#1a3d1a]/60">
                                                                {payment.status}
                                                            </span>
                                                            {payment.paid_at && (
                                                                <span className="text-[#1a3d1a]/45">
                                                                    {dateTime(
                                                                        payment.paid_at,
                                                                    )}
                                                                </span>
                                                            )}
                                                            {payment.proof_url && (
                                                                <a
                                                                    href={
                                                                        payment.proof_url
                                                                    }
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="shrink-0 font-semibold text-[#E86A10] underline underline-offset-2"
                                                                >
                                                                    View receipt
                                                                </a>
                                                            )}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>

                                    {booking.service_description && (
                                        <p className="mt-3 text-xs leading-relaxed text-[#1a3d1a]/55">
                                            {booking.service_description}
                                        </p>
                                    )}

                                {booking.notes && (
                                    <p className="mt-2 rounded-lg bg-[#EFFDF0]/70 px-2.5 py-1.5 text-xs italic leading-relaxed text-[#1a3d1a]/60">
                                        {booking.notes}
                                    </p>
                                )}

                                {/* The desk's own levers, right on the client's
                                    record, so a visit can be run start to
                                    finish without leaving this page. */}
                                {(booking.can_confirm ||
                                    booking.can_complete ||
                                    booking.can_no_show ||
                                    booking.can_cancel) && (
                                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#1a3d1a]/5 pt-3">
                                        <span className="text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-[#1a3d1a]/40">
                                            Desk actions
                                        </span>

                                        {booking.can_confirm && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    changeStatus(
                                                        booking,
                                                        'confirm',
                                                    )
                                                }
                                                className="rounded-full border border-[#2a5a2a]/25 bg-white px-3 py-1 text-[0.68rem] font-semibold text-[#2a5a2a] transition-colors duration-150 hover:bg-[#2a5a2a]/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2a5a2a]"
                                            >
                                                Confirm
                                            </button>
                                        )}

                                        {booking.can_complete && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    changeStatus(
                                                        booking,
                                                        'complete',
                                                    )
                                                }
                                                className="rounded-full border border-[#1a3d1a]/25 bg-white px-3 py-1 text-[0.68rem] font-semibold text-[#1a3d1a] transition-colors duration-150 hover:bg-[#1a3d1a]/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]"
                                            >
                                                Complete
                                            </button>
                                        )}

                                        {booking.can_no_show && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    changeStatus(
                                                        booking,
                                                        'no-show',
                                                    )
                                                }
                                                className="rounded-full border border-[#1a3d1a]/15 bg-white px-3 py-1 text-[0.68rem] font-semibold text-[#1a3d1a]/55 transition-colors duration-150 hover:bg-[#1a3d1a]/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]"
                                            >
                                                No-show
                                            </button>
                                        )}

                                        {booking.can_cancel && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    changeStatus(
                                                        booking,
                                                        'cancel',
                                                    )
                                                }
                                                className="rounded-full border border-[#b3261e]/25 bg-white px-3 py-1 text-[0.68rem] font-semibold text-[#b3261e] transition-colors duration-150 hover:bg-[#b3261e]/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b3261e]"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                )}
                            </li>
                            ))}
                        </ul>
                    )}
                </Panel>
            </div>
        </StaffLayout>
    );
}
