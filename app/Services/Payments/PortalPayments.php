<?php

namespace App\Services\Payments;

use App\Models\Appointment;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Services\AppointmentNotifications;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

/**
 * The clinic's own online payment.
 *
 * There is no third party in the middle: the owner picks a channel (GCash,
 * Maya, a card, or a bank transfer) on the visit they are paying for, and the
 * payment is recorded against that visit. That reconciliation is why the
 * optional reference number matters — it is whatever the client's wallet or
 * bank showed them.
 *
 * Paying ahead can be split: a client booking next week may settle part of it
 * now and the rest at the desk. Once the clinic has carried the visit out,
 * though, the balance is due in full — a service that has been performed is
 * not something the clinic part-invoices online. A visit can therefore collect
 * several payments, and what is still owed is the price less everything
 * already taken.
 *
 * The channels come from `config/payments.php`, which is also what the portal
 * renders, so the form and the validation agree by construction.
 */
class PortalPayments
{
    /** The visit states the portal will take a payment for. */
    public const PAYABLE_STATUSES = ['Requested', 'Confirmed', 'Completed'];

    /** A cent, as a fudge factor when comparing money. */
    private const CENT = 0.005;

    public function __construct(private AppointmentNotifications $notifications) {}

    /**
     * The channels the portal offers, in the order it shows them.
     *
     * @return list<array{name: string, description: string, icon: string}>
     */
    public function methods(): array
    {
        /** @var list<array{name: string, description: string, icon: string}> $methods */
        $methods = config('payments.methods', []);

        return $methods;
    }

    /**
     * The channel names the server accepts. A hand-written request cannot
     * invent a payment method: anything not on this list is refused.
     *
     * @return list<string>
     */
    public function methodNames(): array
    {
        return array_column($this->methods(), 'name');
    }

    /**
     * Whether the clinic will take a payment for a visit at all.
     */
    public function isPayable(Appointment $appointment): bool
    {
        return in_array($appointment->status?->status_name, self::PAYABLE_STATUSES, true)
            && $this->balance($appointment) > 0;
    }

    /**
     * Whether this visit is being paid for ahead of the day, which is the only
     * case where part of it may be settled now.
     *
     * A visit still sitting in "Confirmed" with its day to come is ahead of the
     * client; once the desk has marked it completed — or the day has passed —
     * the service has been provided and the balance is due in full.
     */
    public function mayPayInPart(Appointment $appointment): bool
    {
        if (! in_array($appointment->status?->status_name, ['Requested', 'Confirmed'], true)) {
            return false;
        }

        $date = $appointment->appointment_date;

        return $date !== null && $date->toDateString() >= today()->toDateString();
    }

    /**
     * The full price of the visit, as a number with two decimals.
     */
    public function price(Appointment $appointment): float
    {
        return $this->money($appointment->service?->price ?? 0);
    }

    /**
     * What the clinic has already taken for a visit, across every payment.
     *
     * Reads the eager-loaded relation when the caller already has it, so a list
     * of visits costs one query rather than one per row.
     */
    public function paidTotal(Appointment $appointment): float
    {
        $payments = $appointment->relationLoaded('payments')
            ? $appointment->payments
            : $appointment->payments()->get();

        return $this->money($this->paidPayments($payments)->sum('amount'));
    }

    /**
     * What is still owed on a visit: the price less everything already taken.
     * Never negative, however the clinic's records have been edited.
     */
    public function balance(Appointment $appointment): float
    {
        return $this->money(max($this->price($appointment) - $this->paidTotal($appointment), 0));
    }

    /**
     * The money story of one visit, in the shape both the portal and the
     * operations desk render: what it costs, what has been taken, what is
     * still due, whether it may be part-paid, and the last payment itself.
     *
     * @return array{
     *     price: string,
     *     paid: string,
     *     balance: string,
     *     state: 'unpaid'|'part'|'paid',
     *     refunded: string,
     *     advance: bool,
     *     last_payment: array{method: string|null, amount: string, reference: string|null, paid_at: string|null}|null
     * }
     */
    public function settlement(Appointment $appointment): array
    {
        $price = $this->price($appointment);
        $paid = $this->paidTotal($appointment);
        $balance = $this->money(max($price - $paid, 0));

        $payments = $appointment->relationLoaded('payments')
            ? $this->paidPayments($appointment->payments)
            : $this->paidPayments($appointment->payments()->get());

        /** @var Payment|null $last */
        $last = $payments->sortByDesc('payment_id')->first();

        return [
            'price' => $this->amount($price),
            'paid' => $this->amount($paid),
            'balance' => $this->amount($balance),
            'state' => $balance <= 0 && $paid > 0 ? 'paid' : ($paid > 0 ? 'part' : 'unpaid'),
            // Money handed back on a visit the clinic called off. A refunded
            // visit therefore reads as owing its price, which is why every
            // page that shows a balance shows this next to it.
            'refunded' => $this->amount($this->refundedTotal($appointment)),
            'advance' => $this->mayPayInPart($appointment),
            'last_payment' => $last === null ? null : [
                'method' => $last->method?->method_name,
                'amount' => $this->amount((float) $last->amount),
                'reference' => $last->reference,
                'paid_at' => $last->paid_at?->toDateString(),
            ],
        ];
    }

    /**
     * One payment as the desk reads it: how much came in, through which
     * channel, for whose visit, whether it arrived ahead of the day, and where
     * the visit stands now that it has.
     *
     * Shared by the console notification bell and the operations page, so a
     * payment is described the same way wherever it turns up.
     *
     * @return array<string, mixed>
     */
    public function paymentSummary(Payment $payment): array
    {
        $appointment = $payment->appointment;
        $settlement = $appointment === null ? null : $this->settlement($appointment);

        return [
            'id' => $payment->payment_id,
            'amount' => $this->amount((float) $payment->amount),
            'method' => $payment->method?->method_name,
            'reference' => $payment->reference,
            'proof_url' => $payment->proofUrl(),
            'paid_at' => $payment->paid_at?->toIso8601String(),
            // Money that arrived before the visit was due is what the desk
            // means by an advance payment.
            'advance' => $this->paidAhead($payment, $appointment),
            'state' => $settlement['state'] ?? 'unpaid',
            'price' => $settlement['price'] ?? null,
            'paid_total' => $settlement['paid'] ?? null,
            'balance' => $settlement['balance'] ?? null,
            'owner' => $appointment?->owner?->fullName(),
            'owner_id' => $appointment?->owner_id,
            'dog' => $appointment?->dog?->dog_name,
            'service' => $appointment?->service?->service_name,
            'visit_on' => $appointment?->appointment_date?->toDateString(),
            'visit_time' => $appointment?->appointment_time === null
                ? null
                : substr((string) $appointment->appointment_time, 0, 5),
            'visit_status' => $appointment?->status?->status_name,
        ];
    }

    /**
     * Record a payment for a visit, in the channel the client chose, and tell
     * the owner it went through.
     *
     * `$amount` is null for "settle the balance", which is what the portal sends
     * when the client is paying the whole of what is due. Returns null when the
     * visit has already been paid for in full — the caller says so rather than
     * the clinic banking the money twice.
     *
     * @throws ValidationException when the amount is not one the clinic can take
     */
    public function pay(
        Appointment $appointment,
        string $method,
        ?float $amount = null,
        ?string $reference = null,
        ?string $proofPath = null,
    ): ?Payment {
        $balance = $this->balance($appointment);

        if ($balance <= 0) {
            return null;
        }

        $requested = $amount === null ? $balance : $this->money($amount);

        if ($requested <= 0) {
            throw ValidationException::withMessages([
                'amount' => 'Enter how much you would like to pay.',
            ]);
        }

        if ($requested > $balance + self::CENT) {
            throw ValidationException::withMessages([
                'amount' => 'That is more than the '.$this->label($balance).' still due on this visit.',
            ]);
        }

        if (! $this->mayPayInPart($appointment) && abs($requested - $balance) > self::CENT) {
            throw ValidationException::withMessages([
                'amount' => 'This visit has already taken place, so the '.$this->label($balance).' balance has to be paid in full. Part payments are only for visits paid ahead of the day.',
            ]);
        }

        $payment = Payment::create([
            'appointment_id' => $appointment->appointment_id,
            'owner_id' => $appointment->owner_id,
            'method_id' => $this->methodId($method),
            'amount' => $requested,
            'payment_status' => Payment::STATUS_PAID,
            'reference' => $reference === null || trim($reference) === '' ? null : trim($reference),
            'payment_proof_path' => $proofPath,
            'paid_at' => now(),
        ]);

        $payment->setRelation('appointment', $appointment);

        $settled = $requested + self::CENT >= $balance;

        $this->notifications->paid($appointment, $requested, $this->money($balance - $requested), $settled);

        return $payment;
    }

    /**
     * What the clinic has already handed back on a visit.
     */
    public function refundedTotal(Appointment $appointment): float
    {
        $payments = $appointment->relationLoaded('payments')
            ? $appointment->payments
            : $appointment->payments()->get();

        return $this->money(
            $payments->where('payment_status', Payment::STATUS_REFUNDED)->sum('amount')
        );
    }

    /**
     * Hand the money back on a visit the clinic is calling off.
     *
     * The clinic refunds at the desk, so this records what is owed back rather
     * than moving money: every payment still standing is marked refunded and
     * the total comes back for the owner's message. Returns 0.00 when nothing
     * was ever taken, and never touches a payment that has already been
     * refunded.
     */
    public function refund(Appointment $appointment): float
    {
        $payments = $appointment->relationLoaded('payments')
            ? $appointment->payments
            : $appointment->payments()->get();

        $standing = $this->paidPayments($payments);

        if ($standing->isEmpty()) {
            return 0.0;
        }

        foreach ($standing as $payment) {
            $payment->update(['payment_status' => Payment::STATUS_REFUNDED]);
        }

        return $this->money($standing->sum('amount'));
    }

    /**
     * Whether a payment reached the clinic before the visit was due. A payment
     * taken on the day, at the desk, counts as after the visit rather than
     * ahead of it.
     */
    private function paidAhead(Payment $payment, ?Appointment $appointment): bool
    {
        if ($appointment?->appointment_date === null || $payment->paid_at === null) {
            return false;
        }

        $scheduled = $appointment->appointment_date
            ->copy()
            ->setTimeFromTimeString((string) ($appointment->appointment_time ?: '00:00:00'));

        return $payment->paid_at->lessThan($scheduled);
    }

    /**
     * The payments that count as money in the till.
     *
     * @param  Collection<int, Payment>  $payments
     * @return Collection<int, Payment>
     */
    private function paidPayments(Collection $payments): Collection
    {
        return $payments->where('payment_status', Payment::STATUS_PAID);
    }

    /**
     * The id behind a channel name, created the first time the clinic uses it
     * so a new channel in the config needs no migration.
     */
    private function methodId(string $name): int
    {
        return PaymentMethod::firstOrCreate(['method_name' => $name])->method_id;
    }

    /** An amount as a plain two-decimal number, so comparisons are exact enough. */
    private function money(float|int|string $value): float
    {
        return round((float) $value, 2);
    }

    /**
     * An amount as the pages carry it: a bare two-decimal string, the same
     * shape Eloquent hands back for the `price` column. No thousands separator,
     * so the client-side money formatter reads it as one number.
     */
    private function amount(float $value): string
    {
        return number_format($value, 2, '.', '');
    }

    /** An amount as the clinic writes it in a message. */
    private function label(float $value): string
    {
        return '$'.number_format($value, 2);
    }
}
