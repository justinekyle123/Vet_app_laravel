<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Http\Requests\Owner\StoreComplaintMessageRequest;
use App\Http\Requests\Owner\StoreComplaintRequest;
use App\Models\Complaint;
use App\Models\DogOwner;
use App\Services\Complaints\ComplaintThreads;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The client's side of the help panel's complaint threads.
 *
 * These endpoints answer JSON rather than Inertia pages: the panel is a chat
 * that stays open while messages are sent, so a full page visit mid-sentence
 * would be the wrong shape for it.
 */
class ComplaintController extends Controller
{
    /**
     * The client's own threads, plus the visits they can point one at.
     */
    public function index(Request $request, ComplaintThreads $threads): JsonResponse
    {
        /** @var DogOwner $owner */
        $owner = $request->user();

        return response()->json([
            'threads' => $threads->forOwner($owner),
            'visits' => $threads->linkableVisits($owner)
                ->map(fn ($visit): array => [
                    'id' => $visit->appointment_id,
                    // Enough for the client to recognise the visit without
                    // loading the appointments page.
                    'label' => trim(sprintf(
                        '%s · %s',
                        $visit->service?->service_name ?? 'Visit',
                        $visit->appointment_date?->format('M j, Y') ?? '',
                    ), ' ·'),
                ])
                ->all(),
        ]);
    }

    /**
     * Raise a new complaint.
     */
    public function store(StoreComplaintRequest $request, ComplaintThreads $threads): JsonResponse
    {
        /** @var DogOwner $owner */
        $owner = $request->user();
        $data = $request->validated();

        $appointmentId = $data['appointment_id'] ?? null;

        if ($appointmentId !== null) {
            // A complaint may only be filed about the client's own visit.
            abort_unless(
                $owner->appointments()->whereKey($appointmentId)->exists(),
                403,
            );
        }

        $complaint = $threads->open($owner, $data);

        return response()->json([
            'thread' => $threads->present($complaint, asOwner: true),
        ], 201);
    }

    /**
     * Add a message to one of the client's own threads.
     */
    public function reply(
        StoreComplaintMessageRequest $request,
        Complaint $complaint,
        ComplaintThreads $threads,
    ): JsonResponse {
        /** @var DogOwner $owner */
        $owner = $request->user();

        // Another client's thread is missing, not forbidden.
        $threads->findForOwner($owner, $complaint);
        $threads->replyFromOwner($owner, $complaint, trim((string) $request->validated('body')));

        return response()->json([
            'thread' => $threads->present($complaint->fresh(), asOwner: true),
        ]);
    }
}
