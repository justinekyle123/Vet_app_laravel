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
import { Link } from '@inertiajs/react';
import { ArrowRight, Clock, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import BookingModal from './Partials/BookingModal';
import { OwnerHero, SectionLabel } from './Partials/OwnerHero';

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

    /*
     * The hero's backing photograph comes from the menu itself, so the portal
     * reuses the clinic's own artwork instead of shipping a second set.
     */
    const heroImage =
        categories
            .flatMap((category) => category.services)
            .find((service) => service.image)?.image ?? null;

    const chipClass = (active: boolean) =>
        `rounded-full px-4 py-2 text-sm font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a] ${
            active
                ? 'bg-[#1a3d1a] text-white shadow-sm'
                : 'border border-[#1a3d1a]/15 bg-white text-[#1a3d1a]/70 hover:bg-[#EFFDF0] hover:text-[#1a3d1a]'
        }`;

    return (
        <OwnerLayout title="Our services">
            <OwnerHero
                eyebrow="Services"
                title="Find the right care"
                description="Pick a service to see the clinic's open days and request a visit. The front desk confirms every request, and you can watch its status on your appointments page."
                image={heroImage}
                actions={
                    <Link
                        href={route('owner.appointments.index')}
                        className={primaryButtonClass}
                    >
                        My appointments
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                }
            />

            {categories.length === 0 ? (
                <div className="mt-8">
                    <EmptyState
                        icon="paw"
                        message="The service menu is being updated. Please check back shortly."
                    />
                </div>
            ) : (
                <>
                    <div className="mt-8">
                        <SectionLabel>Browse the menu</SectionLabel>
                    </div>

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
                                                className="group flex h-full scroll-mt-28 flex-col overflow-hidden rounded-2xl border border-[#1a3d1a]/10 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#1a3d1a]/20 hover:shadow-lg hover:shadow-[#1a3d1a]/5"
                                            >
                                                <div className="relative h-40 shrink-0 overflow-hidden">
                                                    {service.image ? (
                                                        <img
                                                            src={service.image}
                                                            alt=""
                                                            draggable={false}
                                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                        />
                                                    ) : (
                                                        <span className="block h-full w-full bg-[#EFFDF0]" />
                                                    )}
                                                    <span
                                                        aria-hidden="true"
                                                        className="absolute inset-0 bg-gradient-to-t from-[#1a3d1a] via-[#1a3d1a]/40 to-transparent"
                                                    />
                                                    <span className="absolute left-4 top-4 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-white/70">
                                                        {category.name}
                                                    </span>
                                                    <span className="absolute right-4 top-4 rounded-full bg-[#E86A10] px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-white">
                                                        {currency(
                                                            service.price,
                                                        )}
                                                    </span>
                                                    <h3 className="absolute inset-x-4 bottom-4 line-clamp-2 font-serif-display text-2xl leading-tight text-white">
                                                        {service.service_name}
                                                    </h3>
                                                </div>

                                                <div className="flex flex-1 flex-col p-5">
                                                    <p className="line-clamp-3 text-sm leading-relaxed text-[#1a3d1a]/60">
                                                        {service.description ??
                                                            'Ask the clinic for details.'}
                                                    </p>

                                                    <dl className="mt-auto mb-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-[#1a3d1a]/10 pt-5">
                                                        <div>
                                                            <dt className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[#1a3d1a]/40">
                                                                Duration
                                                            </dt>
                                                            <dd className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-[#1a3d1a]">
                                                                <Clock className="h-3.5 w-3.5 text-[#E86A10]" />
                                                                {service.duration_minutes
                                                                    ? `${service.duration_minutes} min`
                                                                    : '—'}
                                                            </dd>
                                                        </div>
                                                        <div>
                                                            <dt className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[#1a3d1a]/40">
                                                                Filed under
                                                            </dt>
                                                            <dd className="mt-1 text-sm font-semibold text-[#1a3d1a]">
                                                                {category.name}
                                                            </dd>
                                                        </div>
                                                    </dl>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openBooking(
                                                                service,
                                                            )
                                                        }
                                                        className="flex items-center justify-between border-t border-[#1a3d1a]/10 pt-4 text-sm font-semibold text-[#1a3d1a] transition-colors duration-200 hover:text-[#E86A10] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]"
                                                    >
                                                        Book this service
                                                        <ArrowRight className="h-4 w-4 text-[#E86A10] transition-transform duration-200 group-hover:translate-x-1" />
                                                    </button>
                                                </div>
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
