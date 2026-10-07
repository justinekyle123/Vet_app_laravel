<?php

namespace App\Http\Controllers\Admin;

use App\Enums\StaffRole;
use App\Http\Controllers\Controller;
use App\Models\Dog;
use App\Models\DogBreed;
use App\Models\DogOwner;
use App\Models\Staff;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Read-only clinic figures, all derived from records that already exist.
 *
 * Money and appointment reporting join this page once scheduling and payments
 * ship; until then the page reports accounts, clients, and dogs so the numbers
 * on screen are always real.
 */
class ReportController extends Controller
{
    /** How many months of sign-up history the chart shows. */
    private const SIGNUP_MONTHS = 6;

    public function __invoke(): Response
    {
        return Inertia::render('Admin/Reports', [
            'accounts' => [
                'total' => Staff::count() + DogOwner::count(),
                'admins' => Staff::where('role', StaffRole::Admin)->count(),
                'owners' => DogOwner::count(),
            ],
            'clients' => [
                'total' => DogOwner::count(),
                'active' => DogOwner::where('is_active', true)->count(),
                'inactive' => DogOwner::where('is_active', false)->count(),
            ],
            'dogs' => [
                'total' => Dog::count(),
                'active' => Dog::where('is_active', true)->count(),
            ],
            'signups' => $this->signupsByMonth(),
            'breeds' => $this->dogsByBreed(),
        ]);
    }

    /**
     * New dog owner registrations for each of the last six months, oldest
     * first — including the months with none, so the chart keeps an even time
     * axis.
     *
     * @return list<array{label: string, count: int}>
     */
    private function signupsByMonth(): array
    {
        $start = Carbon::now()->startOfMonth()->subMonths(self::SIGNUP_MONTHS - 1);

        $counts = DogOwner::query()
            ->where('created_at', '>=', $start)
            ->get(['created_at'])
            ->countBy(fn (DogOwner $owner) => $owner->created_at->format('Y-m'));

        return collect(range(0, self::SIGNUP_MONTHS - 1))
            ->map(function (int $offset) use ($start, $counts): array {
                $month = $start->copy()->addMonths($offset);

                return [
                    'label' => $month->format('M'),
                    'count' => (int) $counts->get($month->format('Y-m'), 0),
                ];
            })
            ->all();
    }

    /**
     * Registered dogs grouped by breed, most common first. Dogs without a
     * breed on file are reported as "Unspecified" rather than dropped.
     *
     * @return list<array{label: string, count: int}>
     */
    private function dogsByBreed(): array
    {
        $names = DogBreed::query()->pluck('breed_name', 'breed_id');

        return Dog::query()
            ->selectRaw('breed_id, COUNT(*) as aggregate')
            ->groupBy('breed_id')
            ->orderByDesc('aggregate')
            ->get()
            ->map(fn (Dog $dog): array => [
                'label' => $dog->breed_id === null
                    ? 'Unspecified'
                    : (string) ($names[$dog->breed_id] ?? 'Unspecified'),
                'count' => (int) $dog->aggregate,
            ])
            ->all();
    }
}
