import { Paginated } from '@/types';
import { Link } from '@inertiajs/react';

/**
 * Numbered paginator for the staff console's tables.
 *
 * Laravel ships "Previous" / "Next" labels plus an ellipsis entry in the same
 * link list, so the labels are rendered as HTML and the entries without a URL
 * (ellipsis, disabled ends) become plain text.
 */
export default function Pagination({ page }: { page: Paginated<unknown> }) {
    if (page.last_page <= 1) {
        return null;
    }

    return (
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-[#1a3d1a]/10 px-5 py-4">
            <p className="text-xs text-[#1a3d1a]/55">
                Showing{' '}
                <span className="font-semibold text-[#1a3d1a]">
                    {page.from ?? 0}–{page.to ?? 0}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-[#1a3d1a]">
                    {page.total}
                </span>
            </p>

            <nav aria-label="Pagination" className="flex items-center gap-1">
                {page.links.map((link, index) =>
                    link.url ? (
                        <Link
                            key={index}
                            href={link.url}
                            preserveScroll
                            aria-current={link.active ? 'page' : undefined}
                            className={`inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-xl px-3 text-sm font-semibold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a] focus-visible:ring-offset-2 ${
                                link.active
                                    ? 'bg-[#1a3d1a] text-white'
                                    : 'border border-[#1a3d1a]/15 bg-white text-[#1a3d1a] hover:bg-[#EFFDF0]'
                            }`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ) : (
                        <span
                            key={index}
                            className="inline-flex h-9 min-w-[2.25rem] items-center justify-center px-3 text-sm text-[#1a3d1a]/35"
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ),
                )}
            </nav>
        </div>
    );
}
