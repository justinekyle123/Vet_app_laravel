<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ReplyToComplaintRequest;
use App\Http\Requests\Admin\UpdateComplaintRequest;
use App\Models\Complaint;
use App\Models\Staff;
use App\Services\Complaints\ComplaintThreads;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The clinic's complaints inbox: what clients have raised, and the conversation
 * that settles it.
 *
 * Complaints are answered rather than edited, so the conversation is the record
 * and the status, priority, and resolution notes are what the desk works from.
 */
class ComplaintController extends Controller
{
    private const FILTERS = ['all', 'waiting', 'settled'];

    public function index(Request $request, ComplaintThreads $threads): Response
    {
        $filters = [
            'status' => (string) $request->query('status', 'all'),
            'priority' => (string) $request->query('priority', 'all'),
            'search' => trim((string) $request->query('search', '')),
        ];

        if (! in_array($filters['status'], self::FILTERS, true)) {
            $filters['status'] = 'all';
        }

        if (! in_array($filters['priority'], ['all', 'High', 'Medium', 'Low'], true)) {
            $filters['priority'] = 'all';
        }

        return Inertia::render('Admin/Complaints', [
            'complaints' => $threads->inbox($filters),
            'filters' => $filters,
            'counts' => $threads->counts(),
        ]);
    }

    public function show(Complaint $complaint, ComplaintThreads $threads): Response
    {
        $complaint->load(['owner:owner_id,first_name,last_name,email,phone_number']);

        return Inertia::render('Admin/ComplaintShow', [
            // Staff read the thread from the clinic's side, so the replies sit
            // on the right and the client's messages on the left.
            'complaint' => $threads->present($complaint, asOwner: false),
            'client' => [
                'name' => $complaint->owner?->fullName(),
                'email' => $complaint->owner?->email,
                'phone' => $complaint->owner?->phone_number,
            ],
            'statusOptions' => ['Open', 'In Progress', 'Resolved', 'Closed'],
            'priorityOptions' => ['Low', 'Medium', 'High'],
        ]);
    }

    /**
     * Answer the client. The first reply also claims the complaint and moves it
     * to "In Progress", so the inbox shows what is still waiting on a person.
     */
    public function reply(
        ReplyToComplaintRequest $request,
        Complaint $complaint,
        ComplaintThreads $threads,
    ): RedirectResponse {
        /** @var Staff $staff */
        $staff = $request->user();

        $threads->replyFromStaff($staff, $complaint, trim((string) $request->validated('body')));

        return redirect()
            ->route('admin.complaints.show', $complaint)
            ->with('status', 'complaint-replied');
    }

    /**
     * Triage and resolution: where the complaint stands, how urgent it is, and
     * what was done about it.
     */
    public function update(UpdateComplaintRequest $request, Complaint $complaint): RedirectResponse
    {
        /** @var Staff $staff */
        $staff = $request->user();
        $data = $request->validated();

        $attributes = [];

        if (array_key_exists('status', $data)) {
            $attributes['status'] = $data['status'];
            // A settled complaint records when it was settled; reopening one
            // clears the stamp again.
            $attributes['resolved_at'] = in_array($data['status'], Complaint::SETTLED, true)
                ? ($complaint->resolved_at ?? now())
                : null;
        }

        if (array_key_exists('priority', $data)) {
            $attributes['priority'] = $data['priority'];
        }

        if (array_key_exists('resolution_notes', $data)) {
            $attributes['resolution_notes'] = $data['resolution_notes'];
        }

        if (($data['assign_to_me'] ?? false) === true) {
            $attributes['assigned_to'] = $staff->staff_id;
        }

        if ($attributes !== []) {
            $complaint->update($attributes);
        }

        return redirect()
            ->route('admin.complaints.show', $complaint)
            ->with('status', 'complaint-updated');
    }
}
