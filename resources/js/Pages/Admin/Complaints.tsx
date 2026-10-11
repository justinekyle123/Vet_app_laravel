import { rowButtonClass } from '@/Components/buttonStyles';
import Icon from '@/Components/Icon';
import Pagination from '@/Components/Pagination';
import Panel, { EmptyState } from '@/Components/Panel';
import StaffLayout from '@/Layouts/StaffLayout';
import { ComplaintPriority, Paginated } from '@/types';
import { longDate } from '@/utils/format';
import { Link, router } from '@inertiajs/react';
import { MessageSquare, TriangleAlert } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

/** One row of the inbox: a complaint and where it stands. */
interface ComplaintRow {
    id: number;
    subject: string;
    status: string;
    priority: ComplaintPriority;
    settled: boolean;
    opened_at: string | null;
    updated_at: string | null;
    messages_count: number;
    client: string | null;
    client_id: number | null;
    appointment_id: number | null;
    visit_on: string | null;
}

const statusTabs = [
    { value: 'all', label: 'All' },
    { value: 'waiting', label: 'Waiting' },
    { value: 'settled', label: 'Settled' },
] as const;

const priorityTabs = [
    { value: 'all', label: 'Any urgency' },
    { value: 'High', label: 'High' },
    { value: 'Medium', label: 'Medium' },
    { value: 'Low', label: 'Low' },
] as const;

/** Status marker, toned the way the rest of the console marks state. */
function statusTone(status: string): string {
    switch (status) {
        case 'Resolved':
        case 'Closed':
            return 'bg-[#2a5a2a]/10 text-[#2a5a2a]';
        case 'In Progress':
            return 'bg-[#E86A10]/10 text-[#E86A10]';
        default:
            return 'bg-[#1a3d1a]/10 text-[#1a3d1a]/70';
    }
}

/** Urgency marker. High is the one that should catch an eye. */
function priorityTone(priority: ComplaintPriority): string {
    switch (priority) {
        case 'High':
            return 'bg-[#b3261e]/10 text-[#b3261e]';
        case 'Medium':
            return 'bg-[#E86A10]/10 text-[#E86A10]';
        default:
            return 'bg-[#1a3d1a]/10 text-[#1a3d1a]/60';
    }
}

export default function Complaints({
    complaints,
    filters,
    counts,
}: {
    complaints: Paginated<ComplaintRow>;
    filters: { status: string; priority: string; search: string };
    counts: {
        waiting: number;
        open: number;
        in_progress: number;
        settled: number;
        total: number;
    };
}) {
    const [search, setSearch] = useState(filters.search);

    const applyFilters = (overrides: Partial<typeof filters> = {}) => {
        const next = { ...filters, search, ...overrides };
        const query: Record<string, string> = {};

        if (next.status !== 'all') {
            query.status = next.status;
        }

        if (next.priority !== 'all') {
            query.priority = next.priority;
        }

        if (next.search.trim() !== '') {
            query.search = next.search.trim();
        }

        router.get(route('admin.complaints.index'), query, {
            preserveState: true,
            replace: true,
        });
    };

    const submitSearch: FormEventHandler = (event) => {
        event.preventDefault();
        applyFilters();
    };

    return (
        <StaffLayout
            title="Complaints"
            heading="Complaints"
            description="What clients have raised through the portal. Every complaint is a conversation — reply to it and it settles from there."
        >
            <Panel
                title="Complaint inbox"
                icon="question"
                flush
                action={
                    <span className="text-xs font-medium text-[#1a3d1a]/45">
                        {counts.waiting} waiting on the clinic
                    </span>
                }
            >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1a3d1a]/10 px-5 py-4">
                    <form
                        onSubmit={submitSearch}
                        className="relative flex items-center gap-2"
                    >
                        <Icon
                            name="search"
                            className="pointer-events-none absolute left-3.5 h-4 w-4 text-[#1a3d1a]/35"
                        />
                        <label htmlFor="complaint-search" className="sr-only">
                            Search complaints
                        </label>
                        <input
                            id="complaint-search"
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search subject, client, or text…"
                            className="w-full rounded-full border border-[#1a3d1a]/15 bg-white py-2.5 pl-10 pr-4 text-sm text-[#1a3d1a] shadow-sm transition-[border-color,box-shadow] duration-200 placeholder:text-[#1a3d1a]/35 focus:border-[#1a3d1a] focus:outline-none focus:ring-4 focus:ring-[#1a3d1a]/15 sm:w-72"
                        />
                    </form>

                    <div className="flex flex-wrap items-center gap-3">
                        <label
                            htmlFor="complaint-priority-filter"
                            className="sr-only"
                        >
                            Filter by urgency
                        </label>
                        <select
                            id="complaint-priority-filter"
                            value={filters.priority}
                            onChange={(event) =>
                                applyFilters({ priority: event.target.value })
                            }
                            className="rounded-full border border-[#1a3d1a]/15 bg-white py-2 pl-3.5 pr-8 text-xs font-semibold text-[#1a3d1a] shadow-sm focus:border-[#1a3d1a] focus:outline-none focus:ring-4 focus:ring-[#1a3d1a]/15"
                        >
                            {priorityTabs.map((tab) => (
                                <option key={tab.value} value={tab.value}>
                                    {tab.label}
                                </option>
                            ))}
                        </select>

                        <div
                            role="group"
                            aria-label="Filter complaints"
                            className="flex items-center gap-1 rounded-full bg-[#1a3d1a]/5 p-1"
                        >
                            {statusTabs.map((tab) => (
                                <button
                                    key={tab.value}
                                    type="button"
                                    aria-pressed={filters.status === tab.value}
                                    onClick={() =>
                                        applyFilters({ status: tab.value })
                                    }
                                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a] ${
                                        filters.status === tab.value
                                            ? 'bg-white text-[#1a3d1a] shadow-sm'
                                            : 'text-[#1a3d1a]/55 hover:text-[#1a3d1a]'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {complaints.data.length === 0 ? (
                    <div className="p-5">
                        <EmptyState
                            icon="question"
                            message={
                                counts.total === 0
                                    ? 'No complaints on record. Clients can raise one from the help button in their portal.'
                                    : 'Nothing matches this view. Try another status, urgency, or search term.'
                            }
                        />
                    </div>
                ) : (
                    <ul className="divide-y divide-[#1a3d1a]/10">
                        {complaints.data.map((complaint) => (
                            <li
                                key={complaint.id}
                                className="flex flex-col gap-3 px-5 py-4 transition-colors duration-150 hover:bg-[#EFFDF0]/60 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2.5">
                                        <p className="text-sm font-semibold text-[#1a3d1a]">
                                            {complaint.subject}
                                        </p>
                                        <span
                                            className={`rounded-full px-2.5 py-1 text-[0.68rem] font-semibold ${statusTone(
                                                complaint.status,
                                            )}`}
                                        >
                                            {complaint.status}
                                        </span>
                                        <span
                                            className={`rounded-full px-2.5 py-1 text-[0.68rem] font-semibold ${priorityTone(
                                                complaint.priority,
                                            )}`}
                                        >
                                            {complaint.priority}
                                        </span>
                                    </div>

                                    <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#1a3d1a]/60">
                                        <span className="font-semibold text-[#1a3d1a]/70">
                                            {complaint.client ?? 'Client'}
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <MessageSquare className="h-3.5 w-3.5 text-[#1a3d1a]/40" />
                                            {complaint.messages_count}{' '}
                                            {complaint.messages_count === 1
                                                ? 'message'
                                                : 'messages'}
                                        </span>
                                        {complaint.visit_on && (
                                            <span className="inline-flex items-center gap-1">
                                                <TriangleAlert className="h-3.5 w-3.5 text-[#1a3d1a]/40" />
                                                About the visit on{' '}
                                                {longDate(complaint.visit_on)}
                                            </span>
                                        )}
                                        {complaint.updated_at && (
                                            <span>
                                                Last activity{' '}
                                                {longDate(complaint.updated_at)}
                                            </span>
                                        )}
                                    </p>
                                </div>

                                <div className="flex shrink-0 items-center gap-2">
                                    <Link
                                        href={route(
                                            'admin.complaints.show',
                                            complaint.id,
                                        )}
                                        className={rowButtonClass}
                                    >
                                        Open
                                    </Link>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                <Pagination page={complaints} />
            </Panel>
        </StaffLayout>
    );
}
