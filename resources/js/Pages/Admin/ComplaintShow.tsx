import Panel from '@/Components/Panel';
import {
    primaryButtonClass,
    secondaryButtonClass,
} from '@/Components/buttonStyles';
import { fieldClass, labelClass } from '@/Components/formStyles';
import Icon from '@/Components/Icon';
import StatusPill from '@/Components/StatusPill';
import StaffLayout from '@/Layouts/StaffLayout';
import { ComplaintPriority, PortalComplaintThread } from '@/types';
import { dateTime, longDate } from '@/utils/format';
import { Link, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect, useRef } from 'react';

/**
 * One complaint, as the clinic works it: the whole conversation, a box to
 * answer in, and the triage controls that say where it stands.
 *
 * Replying is what moves a complaint forward, so the thread is the page's
 * centre of gravity and the controls sit beside it rather than above it.
 */
export default function ComplaintShow({
    complaint,
    client,
    statusOptions,
    priorityOptions,
}: {
    complaint: PortalComplaintThread;
    client: { name: string | null; email: string | null; phone: string | null };
    statusOptions: string[];
    priorityOptions: ComplaintPriority[];
}) {
    const replyForm = useForm({ body: '' });

    const triageForm = useForm({
        status: complaint.status,
        priority: complaint.priority,
        resolution_notes: complaint.resolution_notes ?? '',
        assign_to_me: false,
    });

    const threadEndRef = useRef<HTMLLIElement>(null);

    useEffect(() => {
        threadEndRef.current?.scrollIntoView({ block: 'nearest' });
    }, [complaint.messages.length]);

    const sendReply: FormEventHandler = (event) => {
        event.preventDefault();

        replyForm.post(route('admin.complaints.reply', complaint.id), {
            preserveScroll: true,
            onSuccess: () => replyForm.reset(),
        });
    };

    const saveTriage: FormEventHandler = (event) => {
        event.preventDefault();

        triageForm.patch(route('admin.complaints.update', complaint.id), {
            preserveScroll: true,
        });
    };

    /* A one-click claim, so the desk can say who is on it without a picker. */
    const assignToMe = () => {
        router.patch(
            route('admin.complaints.update', complaint.id),
            { assign_to_me: true },
            { preserveScroll: true },
        );
    };

    return (
        <StaffLayout
            title={complaint.subject}
            heading={complaint.subject}
            description={`Raised by ${client.name ?? 'a client'}${
                complaint.opened_at
                    ? ` on ${dateTime(complaint.opened_at)}`
                    : ''
            }.`}
            actions={
                <Link
                    href={route('admin.complaints.index')}
                    className={secondaryButtonClass}
                >
                    <Icon name="arrowRight" className="h-4 w-4 rotate-180" />
                    Back to complaints
                </Link>
            }
        >
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <Panel
                        title="Conversation"
                        icon="question"
                        action={
                            <span className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-[#1a3d1a]/10 px-2.5 py-1 text-[0.68rem] font-semibold text-[#1a3d1a]/70">
                                    {complaint.status}
                                </span>
                                <span className="rounded-full bg-[#E86A10]/10 px-2.5 py-1 text-[0.68rem] font-semibold text-[#E86A10]">
                                    {complaint.priority}
                                </span>
                            </span>
                        }
                    >
                        <ul className="space-y-3">
                            {complaint.messages.map((message) => (
                                <li
                                    key={message.id}
                                    className={`flex ${
                                        message.mine
                                            ? 'justify-end'
                                            : 'justify-start'
                                    }`}
                                >
                                    <div
                                        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                                            message.mine
                                                ? 'bg-[#1a3d1a] text-white'
                                                : 'bg-[#EFFDF0] text-[#1a3d1a]'
                                        }`}
                                    >
                                        <p className="text-sm leading-relaxed whitespace-pre-line">
                                            {message.body}
                                        </p>
                                        <p
                                            className={`mt-1.5 text-[0.62rem] ${
                                                message.mine
                                                    ? 'text-white/50'
                                                    : 'text-[#1a3d1a]/45'
                                            }`}
                                        >
                                            {message.author ?? 'Someone'}
                                            {message.at
                                                ? ` · ${dateTime(message.at)}`
                                                : ''}
                                        </p>
                                    </div>
                                </li>
                            ))}
                            <li ref={threadEndRef} aria-hidden="true" />
                        </ul>

                        <form
                            onSubmit={sendReply}
                            className="mt-6 border-t border-[#1a3d1a]/10 pt-5"
                        >
                            <label htmlFor="reply-body" className={labelClass}>
                                Reply to {client.name ?? 'the client'}
                            </label>
                            <textarea
                                id="reply-body"
                                rows={4}
                                value={replyForm.data.body}
                                onChange={(event) =>
                                    replyForm.setData(
                                        'body',
                                        event.target.value,
                                    )
                                }
                                maxLength={2000}
                                placeholder="What the clinic is doing about it…"
                                className={`${fieldClass} resize-none`}
                            />
                            {replyForm.errors.body && (
                                <p className="mt-2 text-sm text-[#b3261e]">
                                    {replyForm.errors.body}
                                </p>
                            )}

                            <div className="mt-3 flex flex-wrap items-center gap-3">
                                <button
                                    type="submit"
                                    disabled={replyForm.processing}
                                    className={primaryButtonClass}
                                >
                                    <Icon name="check" className="h-4 w-4" />
                                    Send reply
                                </button>
                                <p className="text-xs text-[#1a3d1a]/45">
                                    Replying moves this to In Progress and
                                    notes who handled it.
                                </p>
                            </div>
                        </form>
                    </Panel>
                </div>

                <div className="space-y-6">
                    <Panel title="Client" icon="user">
                        <p className="text-sm font-semibold text-[#1a3d1a]">
                            {client.name ?? 'Client'}
                        </p>
                        {client.email && (
                            <p className="mt-1 flex items-center gap-2 text-xs text-[#1a3d1a]/60">
                                <Icon name="mail" className="h-3.5 w-3.5" />
                                {client.email}
                            </p>
                        )}
                        {client.phone && (
                            <p className="mt-1 text-xs text-[#1a3d1a]/60">
                                {client.phone}
                            </p>
                        )}

                        {complaint.appointment_id && (
                            <p className="mt-3 border-t border-[#1a3d1a]/10 pt-3 text-xs leading-relaxed text-[#1a3d1a]/60">
                                About the visit on{' '}
                                <span className="font-semibold text-[#1a3d1a]">
                                    {longDate(complaint.visit_on)}
                                </span>
                            </p>
                        )}

                        <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#1a3d1a]/10 pt-3">
                            <span className="text-xs text-[#1a3d1a]/60">
                                {complaint.assigned_to
                                    ? `Handled by ${complaint.assigned_to}`
                                    : 'Nobody has picked this up yet'}
                            </span>
                            {!complaint.assigned_to && (
                                <button
                                    type="button"
                                    onClick={assignToMe}
                                    className={`${secondaryButtonClass} px-3 py-1.5 text-xs`}
                                >
                                    Take it
                                </button>
                            )}
                        </div>
                    </Panel>

                    <Panel title="Where it stands" icon="cog">
                        <form onSubmit={saveTriage} className="space-y-4">
                            <div>
                                <label
                                    htmlFor="complaint-status"
                                    className={labelClass}
                                >
                                    Status
                                </label>
                                <select
                                    id="complaint-status"
                                    value={triageForm.data.status}
                                    onChange={(event) =>
                                        triageForm.setData(
                                            'status',
                                            event.target.value,
                                        )
                                    }
                                    className={`${fieldClass} py-2.5 text-sm`}
                                >
                                    {statusOptions.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label
                                    htmlFor="complaint-priority"
                                    className={labelClass}
                                >
                                    Urgency
                                </label>
                                <select
                                    id="complaint-priority"
                                    value={triageForm.data.priority}
                                    onChange={(event) =>
                                        triageForm.setData(
                                            'priority',
                                            event.target.value as ComplaintPriority,
                                        )
                                    }
                                    className={`${fieldClass} py-2.5 text-sm`}
                                >
                                    {priorityOptions.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label
                                    htmlFor="resolution-notes"
                                    className={labelClass}
                                >
                                    Resolution notes
                                </label>
                                <textarea
                                    id="resolution-notes"
                                    rows={3}
                                    value={triageForm.data.resolution_notes}
                                    onChange={(event) =>
                                        triageForm.setData(
                                            'resolution_notes',
                                            event.target.value,
                                        )
                                    }
                                    maxLength={2000}
                                    placeholder="What was done, for the record…"
                                    className={`${fieldClass} resize-none py-2.5 text-sm`}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={triageForm.processing}
                                className={`${primaryButtonClass} px-3.5 py-2 text-xs`}
                            >
                                <Icon name="check" className="h-3.5 w-3.5" />
                                Save changes
                            </button>
                        </form>

                        {complaint.settled && (
                            <div className="mt-4 flex items-center gap-2">
                                <StatusPill
                                    active
                                    activeLabel="Settled"
                                    inactiveLabel="Settled"
                                />
                                <span className="text-xs text-[#1a3d1a]/55">
                                    The client can reopen it by replying.
                                </span>
                            </div>
                        )}
                    </Panel>
                </div>
            </div>
        </StaffLayout>
    );
}
