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
 */
class OperationsDashboardController extends Controller
{
    private const UPCOMING_LIMIT = 10;
    private const ALL_STATUSES = 'all';
    private const STATUS_ORDER = ['Requested', 'Confirmed', 'Completed', 'Cancelled', 'No-show'];
    private const RELATIONS = [
        'dog:dog_id,dog_name',
        'owner:owner_id,first_name,last_name',
        'service:service_id,service_name,duration_minutes',
        'staff:staff_id,first_name,last_name',
        'status:status_id,status_name',
    ];

    public function __invoke(Request $request): Response
    {
        $statusNames = $this->statusNames();
        $requested = (string) $request->query('status', self::ALL_STATUSES);
        $status = in_array($requested, $statusNames, true) ? $requested : self::ALL_STATUSES;

        $today = $this->query($status)
            ->whereDate('appointment_date', today())
            ->orderBy('appointment_time')
            ->get();

        $upcoming = $this->query($status)
            ->whereDate('appointment_date', '>', today())
            ->orderBy('appointment_date')
            ->orderBy('appointment_time')
            ->limit(self::UPCOMING_LIMIT)
            ->get();

        return Inertia::render('FrontDesk/Dashboard', [
            'today' => $today->map(fn (Appointment $appointment) => $this->present($appointment))->all(),
            'upcoming' => $upcoming->map(fn (Appointment $appointment) => $this->present($appointment))->all(),
            'filter' => ['status' => $status],
            'statusOptions' => [
                ['value' => self::ALL_STATUSES, 'label' => 'All'],
                ...array_map(fn (string $name): array => ['value' => $name, 'label' => $name], $statusNames),
            ],
            'stats' => [
                'today' => Appointment::query()->whereDate('appointment_date', today())->count(),
                'upcoming' => min(
                    self::UPCOMING_LIMIT,
                    Appointment::query()->whereDate('appointment_date', '>', today())->count(),
                ),
                'requested' => Appointment::query()
                    ->whereDate('appointment_date', '>=', today())
                    ->whereHas('status', fn ($status) => $status->where('status_name', 'Requested'))
                    ->count(),
            ],
        ]);
    }

    /** @return Builder<Appointment> */
    private function query(string $status): Builder
    {
        return Appointment::query()
            ->with(self::RELATIONS)
            ->when(
                $status !== self::ALL_STATUSES,
                fn (Builder $query) => $query->whereHas(
                    'status',
                    fn ($relation) => $relation->where('status_name', $status),
                ),
            );
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
        return [
            'id' => $appointment->appointment_id,
            'date' => $appointment->appointment_date?->toDateString(),
            'time' => substr((string) $appointment->appointment_time, 0, 5),
            'status' => $appointment->status?->status_name,
            'dog' => $appointment->dog?->dog_name,
            'owner' => $appointment->owner?->fullName(),
            'owner_id' => $appointment->owner_id,
            'service' => $appointment->service?->service_name,
            'duration_minutes' => $appointment->service?->duration_minutes,
            'staff' => $appointment->staff?->fullName(),
            'notes' => $appointment->notes,
        ];
    }
}
