<?php

namespace App\Services\Complaints;

use App\Models\Complaint;
use App\Models\ComplaintMessage;
use App\Models\DogOwner;
use App\Models\Staff;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

/**
 * Complaint threads, read and written by both sides of the conversation.
 *
 * The portal and the staff console work from the same rows, so the two must
 * agree on what a thread looks like; keeping the shaping here means a client
 * and the person answering them never see a different story.
 *
 * Every owner-facing read is scoped to the signed-in client, so one client's
 * complaints are invisible to another rather than merely forbidden.
 */
class ComplaintThreads
{
    /** The columns every thread needs from the person who raised it. */
    private const RELATIONS = [
        'owner:owner_id,first_name,last_name',
        'appointment:appointment_id,appointment_date,service_id',
    ];

    /**
     * The client's own threads, most recently active first.
     *
     * @return list<array<string, mixed>>
     */
    public function forOwner(DogOwner $owner, int $limit = 25): array
    {
        return Complaint::query()
            ->where('owner_id', $owner->owner_id)
            ->with([...self::RELATIONS, 'messages.staff:staff_id,first_name,last_name'])
            ->withCount('messages')
            ->orderByDesc('updated_at')
            ->limit($limit)
            ->get()
            ->map(fn (Complaint $complaint) => $this->present($complaint, asOwner: true))
            ->all();
    }

    /**
     * One of the client's own threads, or nothing at all.
     *
     * A complaint belonging to another client is treated as missing rather
     * than forbidden, so the portal never confirms that it exists.
     */
    public function findForOwner(DogOwner $owner, Complaint $complaint): Complaint
    {
        abort_unless($complaint->owner_id === $owner->owner_id, 404);

        return $this->loadThread($complaint);
    }

    /**
     * The console's inbox, filtered and paginated.
     *
     * @param  array{status?: string, priority?: string, search?: string}  $filters
     * @return \Illuminate\Contracts\Pagination\LengthAwarePaginator<int, array<string, mixed>>
     */
    public function inbox(array $filters = [], int $perPage = 10)
    {
        $status = $filters['status'] ?? 'all';
        $priority = $filters['priority'] ?? 'all';
        $search = trim((string) ($filters['search'] ?? ''));

        return Complaint::query()
            ->with(self::RELATIONS)
            ->withCount('messages')
            ->when(
                $status === 'settled',
                fn (Builder $query) => $query->whereIn('status', Complaint::SETTLED),
            )
            ->when(
                $status === 'waiting',
                // Still waiting on the clinic: not settled.
                fn (Builder $query) => $query->whereNotIn('status', Complaint::SETTLED),
            )
            ->when(
                in_array($priority, ['Low', 'Medium', 'High'], true),
                fn (Builder $query) => $query->where('priority', $priority),
            )
            ->when($search !== '', fn (Builder $query) => $query->where(
                fn (Builder $matches) => $matches
                    ->where('subject', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('owner', fn (Builder $owners) => $owners
                        ->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")),
            ))
            // Unsettled work first, then the longest-waiting of those.
            ->orderByRaw("CASE WHEN status IN ('Resolved', 'Closed') THEN 1 ELSE 0 END")
            ->orderByDesc('updated_at')
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (Complaint $complaint) => $this->presentSummary($complaint));
    }

    /**
     * How many complaints sit in each state, for the inbox header.
     *
     * @return array{waiting: int, open: int, in_progress: int, settled: int, total: int}
     */
    public function counts(): array
    {
        return [
            'waiting' => Complaint::query()->whereNotIn('status', Complaint::SETTLED)->count(),
            'open' => Complaint::query()->where('status', 'Open')->count(),
            'in_progress' => Complaint::query()->where('status', 'In Progress')->count(),
            'settled' => Complaint::query()->whereIn('status', Complaint::SETTLED)->count(),
            'total' => Complaint::query()->count(),
        ];
    }

    /**
     * Open a complaint and write its first message.
     *
     * @param  array{subject: string, description: string, priority?: string, appointment_id?: int|null}  $data
     */
    public function open(DogOwner $owner, array $data): Complaint
    {
        $complaint = $owner->complaints()->create([
            'appointment_id' => $data['appointment_id'] ?? null,
            'subject' => $data['subject'],
            'description' => $data['description'],
            'priority' => $data['priority'] ?? 'Medium',
            'status' => 'Open',
        ]);

        $complaint->messages()->create([
            'owner_id' => $owner->owner_id,
            'body' => $data['description'],
        ]);

        return $complaint;
    }

    /**
     * Add a message to a thread from whichever side is writing.
     */
    public function replyFromOwner(DogOwner $owner, Complaint $complaint, string $body): ComplaintMessage
    {
        $message = $complaint->messages()->create([
            'owner_id' => $owner->owner_id,
            'body' => $body,
        ]);

        // A client adding to a settled complaint reopens it: someone has to
        // answer them, and the thread should not sit in a closed pile.
        if ($complaint->isSettled()) {
            $complaint->update([
                'status' => 'In Progress',
                'resolved_at' => null,
            ]);
        } else {
            $complaint->touch();
        }

        return $message;
    }

    public function replyFromStaff(Staff $staff, Complaint $complaint, string $body): ComplaintMessage
    {
        $message = $complaint->messages()->create([
            'staff_id' => $staff->staff_id,
            'body' => $body,
        ]);

        $attributes = ['updated_at' => now()];

        // An unanswered complaint moves to "In Progress" the moment someone
        // picks it up, so the inbox shows who is actually waiting.
        if ($complaint->status === 'Open') {
            $attributes['status'] = 'In Progress';
        }

        if ($complaint->assigned_to === null) {
            $attributes['assigned_to'] = $staff->staff_id;
        }

        $complaint->forceFill($attributes)->save();

        return $message;
    }

    /**
     * One thread with its whole conversation, ready to render.
     *
     * @return array<string, mixed>
     */
    public function present(Complaint $complaint, bool $asOwner = true): array
    {
        $this->loadThread($complaint);

        return [
            ...$this->presentSummary($complaint),
            'description' => $complaint->description,
            'resolution_notes' => $complaint->resolution_notes,
            'assigned_to' => $complaint->assignee?->fullName(),
            'messages' => $complaint->messages
                ->map(fn (ComplaintMessage $message) => [
                    'id' => $message->message_id,
                    'body' => $message->body,
                    'from_owner' => $message->isFromOwner(),
                    // The reader's own side sits on the right of the thread.
                    'mine' => $asOwner ? $message->isFromOwner() : ! $message->isFromOwner(),
                    'author' => $message->isFromOwner()
                        ? $complaint->owner?->fullName()
                        : $message->staff?->fullName(),
                    'at' => $message->created_at?->toIso8601String(),
                ])
                ->values()
                ->all(),
        ];
    }

    /**
     * The row a list shows: what it is about, how urgent, and where it stands.
     *
     * @return array<string, mixed>
     */
    public function presentSummary(Complaint $complaint): array
    {
        return [
            'id' => $complaint->complaint_id,
            'subject' => $complaint->subject,
            'status' => $complaint->status,
            'priority' => $complaint->priority,
            'settled' => $complaint->isSettled(),
            'opened_at' => $complaint->created_at?->toIso8601String(),
            'updated_at' => $complaint->updated_at?->toIso8601String(),
            'messages_count' => $complaint->messages_count ?? $complaint->messages()->count(),
            'client' => $complaint->owner?->fullName(),
            'client_id' => $complaint->owner_id,
            'appointment_id' => $complaint->appointment_id,
            'visit_on' => $complaint->appointment?->appointment_date?->toDateString(),
        ];
    }

    private function loadThread(Complaint $complaint): Complaint
    {
        return $complaint->loadMissing([
            ...self::RELATIONS,
            'assignee:staff_id,first_name,last_name',
            'messages.staff:staff_id,first_name,last_name',
        ]);
    }

    /**
     * The visits a client can point a complaint at: their own, most recent
     * first. Restricted to the signed-in owner for the same reason as above.
     *
     * @return Collection<int, \App\Models\Appointment>
     */
    public function linkableVisits(DogOwner $owner, int $limit = 10): Collection
    {
        return $owner->appointments()
            ->with('service:service_id,service_name')
            ->orderByDesc('appointment_date')
            ->limit($limit)
            ->get(['appointment_id', 'service_id', 'appointment_date', 'owner_id']);
    }
}
