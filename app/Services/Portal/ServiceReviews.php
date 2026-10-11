<?php

namespace App\Services\Portal;

use App\Models\Appointment;
use App\Models\DogOwner;
use App\Models\RatingFeedback;
use App\Models\Service;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

/**
 * The clinic's reviews, as the portal shows them.
 *
 * A review is written against the visit it came from, so a service's reviews
 * are the published feedback on every appointment booked for that service.
 * Aggregates are computed here rather than per card so the menu loads its
 * ratings in one pass.
 *
 * Only published feedback counts: an unpublished draft must not move a
 * service's average or its review count.
 */
class ServiceReviews
{
    /** How many published comments a service card previews. */
    private const PREVIEW = 3;

    /** How many reviews the detail page lists at a time. */
    public const PAGE_SIZE = 5;

    /** The most reviews the detail page will list in one go. */
    private const PAGE_LIMIT = 50;

    /**
     * Ratings and recent comments for every service that has any.
     *
     * @return array<int, array{rating: float|null, count: int, reviews: list<array<string, mixed>>}>
     */
    public function forServices(): array
    {
        $published = RatingFeedback::query()
            ->where('is_published', true)
            ->with([
                'appointment:appointment_id,service_id,appointment_date',
                'owner:owner_id,first_name,last_name',
            ])
            ->orderByDesc('created_at')
            ->orderByDesc('feedback_id')
            ->get();

        $buckets = [];

        foreach ($published as $review) {
            $serviceId = $review->appointment?->service_id;

            if ($serviceId === null) {
                continue;
            }

            $buckets[$serviceId] ??= ['sum' => 0, 'count' => 0, 'reviews' => []];

            $buckets[$serviceId]['sum'] += $review->rating;
            $buckets[$serviceId]['count']++;

            // The query is newest first, so the first few kept are the ones a
            // card previews.
            if (count($buckets[$serviceId]['reviews']) < self::PREVIEW) {
                $buckets[$serviceId]['reviews'][] = $this->present($review);
            }
        }

        return collect($buckets)
            ->map(fn (array $bucket): array => [
                'rating' => round($bucket['sum'] / $bucket['count'], 1),
                'count' => $bucket['count'],
                'reviews' => $bucket['reviews'],
            ])
            ->all();
    }

    /**
     * One service's rating in full: its average, how many clients gave each
     * score, and the share of them who were happy with it.
     *
     * The spread is what makes an average honest — a 4.5 from two reviews and a
     * 4.5 from fifty read very differently, and the bars say which one it is.
     *
     * @return array{rating: float|null, count: int, distribution: array<int, int>, satisfied: int|null}
     */
    public function summaryFor(Service $service): array
    {
        $ratings = $this->publishedFor($service)->pluck('rating');

        $distribution = [5 => 0, 4 => 0, 3 => 0, 2 => 0, 1 => 0];

        foreach ($ratings as $rating) {
            $score = (int) $rating;

            if (array_key_exists($score, $distribution)) {
                $distribution[$score]++;
            }
        }

        $count = $ratings->count();

        return [
            'rating' => $count === 0 ? null : round((float) $ratings->avg(), 1),
            'count' => $count,
            'distribution' => $distribution,
            // The "would recommend" figure clients expect on a service page:
            // four stars and up, as a percentage of everyone who rated it.
            'satisfied' => $count === 0
                ? null
                : (int) round((($distribution[5] + $distribution[4]) / $count) * 100),
        ];
    }

    /**
     * Every published review of one service, newest first, paged.
     *
     * @return LengthAwarePaginator<int, array<string, mixed>>
     */
    public function paginatorFor(Service $service, int $perPage = self::PAGE_SIZE): LengthAwarePaginator
    {
        $perPage = max(self::PAGE_SIZE, min($perPage, self::PAGE_LIMIT));

        return $this->publishedFor($service)
            ->paginate($perPage, ['*'], 'reviews_page')
            ->through(fn (RatingFeedback $review): array => $this->present($review));
    }

    /**
     * The published reviews of one service, newest first. Only published
     * feedback counts: a draft the clinic has pulled must not move a service's
     * average, its count, or the list behind them.
     *
     * @return \Illuminate\Database\Eloquent\Builder<RatingFeedback>
     */
    private function publishedFor(Service $service): Builder
    {
        return RatingFeedback::query()
            ->where('is_published', true)
            ->whereHas(
                'appointment',
                fn (Builder $query) => $query->where('service_id', $service->service_id),
            )
            ->with([
                'appointment:appointment_id,service_id,appointment_date',
                'owner:owner_id,first_name,last_name',
            ])
            ->orderByDesc('created_at')
            ->orderByDesc('feedback_id');
    }

    /**
     * Record an owner's rating for one of their own completed visits.
     */
    public function record(
        DogOwner $owner,
        Appointment $appointment,
        int $rating,
        ?string $comment,
    ): RatingFeedback {
        return RatingFeedback::create([
            'appointment_id' => $appointment->appointment_id,
            'owner_id' => $owner->owner_id,
            // The provider who saw the dog is the one being rated, where the
            // desk had assigned one.
            'staff_id' => $appointment->staff_id,
            'rating' => $rating,
            'comment' => $comment,
            // Reviews are shown as clients write them; the clinic can take one
            // down later.
            'is_published' => true,
        ]);
    }

    /**
     * One review as the menu renders it. The client is shown by first name and
     * initial, which is enough to make a review feel human without publishing
     * a full name. The visit date is kept so a reader can see the review came
     * from a real appointment rather than a drive-by score.
     *
     * @return array<string, mixed>
     */
    private function present(RatingFeedback $review): array
    {
        return [
            'id' => $review->feedback_id,
            'rating' => $review->rating,
            'comment' => $review->comment,
            'client' => $this->clientName($review->owner),
            'date' => $review->created_at?->toDateString(),
            'visited_on' => $review->appointment?->appointment_date?->toDateString(),
        ];
    }

    private function clientName(?DogOwner $owner): ?string
    {
        if ($owner === null) {
            return null;
        }

        $initial = $owner->last_name !== null && $owner->last_name !== ''
            ? ' '.strtoupper(substr($owner->last_name, 0, 1)).'.'
            : '';

        return trim($owner->first_name.$initial);
    }
}
