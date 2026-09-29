import { EmptyState } from '@/Components/Panel';
import { primaryButtonClass } from '@/Components/buttonStyles';
import OwnerLayout from '@/Layouts/OwnerLayout';
import {
    PageProps,
    PortalDog,
    PortalService,
    PortalServiceCategory,
} from '@/types';
import { currency } from '@/utils/format';
import { CalendarDays, Clock, Info, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import BookingModal from './Partials/BookingModal';

/**
 * The clinic's service menu, as a client sees it.
 *
 * Each card carries an `id` so the navbar search can deep-link straight to a
 * match, and a Book action that opens the calendar-backed booking modal.
 * Retired services never reach this page — the controller filters them out
 * before the props are built.
 */
export default function Services({
    categories,
    dogs,
    bookingWindowDays,
}: PageProps<{
    categories: PortalServiceCategory[];
    dogs: PortalDog[];
    bookingWindowDays: number;
}>) {
    const [query, setQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [bookingService, setBookingService] = useState<PortalService | null>(
        null,
    );
    const [bookingOpen, setBookingOpen] = useState(false);

    const term = query.trim().toLowerCase();

    const visibleCategories = useMemo(
        () =>
            categories
                .filter(
                    (category) =>
                        activeCategory === 'all' ||
                        category.name === activeCategory,
                )
                .map((category) => ({
                    ...category,
                    services: category.services.filter((service) =>
                        term === ''
                            ? true
                            : [
                                  service.service_name,
                                  service.description ?? '',
                                  category.name,
                              ]
                                  .join(' ')
                                  .toLowerCase()
                                  .includes(term),
                    ),
                }))
                .filter((category) => category.services.length > 0),
        [categories, activeCategory, term],
    );

    const totalServices = categories.reduce(
        (count, category) => count + category.services.length,
        0,
    );
    const shownServices = visibleCategories.reduce(
        (count, category) => count + category.services.length,
        0,
    );

    const openBooking = (service: PortalService) => {
        setBookingService(service);
        setBookingOpen(true);
    };

    const chipClass = (active: boolean) =>
        `rounded-full px-4 py-2 text-sm font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a] ${
            active
                ? 'bg-[#1a3d1a] text-white shadow-sm'
                : 'border border-[#1a3d1a]/15 bg-white text-[#1a3d1a]/70 hover:bg-[#EFFDF0] hover:text-[#1a3d1a]'
        }`;

    return (
        <OwnerLayout
            title="Our services"
            heading="Our services"
            description="Everything the clinic offers, grouped the way the desk books it."
        >
            <div className="mb-8 flex items-start gap-3 rounded-2xl border border-dashed border-[#1a3d1a]/15 bg-white/60 px-5 py-4">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#1a3d1a]/45" />
                <p className="text-sm leading-relaxed text-[#1a3d1a]/65">
                    Pick a service to see the clinic's open days and request a
                    visit. The front desk confirms every request, and you can
                    watch its status on your appointments page.
                </p>
            </div>

            {categories.length === 0 ? (
                <EmptyState
                    icon="paw"
                    message="The service menu is being updated. Please check back shortly."
                />
            ) : (
                <>
                    <div className="flex flex-col gap-4 rounded-2xl border border-[#1a3d1a]/10 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
                        <div className="relative min-w-0 flex-1">
                            <label htmlFor="service-search" className="sr-only">
                                Search services
                            </label>
                            <span
                                aria-hidden="true"
                                className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#1a3d1a]/40"
                            >
                                <Search className="h-4 w-4" />
                            </span>
                            <input
                                id="service-search"
                                type="search"
                                value={query}
                                autoComplete="off"
                                placeholder="Search services, e.g. grooming or vaccine"
                                onChange={(event) =>
                                    setQuery(event.target.value)
                                }
                                className="w-full rounded-full border border-[#1a3d1a]/15 bg-white py-2.5 pl-10 pr-10 text-sm text-[#1a3d1a] transition-[border-color,box-shadow] duration-200 placeholder:text-[#1a3d1a]/40 focus:border-[#1a3d1a] focus:outline-none focus:ring-4 focus:ring-[#1a3d1a]/10"
                            />
                            {query !== '' && (
                                <button
                                    type="button"
                                    onClick={() => setQuery('')}
                                    aria-label="Clear search"
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#1a3d1a]/40 transition-colors duration-150 hover:text-[#1a3d1a] focus:outline-none"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        <p className="shrink-0 text-xs font-semibold uppercase tracking-[0.12em] text-[#1a3d1a]/40">
                            {shownServices} of {totalServices} services
                        </p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setActiveCategory('all')}
                            aria-pressed={activeCategory === 'all'}
                            className={chipClass(activeCategory === 'all')}
                        >
                            All services
                        </button>
                        {categories.map((category) => (
                            <button
                                key={category.name}
                                type="button"
                                onClick={() =>
                                    setActiveCategory(category.name)
                                }
                                aria-pressed={activeCategory === category.name}
                                className={chipClass(
                                    activeCategory === category.name,
                                )}
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>

                    {shownServices === 0 ? (
                        <div className="mt-8">
                            <EmptyState
                                icon="search"
                                message={
                                    term === ''
                                        ? 'No services in that category right now.'
                                        : `No services match “${query.trim()}”. Try another word or browse a different category.`
                                }
                            />
                        </div>
                    ) : (
                        <div className="mt-8 space-y-10">
                            {visibleCategories.map((category) => (
                                <section key={category.name}>
                                    <div className="flex flex-wrap items-end justify-between gap-2">
                                        <h2 className="font-serif-display text-2xl leading-tight text-[#1a3d1a]">
                                            {category.name}
                                        </h2>
                                        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#1a3d1a]/40">
                                            {category.services.length}{' '}
                                            {category.services.length === 1
                                                ? 'service'
                                                : 'services'}
                                        </span>
                                    </div>

                                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        {category.services.map((service) => (
                                            <article
                                                key={service.id}
                                                id={`service-${service.id}`}
                                                className="flex scroll-mt-28 flex-col rounded-2xl border border-[#1a3d1a]/10 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#1a3d1a]/20 hover:shadow-lg hover:shadow-[#1a3d1a]/5"
                                            >
                                                <h3 className="text-base font-semibold text-[#1a3d1a]">
                                                    {service.service_name}
                                                </h3>
                                                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-[#1a3d1a]/60">
                                                    {service.description ??
                                                        'Ask the clinic for details.'}
                                                </p>

                                                <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#1a3d1a]/5 pt-4">
                                                    <span className="font-serif-display text-xl leading-none text-[#1a3d1a]">
                                                        {currency(
                                                            service.price,
                                                        )}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EFFDF0] px-2.5 py-1 text-xs font-medium text-[#1a3d1a]/70">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        {service.duration_minutes ??
                                                            '—'}{' '}
                                                        min
                                                    </span>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openBooking(service)
                                                    }
                                                    className={`${primaryButtonClass} mt-4 w-full`}
                                                >
                                                    <CalendarDays className="h-4 w-4" />
                                                    Book
                                                </button>
                                            </article>
                                        ))}
                                    </div>
                                </section>
                            ))}
                        </div>
                    )}
                </>
            )}

            <BookingModal
                service={bookingService}
                dogs={dogs}
                show={bookingOpen}
                onClose={() => setBookingOpen(false)}
            />

            {bookingWindowDays > 0 && (
                <p className="mt-10 text-center text-xs text-[#1a3d1a]/40">
                    Online booking is open for the next {bookingWindowDays}{' '}
                    days. Need something sooner? Call the clinic.
                </p>
            )}
        </OwnerLayout>
    );
}
