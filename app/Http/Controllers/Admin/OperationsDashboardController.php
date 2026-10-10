<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\AppointmentStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The administrator's working view: today's bookings, what is coming up, and
 * the operational tasks the clinic manages.
 *
 * The page is driven entirely by query parameters so a desk can bookmark or
 * share a view: `status` narrows to one appointment state and `q` searches the
 * client, dog, and service. Totals deliberately ignore the filters, so the
 * headline numbers do not move as the desk narrows the list.
 */
class OperationsDashboardController extends Controller
{
    private const UPCOMING_LIMIT = 15;
    private const ALL_STATUSES = 'all';
    private const STATUS_ORDER = ['Requested', 'Confirmed', 'Completed', 'Cancelled', 'No-show'];
    private const RELATIONS = [
        'dog:dog_id,dog_name',
        'owner:owner_id,first_name,last_name,email,phone_number',
        'service:service_id,service_name,duration_minutes,price',
        'staff:staff_id,first_name,last_name',
        'status:status_id,status_name',
    ];

    public function __invoke(Request $request): Response
    {
        $statusNames = $this->statusNames();
        $requested = (string) $request->query('status', self::ALL_STATUSES);
        $status = in_array($requested, $statusNames, true) ? $requested : self::ALL_STATUSES;
        $search = trim((string) $request->query('q', ''));

        $today = $this->query($status, $search)
            ->whereDate('appointment_date', today())
            ->orderBy('appointment_time')
            ->get();

        $upcoming = $this->query($status, $search)
            ->whereDate('appointment_date', '>', today())
            ->orderBy('appointment_date')
            ->orderBy('appointment_time')
            ->limit(self::UPCOMING_LIMIT)
            ->get();

        return Inertia::render('FrontDesk/Dashboard', [
            'today' => $today->map(fn (Appointment $appointment) => $this->present($appointment))->all(),
            'upcoming' => $upcoming->map(fn (Appointment $appointment) => $this->present($appointment))->all(),
            'filter' => [
                'status' => $status,
                'q' => $search,
            ],
            'statusOptions' => [
                ['value' => self::ALL_STATUSES, 'label' => 'All'],
                ...array_map(fn (string $name): array => ['value' => $name, 'label' => $name], $statusNames),
            ],
            'upcomingLimit' => self::UPCOMING_LIMIT,
            'stats' => $this->stats(),
        ]);
    }

    /**
     * The headline numbers. These are counted from the full day regardless of
     * the active filters, so they behave like a scoreboard rather than a
     * reflection of the current search.
     *
     * @return array<string, int>
     */
    private function stats(): array
    {
        return [
            'today' => Appointment::query()->whereDate('appointment_date', today())->count(),
            'upcoming' => Appointment::query()->whereDate('appointment_date', '>', today())->count(),
            'requested' => Appointment::query()
                ->whereDate('appointment_date', '>=', today())
                ->whereHas('status', fn ($status) => $status->where('status_name', 'Requested'))
                ->count(),
            'confirmed_today' => $this->todayIn('Confirmed'),
            'completed_today' => $this->todayIn('Completed'),
            'cancelled_today' => $this->todayIn(['Cancelled', 'No-show']),
        ];
    }

    /**
     * How many of today's visits sit in one of the given states.
     *
     * @param string|list<string> $statuses
     */
    private function todayIn(string|array $statuses): int
    {
        return Appointment::query()
            ->whereDate('appointment_date', today())
            ->whereHas('status', fn ($status) => $status->whereIn('status_name', (array) $statuses))
            ->count();
    }

    /**
     * @return Builder<Appointment>
     */
    private function query(string $status, string $search): Builder
    {
        return Appointment::query()
            ->with(self::RELATIONS)
            ->when(
                $status !== self::ALL_STATUSES,
                fn (Builder $query) => $query->whereHas(
                    'status',
                    fn ($relation) => $relation->where('status_name', $status),
                ),
            )
            ->when($search !== '', function (Builder $query) use ($search) {
                $term = '%'.$search.'%';

                $query->where(function (Builder $query) use ($term) {
                    $query->whereHas('owner', function (Builder $owner) use ($term) {
                        $owner->where('first_name', 'like', $term)
                            ->orWhere('last_name', 'like', $term)
                            ->orWhere('email', 'like', $term)
                            ->orWhere('phone_number', 'like', $term);
                    })
                        ->orWhereHas('dog', fn (Builder $dog) => $dog->where('dog_name', 'like', $term))
                        ->orWhereHas('service', fn (Builder $service) => $service->where('service_name', 'like', $term));
                });
            });
    }

    /** @return list<string> */
    private function statusNames(): array
    {
        $existing = AppointmentStatus::query()->pluck('status_name')->all();
        $known = array_values(array_intersect(self::STATUS_ORDER, $existing));
        $extra = array_values(array_diff($existing, $known));

        return [...$known, ...$extra];
    }

    /** @return array<string, mixed> */
    private function present(Appointment $appointment): array
    {
        $status = $appointment->status?->status_name;

        return [
            'id' => $appointment->appointment_id,
            'date' => $appointment->appointment_date?->toDateString(),
            'time' => substr((string) $appointment->appointment_time, 0, 5),
            'status' => $status,
            'dog' => $appointment->dog?->dog_name,
            'owner' => $appointment->owner?->fullName(),
            'owner_id' => $appointment->owner_id,
            'owner_phone' => $appointment->owner?->phone_number,
            'owner_email' => $appointment->owner?->email,
            'service' => $appointment->service?->service_name,
            'duration_minutes' => $appointment->service?->duration_minutes,
            'price' => $appointment->service?->price,
            'staff' => $appointment->staff?->fullName(),
            'notes' => $appointment->notes,
            'requested_at' => $appointment->created_at?->toIso8601String(),
            // What the desk is allowed to do next, so the page does not have to
            // re-derive the state machine.
            'can_confirm' => $status === 'Requested',
            // A visit can only be closed out once it is actually due, so a
            // future booking does not offer the action at all.
            'can_complete' => $status === 'Confirmed' && ! $this->isScheduledInFuture($appointment),
            'can_no_show' => $status === 'Confirmed',
            'can_cancel' => in_array($status, ['Requested', 'Confirmed'], true),
        ];
    }

    /** True when the visit's date and time are still ahead of now. */
    private function isScheduledInFuture(Appointment $appointment): bool
    {
        if ($appointment->appointment_date === null) {
            return false;
        }

        $time = (string) ($appointment->appointment_time ?: '00:00:00');

        return $appointment->appointment_date->copy()->setTimeFromTimeString($time)->isFuture();
    }
}
