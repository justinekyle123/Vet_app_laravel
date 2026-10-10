<?php

namespace App\Services\Portal;

use App\Models\DogOwner;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

/**
 * The owner's notification feed for the portal navbar.
 *
 * The schema's `notifications` table records how a message was delivered
 * (channel, status, sent_at) but has no per-user "read" flag, so what the owner
 * has already seen is tracked per browser session. The bookmark is the newest
 * notification id the owner has seen rather than a timestamp: `created_at` is
 * written by the database, which can sit in a different time zone than PHP, so
 * comparing it against `now()` would let the badge stick forever.
 */
class PortalNotifications
{
    /** Session key holding the newest notification id the owner has seen. */
    public const SEEN_ID_SESSION_KEY = 'portal.notifications_seen_id';

    /** How many notifications the dropdown keeps in memory. */
    public const DROPDOWN_LIMIT = 8;

    /**
     * The owner's newest notifications, newest first.
     *
     * The id breaks ties because `created_at` is only second-precise, and rows
     * inserted in the same second would otherwise shuffle between requests.
     *
     * @return Collection<int, Notification>
     */
    public function latest(DogOwner $owner, int $limit = self::DROPDOWN_LIMIT): Collection
    {
        return Notification::query()
            ->where('owner_id', $owner->owner_id)
            ->orderByDesc('created_at')
            ->orderByDesc('notification_id')
            ->limit($limit)
            ->get();
    }

    /**
     * How many notifications have arrived since the owner last looked.
     *
     * Ids are monotonic, so anything newer than the bookmark is unseen. With no
     * bookmark a fresh session counts every message, which still shows the
     * badge.
     */
    public function unreadCount(DogOwner $owner): int
    {
        $seenId = (int) session(self::SEEN_ID_SESSION_KEY, 0);

        return Notification::query()
            ->where('owner_id', $owner->owner_id)
            ->where('notification_id', '>', $seenId)
            ->count();
    }

    /**
     * Mark everything the owner has as seen, by moving the session bookmark to
     * their newest notification id.
     */
    public function markAllRead(DogOwner $owner, Request $request): void
    {
        $latestId = (int) Notification::query()
            ->where('owner_id', $owner->owner_id)
            ->max('notification_id');

        $request->session()->put(self::SEEN_ID_SESSION_KEY, $latestId);
    }

    /**
     * The shape the portal navbar consumes.
     *
     * @return list<array<string, mixed>>
     */
    public function shared(DogOwner $owner, int $limit = self::DROPDOWN_LIMIT): array
    {
        return $this->latest($owner, $limit)
            ->map(fn (Notification $notification): array => [
                'id' => $notification->notification_id,
                'channel' => $notification->channel,
                'message' => $notification->message,
                'status' => $notification->status,
                'scheduled_at' => $notification->scheduled_at?->toIso8601String(),
                'sent_at' => $notification->sent_at?->toIso8601String(),
                'created_at' => $notification->created_at?->toIso8601String(),
            ])
            ->all();
    }
}
