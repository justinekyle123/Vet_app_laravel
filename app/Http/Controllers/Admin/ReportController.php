<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Owner;
use App\Models\Pet;
use App\Models\User;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Read-only clinic figures, all derived from records that already exist.
 *
 * Money and appointment reporting join this page once invoicing and scheduling
 * ship; until then the page reports accounts, clients, and pets so the numbers
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
                'total' => User::count(),
                'admins' => User::where('role', UserRole::Admin->value)->count(),
                'front_desk' => User::where('role', UserRole::FrontDesk->value)->count(),
                'owners' => User::where('role', UserRole::Owner->value)->count(),
                'unverified' => User::whereNull('email_verified_at')->count(),
            ],
            'clients' => [
                'total' => Owner::count(),
                'active' => Owner::where('is_active', true)->count(),
                'inactive' => Owner::where('is_active', false)->count(),
                'with_portal' => Owner::whereNotNull('user_id')->count(),
            ],
            'pets' => [
                'total' => Pet::count(),
                'active' => Pet::where('is_active', true)->count(),
            ],
            'signups' => $this->signupsByMonth(),
            'species' => $this->petsBySpecies(),
        ]);
    }

    /**
     * New accounts for each of the last six months, oldest first — including
     * the months with no sign-ups, so the chart keeps an even time axis.
     *
     * @return list<array{label: string, count: int}>
     */
    private function signupsByMonth(): array
    {
        $start = Carbon::now()->startOfMonth()->subMonths(self::SIGNUP_MONTHS - 1);

        $counts = User::query()
            ->where('created_at', '>=', $start)
            ->get(['created_at'])
            ->countBy(fn (User $user) => $user->created_at->format('Y-m'));

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
     * Registered pets grouped by species, most common first.
     *
     * @return list<array{label: string, count: int}>
     */
    private function petsBySpecies(): array
    {
        return Pet::query()
            ->selectRaw('species, COUNT(*) as aggregate')
            ->groupBy('species')
            ->orderByDesc('aggregate')
            ->get()
            ->map(fn (Pet $pet): array => [
                'label' => ucfirst((string) $pet->species),
                'count' => (int) $pet->aggregate,
            ])
            ->all();
    }
}
