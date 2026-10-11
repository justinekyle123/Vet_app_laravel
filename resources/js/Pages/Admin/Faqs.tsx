import { rowButtonClass } from '@/Components/buttonStyles';
import Icon from '@/Components/Icon';
import Pagination from '@/Components/Pagination';
import Panel, { EmptyState } from '@/Components/Panel';
import StatusPill from '@/Components/StatusPill';
import StaffLayout from '@/Layouts/StaffLayout';
import { Paginated } from '@/types';
import { longDate } from '@/utils/format';
import { Link, router } from '@inertiajs/react';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import { FormEventHandler, useState } from 'react';

/** One row of the help list: a question plus where the clinic filed it. */
interface FaqRow {
    id: number;
    question: string;
    answer: string;
    category_name: string | null;
    is_published: boolean;
    updated_at: string | null;
}

const filters = [
    { value: 'all', label: 'All' },
    { value: 'published', label: 'Published' },
    { value: 'drafts', label: 'Drafts' },
] as const;

type Filter = (typeof filters)[number]['value'];

export default function Faqs({
    faqs,
    filters: active,
    counts,
}: {
    faqs: Paginated<FaqRow>;
    filters: { filter: Filter; search: string };
    counts: { published: number; drafts: number; total: number };
}) {
    const [search, setSearch] = useState(active.search);

    const applyFilters = (overrides: Partial<typeof active> = {}) => {
        const filter = overrides.filter ?? active.filter;
        const term = overrides.search ?? search;

        router.get(
            route('admin.faqs.index'),
            {
                ...(filter === 'all' ? {} : { filter }),
                ...(term === '' ? {} : { search: term }),
            },
            { preserveState: true, replace: true },
        );
    };

    const submitSearch: FormEventHandler = (event) => {
        event.preventDefault();
        applyFilters();
    };

    /* Publishing edits what clients read, so it confirms itself with a toast. */
    const togglePublished = (faq: FaqRow) => {
        router.patch(
            route('admin.faqs.toggle', faq.id),
            {},
            { preserveScroll: true },
        );
    };

    /*
     * Nothing references a question, so deleting one leaves no history behind
     * — but it is still irreversible, so it goes through a confirmation.
     */
    const confirmDelete = (faq: FaqRow) => {
        Swal.fire({
            title: 'Delete this question?',
            text: `"${faq.question}" will be removed from the help list. Clients will no longer see it.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Delete',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#b3261e',
            cancelButtonColor: '#1a3d1a',
            reverseButtons: true,
            focusCancel: true,
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(route('admin.faqs.destroy', faq.id), {
                    preserveScroll: true,
                });
            }
        });
    };

    return (
        <StaffLayout
            title="FAQs"
            heading="FAQs"
            description="The help questions clients read behind the portal's floating FAQ button. Drafts stay hidden until they are published."
            actions={
                <Link
                    href={route('admin.faqs.create')}
                    className="inline-flex items-center gap-2 rounded-full bg-[#1a3d1a] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2a5a2a]"
                >
                    <Icon name="plus" className="h-4 w-4" />
                    Add question
                </Link>
            }
        >
            <Panel
                title="Help questions"
                icon="question"
                flush
                action={
                    <span className="text-xs font-medium text-[#1a3d1a]/45">
                        {counts.published} of {counts.total} published
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
                        <label htmlFor="faq-search" className="sr-only">
                            Search help questions
                        </label>
                        <input
                            id="faq-search"
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search question or answer…"
                            className="w-full rounded-full border border-[#1a3d1a]/15 bg-white py-2.5 pl-10 pr-4 text-sm text-[#1a3d1a] shadow-sm transition-[border-color,box-shadow] duration-200 placeholder:text-[#1a3d1a]/35 focus:border-[#1a3d1a] focus:outline-none focus:ring-4 focus:ring-[#1a3d1a]/15 sm:w-72"
                        />
                    </form>

                    <div
                        role="group"
                        aria-label="Filter help questions"
                        className="flex items-center gap-1 rounded-full bg-[#1a3d1a]/5 p-1"
                    >
                        {filters.map((tab) => (
                            <button
                                key={tab.value}
                                type="button"
                                aria-pressed={active.filter === tab.value}
                                onClick={() =>
                                    applyFilters({ filter: tab.value })
                                }
                                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a] ${
                                    active.filter === tab.value
                                        ? 'bg-white text-[#1a3d1a] shadow-sm'
                                        : 'text-[#1a3d1a]/55 hover:text-[#1a3d1a]'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {faqs.data.length === 0 ? (
                    <div className="p-5">
                        <EmptyState
                            icon="question"
                            message={
                                active.search !== ''
                                    ? 'No questions match this search. Try a different word from the question or the answer.'
                                    : counts.total === 0
                                      ? 'No help questions yet. Add the questions the front desk answers most often, and clients will find them in the portal.'
                                      : 'Nothing in this view. Switch the filter to see the rest of the help list.'
                            }
                        />
                    </div>
                ) : (
                    <ul className="divide-y divide-[#1a3d1a]/10">
                        {faqs.data.map((faq) => (
                            <li
                                key={faq.id}
                                className="flex flex-col gap-3 px-5 py-4 transition-colors duration-150 hover:bg-[#EFFDF0]/60 sm:flex-row sm:items-start sm:justify-between"
                            >
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2.5">
                                        <p className="text-sm font-semibold text-[#1a3d1a]">
                                            {faq.question}
                                        </p>
                                        {faq.category_name && (
                                            <span className="rounded-full bg-[#EFFDF0] px-2.5 py-1 text-[0.68rem] font-semibold text-[#2a5a2a] ring-1 ring-[#1a3d1a]/10">
                                                {faq.category_name}
                                            </span>
                                        )}
                                        {!faq.is_published && (
                                            <StatusPill
                                                active={false}
                                                inactiveLabel="Draft"
                                            />
                                        )}
                                    </div>

                                    <p className="mt-1.5 line-clamp-2 max-w-3xl text-xs leading-relaxed text-[#1a3d1a]/55">
                                        {faq.answer}
                                    </p>

                                    {faq.updated_at && (
                                        <p className="mt-2 text-[0.68rem] text-[#1a3d1a]/40">
                                            Updated {longDate(faq.updated_at)}
                                        </p>
                                    )}
                                </div>

                                <div className="flex shrink-0 items-center gap-2">
                                    <Link
                                        href={route(
                                            'admin.faqs.edit',
                                            faq.id,
                                        )}
                                        className={rowButtonClass}
                                    >
                                        <Icon
                                            name="pencil"
                                            className="h-3.5 w-3.5"
                                        />
                                        Edit
                                    </Link>

                                    <button
                                        type="button"
                                        onClick={() => togglePublished(faq)}
                                        className={rowButtonClass}
                                    >
                                        <Icon
                                            name={
                                                faq.is_published
                                                    ? 'eyeSlash'
                                                    : 'check'
                                            }
                                            className="h-3.5 w-3.5"
                                        />
                                        {faq.is_published
                                            ? 'Unpublish'
                                            : 'Publish'}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => confirmDelete(faq)}
                                        aria-label={`Delete ${faq.question}`}
                                        className={`${rowButtonClass} text-[#b3261e] hover:bg-[#b3261e]/5`}
                                    >
                                        <Icon
                                            name="trash"
                                            className="h-3.5 w-3.5"
                                        />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                <Pagination page={faqs} />
            </Panel>
        </StaffLayout>
    );
}
