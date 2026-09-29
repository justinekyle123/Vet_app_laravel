<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Dog;
use App\Models\DogOwner;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Backs the portal navbar's search box.
 *
 * Deliberately split from the landing page's client-side search: an owner has
 * private data worth searching (their dogs and their visits), so the match runs
 * server-side and is scoped to the signed-in owner. Services are the clinic's
 * own catalogue and are readable by any client.
 */
class SearchController extends Controller
{
    /** Matches returned per group. */
    private const LIMIT = 5;

    /** Below this, a "search" is just noise — return nothing. */
    private const MIN_TERM_LENGTH = 2;

    public function __invoke(Request $request): JsonResponse
    {
        /** @var DogOwner $owner */
        $owner = $request->user();
        $term = trim((string) $request->query('q', ''));

        if (mb_strlen($term) < self::MIN_TERM_LENGTH) {
            return response()->json(['dogs' => [], 'appointments' => [], 'services' => []]);
        }

        $like = '%'.$term.'%';

        return response()->json([
            'dogs' => $this->dogs($owner, $like),
            'appointments' => $this->appointments($owner, $like),
            'services' => $this->services($like),
        ]);
    }

    /**
     * The owner's own dogs.
     *
     * @return list<array<string, mixed>>
     */
    private function dogs(DogOwner $owner, string $like): array
    {
        return Dog::query()
            ->where('owner_id', $owner->owner_id)
            ->where('dog_name', 'like', $like)
            ->with('breed:breed_id,breed_name')
            ->orderBy('dog_name')
            ->limit(self::LIMIT)
            ->get()
            ->map(fn (Dog $dog): array => [
                'id' => $dog->dog_id,
                'label' => $dog->dog_name,
                'meta' => collect([$dog->breed?->breed_name, $dog->sex])
                    ->filter()
                    ->implode(' · '),
                // Dogs are managed from the account page's dog list.
                'href' => route('owner.account.edit'),
            ])
            ->all();
    }

    /**
     * The owner's own visits, matched by dog or service name.
     *
     * @return list<array<string, mixed>>
     */
    private function appointments(DogOwner $owner, string $like): array
    {
        return Appointment::query()
            ->where('owner_id', $owner->owner_id)
            ->where(function ($query) use ($like) {
                $query->whereHas('dog', fn ($dog) => $dog->where('dog_name', 'like', $like))
                    ->orWhereHas('service', fn ($service) => $service->where('service_name', 'like', $like));
            })
            ->with([
                'dog:dog_id,dog_name',
                'service:service_id,service_name',
                'status:status_id,status_name',
            ])
            ->orderByDesc('appointment_date')
            ->limit(self::LIMIT)
            ->get()
            ->map(fn (Appointment $appointment): array => [
                'id' => $appointment->appointment_id,
                'label' => trim(($appointment->service?->service_name ?? 'Visit').' · '.($appointment->dog?->dog_name ?? '')),
                'meta' => collect([
                    $appointment->appointment_date?->toDateString(),
                    substr((string) $appointment->appointment_time, 0, 5),
                    $appointment->status?->status_name,
                ])->filter()->implode(' · '),
                'href' => route('owner.appointments.index'),
            ])
            ->all();
    }

    /**
     * What the clinic currently offers.
     *
     * @return list<array<string, mixed>>
     */
    private function services(string $like): array
    {
        return Service::query()
            ->where('is_active', true)
            ->where('service_name', 'like', $like)
            ->with('category:category_id,category_name')
            ->orderBy('service_name')
            ->limit(self::LIMIT)
            ->get()
            ->map(fn (Service $service): array => [
                'id' => $service->service_id,
                'label' => $service->service_name,
                'meta' => collect([
                    $service->category?->category_name,
                    $service->duration_minutes.' min',
                ])->filter()->implode(' · '),
                'href' => route('owner.services.index').'#service-'.$service->service_id,
            ])
            ->all();
    }
}
