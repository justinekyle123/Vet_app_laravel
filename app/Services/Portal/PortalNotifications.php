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
 * has already seen is tracked per browser session. That keeps the unread badge
 * honest without adding a column the database dump does not define — the same
 * trade-off the schema forces on the rest of the portal.
 */
class PortalNotifications
{
    /** Session key holding when the owner last opened the bell. */
    public const SEEN_AT_SESSION_KEY = 'portal.notifications_seen_at';

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
     * With no recorded visit every message counts as unseen, so a fresh
     * session still shows the badge.
     */
    public function unreadCount(DogOwner $owner): int
    {
        $seenAt = session(self::SEEN_AT_SESSION_KEY);

        return Notification::query()
            ->where('owner_id', $owner->owner_id)
            ->when($seenAt !== null, fn ($query) => $query->where('created_at', '>', $seenAt))
            ->count();
    }

    /**
     * Mark everything the owner has as seen, by moving the session bookmark.
     */
    public function markAllRead(Request $request): void
    {
        $request->session()->put(self::SEEN_AT_SESSION_KEY, now());
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
