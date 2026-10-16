import {
    primaryButtonClass,
    secondaryButtonClass,
} from '@/Components/buttonStyles';
import { fieldClass, labelClass } from '@/Components/formStyles';
import Modal from '@/Components/Modal';
import Spinner from '@/Components/Spinner';
import { PaymentMethodOption, PortalAppointment } from '@/types';
import { currency, longDate } from '@/utils/format';
import { router } from '@inertiajs/react';
import { Check, CreditCard, Landmark, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * The clinic's own checkout, in the portal.
 *
 * There is no gateway and no card form: the client picks the channel they are
 * paying with — GCash, Maya, a card, or a bank transfer — and the payment is
 * recorded against the visit straight away. The optional reference number is
 * whatever their wallet or bank app showed them, which is what the desk
 * matches the money against.
 *
 * Paying ahead can be split: a deposit now, the rest at the desk. Once the
 * visit has taken place the balance is due in full, so the amount field is only
 * offered while the visit is still to come. The rules themselves live on the
 * server, which refuses anything this form would not offer.
 *
 * The channels come from the server (shared with every portal page), so the
 * list on screen and the list the payment endpoint accepts are the same one.
 */

/** The picture for a channel, by the `icon` the server sends. */
const methodIcons = {
    wallet: Wallet,
    card: CreditCard,
    bank: Landmark,
} as const;

export default function PaymentModal({
    appointment,
    methods,
    onClose,
}: {
    /** The visit being paid for, or null while the modal is closed. */
    appointment: PortalAppointment | null;
    methods: PaymentMethodOption[];
    onClose: () => void;
}) {
    const settlement = appointment?.settlement ?? null;
    const balance = settlement ? Number.parseFloat(settlement.balance) : 0;
    const alreadyPaid = settlement ? Number.parseFloat(settlement.paid) : 0;

    const [method, setMethod] = useState(methods[0]?.name ?? '');
    const [amount, setAmount] = useState('');
    const [reference, setReference] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    /*
     * Each visit gets a clean slate: the first channel is preselected, the
     * amount starts at the whole balance (the common case), and nothing carries
     * over from the last payment the client made.
     */
    useEffect(() => {
        setMethod(methods[0]?.name ?? '');
        setAmount(settlement?.balance ?? '');
        setReference('');
        setError(null);
    }, [appointment?.id, settlement?.balance, methods]);

    const entered = Number.parseFloat(amount);
    const validAmount =
        Number.isFinite(entered) && entered > 0 && entered <= balance + 0.001;
    const partPayment = validAmount && entered < balance - 0.001;

    const close = () => {
        if (!processing) {
            onClose();
        }
    };

    const submit = () => {
        if (!appointment) {
            return;
        }

        setError(null);
        setProcessing(true);

        router.post(
            route('owner.payments.store', appointment.id),
            { method, amount: validAmount ? entered.toFixed(2) : amount, reference },
            {
                preserveScroll: true,
                onError: (errors) =>
                    setError(
                        errors.payment ??
                            errors.amount ??
                            errors.method ??
                            errors.reference ??
                            'The payment could not be recorded. Please try again.',
                    ),
                onSuccess: () => onClose(),
                onFinish: () => setProcessing(false),
            },
        );
    };

    /* What the visit being paid for is, the way a receipt reads it. */
    const summary = appointment
        ? [
              appointment.service ?? 'Visit',
              appointment.dog,
              appointment.time ? `at ${appointment.time}` : null,
          ]
              .filter(Boolean)
              .join(' · ')
        : '';

    const buttonLabel = validAmount
        ? `Pay ${currency(entered)}`
        : 'Pay the balance';

    return (
        <Modal show={appointment !== null} onClose={close} maxWidth="lg">
            <div className="p-6">
                <h2 className="font-serif-display text-xl leading-tight text-[#1a3d1a]">
                    Pay for this visit
                </h2>

                <p className="mt-2 text-sm leading-relaxed text-[#1a3d1a]/60">
                    {summary} on {longDate(appointment?.date ?? null)}.
                </p>

                <div className="mt-4 rounded-2xl bg-[#EFFDF0] px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#1a3d1a]/50">
                            Still to pay
                        </span>
                        <span className="font-serif-display text-xl text-[#1a3d1a]">
                            {currency(settlement?.balance ?? null)}
                        </span>
                    </div>

                    {alreadyPaid > 0 && (
                        <p className="mt-1.5 text-xs leading-relaxed text-[#1a3d1a]/55">
                            {currency(settlement?.paid ?? null)} already paid of
                            the {currency(settlement?.price ?? null)} visit.
                        </p>
                    )}
                </div>

                {settlement?.advance ? (
                    <div className="mt-4">
                        <label htmlFor="payment-amount" className={labelClass}>
                            How much would you like to pay now?
                        </label>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            <input
                                id="payment-amount"
                                type="number"
                                inputMode="decimal"
                                min="0.01"
                                step="0.01"
                                max={settlement.balance}
                                value={amount}
                                onChange={(event) =>
                                    setAmount(event.target.value)
                                }
                                disabled={processing}
                                className={`${fieldClass} mt-0 max-w-[10rem]`}
                            />
                            <button
                                type="button"
                                onClick={() => setAmount(settlement.balance)}
                                disabled={processing}
                                className="rounded-full border border-[#1a3d1a]/15 bg-white px-3.5 py-2 text-xs font-semibold text-[#1a3d1a] transition-colors duration-150 hover:bg-[#EFFDF0] disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]"
                            >
                                Pay it all
                            </button>
                        </div>

                        <p className="mt-2 text-xs leading-relaxed text-[#1a3d1a]/50">
                            {partPayment
                                ? `Part payment. The remaining ${currency(balance - entered)} can be settled at the desk when you come in.`
                                : 'This visit is still ahead, so you can pay part of it now and the rest at the desk.'}
                        </p>

                        {!validAmount && amount.trim() !== '' && (
                            <p className="mt-2 text-xs leading-relaxed text-[#b3261e]">
                                Enter an amount between{' '}
                                {currency(0.01)} and{' '}
                                {currency(settlement.balance)}.
                            </p>
                        )}
                    </div>
                ) : (
                    <p className="mt-4 rounded-xl bg-[#1a3d1a]/5 px-3.5 py-2.5 text-xs leading-relaxed text-[#1a3d1a]/60">
                        This visit has already taken place, so the balance is
                        paid in full
                        {alreadyPaid > 0
                            ? ' — part of it was settled earlier.'
                            : '.'}
                    </p>
                )}

                <div className="mt-5">
                    <span className={labelClass}>
                        How would you like to pay?
                    </span>

                    <div
                        role="radiogroup"
                        aria-label="How would you like to pay?"
                        className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2"
                    >
                        {methods.map((option) => {
                            const Icon = methodIcons[option.icon] ?? Wallet;
                            const selected = method === option.name;

                            return (
                                <button
                                    key={option.name}
                                    type="button"
                                    role="radio"
                                    aria-checked={selected}
                                    onClick={() => setMethod(option.name)}
                                    disabled={processing}
                                    className={`flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a] disabled:opacity-60 ${
                                        selected
                                            ? 'border-[#E86A10] bg-[#E86A10]/5'
                                            : 'border-[#1a3d1a]/12 bg-white hover:bg-[#EFFDF0]/60'
                                    }`}
                                >
                                    <span
                                        aria-hidden="true"
                                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                                            selected
                                                ? 'bg-[#E86A10] text-white'
                                                : 'bg-[#EFFDF0] text-[#1a3d1a]'
                                        }`}
                                    >
                                        <Icon className="h-4 w-4" />
                                    </span>

                                    <span className="min-w-0">
                                        <span className="flex items-center gap-1.5 text-sm font-semibold text-[#1a3d1a]">
                                            {option.name}
                                            {selected && (
                                                <Check className="h-3.5 w-3.5 text-[#E86A10]" />
                                            )}
                                        </span>
                                        <span className="mt-0.5 block text-xs leading-relaxed text-[#1a3d1a]/55">
                                            {option.description}
                                        </span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-4">
                    <label htmlFor="payment-reference" className={labelClass}>
                        Reference number{' '}
                        <span className="font-normal text-[#1a3d1a]/45">
                            (optional)
                        </span>
                    </label>
                    <input
                        id="payment-reference"
                        type="text"
                        value={reference}
                        onChange={(event) => setReference(event.target.value)}
                        maxLength={60}
                        disabled={processing}
                        placeholder="e.g. 0123 456 789123"
                        className={fieldClass}
                    />
                    <p className="mt-1.5 text-xs leading-relaxed text-[#1a3d1a]/50">
                        If your wallet or bank showed you one, add it here and
                        the clinic can match your payment straight away.
                    </p>
                </div>

                {error && (
                    <p className="mt-4 rounded-xl bg-[#b3261e]/5 px-3 py-2 text-xs leading-relaxed text-[#b3261e]">
                        {error}
                    </p>
                )}

                <div className="mt-6 flex flex-wrap justify-end gap-2.5">
                    <button
                        type="button"
                        onClick={close}
                        disabled={processing}
                        className={secondaryButtonClass}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={submit}
                        disabled={processing || !appointment || !validAmount}
                        className={primaryButtonClass}
                    >
                        {processing && <Spinner className="h-4 w-4" />}
                        {buttonLabel}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
