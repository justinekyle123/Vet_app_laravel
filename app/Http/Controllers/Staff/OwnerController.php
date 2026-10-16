<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\DogOwner;
use App\Models\Payment;
use App\Services\Appointments\BookingActions;
use App\Services\Payments\PortalPayments;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Staff-facing management of dog owner records.
 *
 * Available to administrators. Owners are deactivated rather than deleted so
 * their dogs and history stay intact.
 */
class OwnerController extends Controller
{
    /**
     * The money on a booking is read through the same service the portal and
     * the desk dashboard use, so a balance means the same thing everywhere.
     */
    public function __construct(
        private PortalPayments $payments,
        private BookingActions $actions,
    ) {}

    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $status = (string) $request->query('status', 'active');

        $owners = DogOwner::query()
            ->when($search !== '', function (Builder $query) use ($search) {
                $query->where(function (Builder $query) use ($search) {
                    $query->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone_number', 'like', "%{$search}%");
                });
            })
            ->when($status === 'active', fn (Builder $query) => $query->where('is_active', true))
            ->when($status === 'inactive', fn (Builder $query) => $query->where('is_active', false))
            ->withCount('dogs')
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->paginate(10)
            ->withQueryString()
            // The list rows are shaped like the show payload, so the link
            // targets have an `id` rather than the raw `owner_id` column.
            ->through(fn (DogOwner $owner): array => $this->ownerPayload($owner) + [
                'dogs_count' => $owner->dogs_count,
            ]);

        return Inertia::render('Staff/Owners/Index', [
            'owners' => $owners,
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
        ]);
    }

    public function show(DogOwner $owner): Response
    {
        return Inertia::render('Staff/Owners/Show', [
            'owner' => $this->ownerPayload($owner) + [
                'created_at' => $owner->created_at,
            ],
            'dogs' => $owner->dogs()
                ->with('breed:breed_id,breed_name')
                ->orderBy('dog_name')
                ->get()
                ->map(fn ($dog): array => [
                    'id' => $dog->dog_id,
                    'dog_name' => $dog->dog_name,
                    'breed' => $dog->breed?->breed_name,
                    'sex' => $dog->sex,
                    'birth_date' => $dog->birth_date?->toDateString(),
                    'is_vaccinated' => $dog->is_vaccinated,
                    'is_active' => $dog->is_active,
                ])
                ->all(),
            'bookings' => $this->bookingsFor($owner),
        ]);
    }

    public function deactivate(DogOwner $owner): RedirectResponse
    {
        $owner->update(['is_active' => false]);

        return back()->with('status', 'owner-deactivated');
    }

    public function activate(DogOwner $owner): RedirectResponse
    {
        $owner->update(['is_active' => true]);

        return back()->with('status', 'owner-activated');
    }

    /**
     * Every service this owner has booked, in full: the service itself, the
     * dog it was for, the schedule, the assigned staff member, the money, and
     * any notes the desk was given. Upcoming visits come soonest first, then
     * the history most recent first, so the next visit is always at the top.
     *
     * @return list<array<string, mixed>>
     */
    private function bookingsFor(DogOwner $owner): array
    {
        $appointments = $owner->appointments()
            ->with([
                'dog:dog_id,dog_name,breed_id',
                'dog.breed:breed_id,breed_name',
                'service:service_id,service_name,description,duration_minutes,price',
                'staff:staff_id,first_name,last_name',
                'status:status_id,status_name',
                'payments:payment_id,appointment_id,amount,payment_status,method_id,reference,paid_at,payment_proof_path',
                'payments.method:method_id,method_name',
            ])
            ->get();

        $today = today()->toDateString();
        $isAhead = fn (Appointment $appointment): bool =>
            ($appointment->appointment_date?->toDateString() ?? '') >= $today;

        // Stable sorts: the time orders each side of today first, then the
        // date settles it, so same-day visits run in time order.
        $upcoming = $appointments
            ->filter($isAhead)
            ->sortBy(fn (Appointment $appointment): string => substr((string) $appointment->appointment_time, 0, 5))
            ->sortBy(fn (Appointment $appointment): string => $appointment->appointment_date?->toDateString() ?? '');

        $past = $appointments
            ->reject($isAhead)
            ->sortByDesc(fn (Appointment $appointment): string => substr((string) $appointment->appointment_time, 0, 5))
            ->sortByDesc(fn (Appointment $appointment): string => $appointment->appointment_date?->toDateString() ?? '');

        return $upcoming
            ->concat($past)
            ->values()
            ->map(fn (Appointment $appointment): array => $this->bookingPayload($appointment))
            ->all();
    }

    /**
     * One booking as the client page renders it.
     *
     * @return array<string, mixed>
     */
    private function bookingPayload(Appointment $appointment): array
    {
        $settlement = $this->payments->settlement($appointment);

        return [
            'id' => $appointment->appointment_id,
            'date' => $appointment->appointment_date?->toDateString(),
            'time' => substr((string) $appointment->appointment_time, 0, 5),
            'status' => $appointment->status?->status_name,
            'dog' => $appointment->dog?->dog_name,
            'dog_breed' => $appointment->dog?->breed?->breed_name,
            'service' => $appointment->service?->service_name,
            'service_description' => $appointment->service?->description,
            'duration_minutes' => $appointment->service?->duration_minutes,
            'price' => $appointment->service?->price,
            'staff' => $appointment->staff?->fullName(),
            'notes' => $appointment->notes,
            'requested_at' => $appointment->created_at?->toIso8601String(),
            // The money on this visit, shaped exactly as the desk dashboard
            // carries it, so a balance reads the same on both pages.
            'settlement' => $settlement,
            // Money is no bar to calling a visit off from the desk: it simply
            // goes back, so the page warns before the action is confirmed.
            'refund_on_cancel' => $appointment->status?->status_name !== 'Cancelled'
                && (float) $settlement['paid'] > 0,
            // What an administrator may do with this visit, shared with the
            // operations dashboard so both offer exactly the same actions.
            ...$this->actions->for($appointment),
            // Every payment behind that balance, newest first, with its
            // receipt so the desk can open the proof while the client asks.
            'payments' => $appointment->payments
                ->sortByDesc('payment_id')
                ->map(fn (Payment $payment): array => [
                    'id' => $payment->payment_id,
                    'amount' => $payment->amount,
                    'method' => $payment->method?->method_name,
                    'reference' => $payment->reference,
                    'status' => $payment->payment_status,
                    'proof_url' => $payment->proofUrl(),
                    'paid_at' => $payment->paid_at?->toIso8601String(),
                ])
                ->all(),
        ];
    }

    /**
     * The columns the owner detail page renders.
     *
     * @return array<string, mixed>
     */
    private function ownerPayload(DogOwner $owner): array
    {
        return [
            'id' => $owner->owner_id,
            'first_name' => $owner->first_name,
            'last_name' => $owner->last_name,
            'email' => $owner->email,
            'phone_number' => $owner->phone_number,
            'address' => $owner->address,
            'is_active' => $owner->is_active,
        ];
    }
}
