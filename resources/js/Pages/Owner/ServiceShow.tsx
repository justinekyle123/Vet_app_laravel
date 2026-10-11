import StarRating from '@/Components/StarRating';
import {
    primaryButtonClass,
    secondaryButtonClass,
} from '@/Components/buttonStyles';
import OwnerLayout from '@/Layouts/OwnerLayout';
import {
    PageProps,
    Paginated,
    PortalDog,
    PortalReview,
    PortalService,
    PortalServiceDetail,
    PublicTeamMember,
} from '@/types';
import { currency, initials, longDate } from '@/utils/format';
import { Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    CalendarCheck,
    Check,
    Clock,
    PawPrint,
} from 'lucide-react';
import { useState } from 'react';
import BookingModal from './Partials/BookingModal';
import { SectionLabel } from './Partials/OwnerHero';

/**
 * One service in full, the way a shop item page reads.
 *
 * The menu card is a summary; this is what a client reads before they commit.
 * The rating is broken down rather than smoothed into a single number — a 4.5
 * from two reviews and a 4.5 from fifty are different promises — and every
 * published review behind it is listed, with the visit each one came from so a
 * reader can see they are real appointments.
 */

/** How many more reviews one press of the button asks for. */
const REVIEWS_PER_PAGE = 5;

/** How the page describes the member of the team who delivers a service. */
const providerLabels: Record<PortalServiceDetail['provider_role'], string> = {
    veterinarian: 'Delivered by a veterinarian',
    groomer: 'Delivered by a groomer',
};

export default function ServiceShow({
    service,
    reviews,
    related,
    team,
    dogs,
    bookingWindowDays,
}: PageProps<{
    service: PortalServiceDetail;
    reviews: Paginated<PortalReview>;
    related: PortalService[];
    team: PublicTeamMember[];
    dogs: PortalDog[];
    bookingWindowDays: number;
}>) {
    const [bookingOpen, setBookingOpen] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    const hasReviews = service.count > 0;
    const scores = [5, 4, 3, 2, 1];

    /* Everyone who could take a booking for this service: the clinic files
       grooming with its groomers and everything else with a veterinarian. */
    const providers = team.filter(
        (member) => member.role_value === service.provider_role,
    );

    const remaining = reviews.total - reviews.data.length;

    /*
     * Paging reads the same service again with a larger page rather than
     * appending, so the list a client sees is always the top of the same
     * ordering — nothing can arrive out of order.
     */
    const loadMoreReviews = () => {
        setLoadingMore(true);

        router.reload({
            data: {
                reviews_per_page: reviews.data.length + REVIEWS_PER_PAGE,
            },
            only: ['reviews'],
            onFinish: () => setLoadingMore(false),
        });
    };

    return (
        <OwnerLayout title={service.service_name}>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#1a3d1a]/45">
                <Link
                    href={route('owner.services.index')}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors duration-150 hover:bg-[#EFFDF0] hover:text-[#1a3d1a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    All services
                </Link>
                {service.category && (
                    <>
                        <span aria-hidden="true">·</span>
                        <span>{service.category}</span>
                    </>
                )}
            </div>

            <div className="mt-5 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
                <div className="min-w-0 space-y-10">
                    <header>
                        <h1 className="font-serif-display text-4xl leading-tight text-[#1a3d1a] sm:text-5xl">
                            {service.service_name}
                        </h1>

                        <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#1a3d1a]/60">
                            {service.duration_minutes !== null && (
                                <span className="inline-flex items-center gap-1.5">
                                    <Clock className="h-4 w-4 text-[#E86A10]" />
                                    {service.duration_minutes} min
                                </span>
                            )}
                            {service.provider_role === 'groomer' ? (
                                <span>Handled by a groomer</span>
                            ) : (
                                <span>Handled by a veterinarian</span>
                            )}
                            {service.category && (
                                <span>Filed under {service.category}</span>
                            )}
                        </p>

                        <div className="mt-4 flex flex-wrap items-center gap-3">
                            {service.rating !== null ? (
                                <>
                                    <StarRating
                                        value={service.rating}
                                        size="md"
                                    />
                                    <span className="text-sm font-semibold text-[#1a3d1a]">
                                        {service.rating}/5
                                    </span>
                                    <a
                                        href="#reviews"
                                        className="text-xs font-semibold text-[#1a3d1a]/60 underline decoration-[#1a3d1a]/25 underline-offset-2 transition-colors duration-150 hover:text-[#E86A10]"
                                    >
                                        {service.rating_count}{' '}
                                        {service.rating_count === 1
                                            ? 'review'
                                            : 'reviews'}
                                    </a>
                                </>
                            ) : (
                                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#1a3d1a]/40">
                                    No reviews yet
                                </span>
                            )}
                        </div>
                    </header>

                    <div className="h-64 overflow-hidden rounded-3xl border border-[#1a3d1a]/10 bg-[#EFFDF0] sm:h-80">
                        {service.image ? (
                            <img
                                src={service.image}
                                alt={service.service_name}
                                draggable={false}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <span className="flex h-full w-full items-center justify-center text-[#1a3d1a]/25">
                                <PawPrint className="h-14 w-14" />
                            </span>
                        )}
                    </div>

                    <section>
                        <SectionLabel>About this service</SectionLabel>
                        <p className="max-w-2xl text-sm leading-relaxed text-[#1a3d1a]/65">
                            {service.description ??
                                'The clinic has not written a description for this service yet. Ask the front desk and they will talk you through what it involves.'}
                        </p>

                        <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                            {[
                                { label: 'Price', value: currency(service.price) },
                                {
                                    label: 'Length',
                                    value:
                                        service.duration_minutes !== null
                                            ? `${service.duration_minutes} min`
                                            : '—',
                                },
                                {
                                    label: 'Filed under',
                                    value: service.category ?? 'Other services',
                                },
                                {
                                    label: 'Handled by',
                                    value:
                                        service.provider_role === 'groomer'
                                            ? 'A groomer'
                                            : 'A veterinarian',
                                },
                            ].map((fact) => (
                                <div
                                    key={fact.label}
                                    className="rounded-2xl border border-[#1a3d1a]/10 bg-white px-4 py-3.5"
                                >
                                    <dt className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[#1a3d1a]/40">
                                        {fact.label}
                                    </dt>
                                    <dd className="mt-1 truncate text-sm font-semibold text-[#1a3d1a]">
                                        {fact.value}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </section>

                    <section id="reviews" className="scroll-mt-28">
                        <SectionLabel>Ratings and reviews</SectionLabel>

                        {hasReviews ? (
                            <div className="grid grid-cols-1 gap-8 rounded-2xl border border-[#1a3d1a]/10 bg-white p-6 shadow-sm sm:grid-cols-[12rem_minmax(0,1fr)]">
                                <div>
                                    <p className="font-serif-display text-5xl leading-none text-[#1a3d1a]">
                                        {service.rating}
                                    </p>
                                    <StarRating
                                        value={service.rating ?? 0}
                                        size="md"
                                        className="mt-2"
                                    />
                                    <p className="mt-2 text-xs text-[#1a3d1a]/55">
                                        From {service.count}{' '}
                                        {service.count === 1
                                            ? 'published review'
                                            : 'published reviews'}
                                    </p>
                                    {service.satisfied !== null && (
                                        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#EFFDF0] px-3 py-1 text-xs font-semibold text-[#1a3d1a]">
                                            <Check className="h-3.5 w-3.5 text-[#E86A10]" />
                                            {service.satisfied}% rated it 4
                                            stars or better
                                        </p>
                                    )}
                                </div>

                                <ul className="space-y-2.5">
                                    {scores.map((score) => {
                                        const count =
                                            service.distribution[
                                                String(score)
                                            ] ?? 0;
                                        const share = Math.round(
                                            (count / service.count) * 100,
                                        );

                                        return (
                                            <li
                                                key={score}
                                                className="flex items-center gap-3"
                                            >
                                                <span className="w-14 shrink-0 text-xs font-semibold text-[#1a3d1a]/60">
                                                    {score}{' '}
                                                    {score === 1
                                                        ? 'star'
                                                        : 'stars'}
                                                </span>
                                                <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#1a3d1a]/10">
                                                    <span
                                                        className="block h-full rounded-full bg-[#E86A10]"
                                                        style={{
                                                            width: `${share}%`,
                                                        }}
                                                    />
                                                </span>
                                                <span className="w-8 shrink-0 text-right text-xs font-semibold text-[#1a3d1a]/60">
                                                    {count}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        ) : (
                            <p className="rounded-2xl border border-dashed border-[#1a3d1a]/15 bg-white px-5 py-6 text-sm leading-relaxed text-[#1a3d1a]/55">
                                Nobody has reviewed this service yet. Reviews
                                come from visits the clinic has completed, so
                                the first one to land here will be from a real
                                appointment.
                            </p>
                        )}

                        {reviews.data.length > 0 && (
                            <ul className="mt-6 space-y-4">
                                {reviews.data.map((review) => (
                                    <li
                                        key={review.id}
                                        className="rounded-2xl border border-[#1a3d1a]/10 bg-white p-5 shadow-sm"
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EFFDF0] text-sm font-semibold text-[#1a3d1a]">
                                                    {initials(
                                                        review.client ??
                                                            'A client',
                                                    )}
                                                </span>
                                                <div>
                                                    <p className="text-sm font-semibold text-[#1a3d1a]">
                                                        {review.client ??
                                                            'A client'}
                                                    </p>
                                                    <p className="mt-0.5 text-[0.68rem] text-[#1a3d1a]/45">
                                                        {review.visited_on
                                                            ? `Visit on ${longDate(
                                                                  review.visited_on,
                                                              )}`
                                                            : `Reviewed ${longDate(
                                                                  review.date,
                                                              )}`}
                                                    </p>
                                                </div>
                                            </div>

                                            <StarRating
                                                value={review.rating}
                                                size="sm"
                                            />
                                        </div>

                                        {review.comment && (
                                            <p className="mt-3 text-sm leading-relaxed text-[#1a3d1a]/65">
                                                “{review.comment}”
                                            </p>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}

                        {remaining > 0 && (
                            <button
                                type="button"
                                onClick={loadMoreReviews}
                                disabled={loadingMore}
                                className={`${secondaryButtonClass} mt-4 w-full px-4 py-2.5 text-sm`}
                            >
                                {loadingMore
                                    ? 'Loading reviews…'
                                    : `Show ${Math.min(
                                          remaining,
                                          REVIEWS_PER_PAGE,
                                      )} more ${remaining === 1 ? 'review' : 'reviews'}`}
                            </button>
                        )}
                    </section>

                    {related.length > 0 && (
                        <section>
                            <SectionLabel>
                                Other {service.category} services
                            </SectionLabel>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                {related.map((other) => (
                                    <Link
                                        key={other.id}
                                        href={route(
                                            'owner.services.show',
                                            other.id,
                                        )}
                                        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#1a3d1a]/10 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#1a3d1a]/20 hover:shadow-lg hover:shadow-[#1a3d1a]/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]"
                                    >
                                        <div className="h-28 shrink-0 overflow-hidden bg-[#EFFDF0]">
                                            {other.image && (
                                                <img
                                                    src={other.image}
                                                    alt=""
                                                    draggable={false}
                                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                />
                                            )}
                                        </div>
                                        <div className="flex flex-1 flex-col p-4">
                                            <p className="font-serif-display text-lg leading-tight text-[#1a3d1a]">
                                                {other.service_name}
                                            </p>
                                            <p className="mt-1 text-sm font-semibold text-[#E86A10]">
                                                {currency(other.price)}
                                            </p>
                                            <p className="mt-auto pt-3 text-xs text-[#1a3d1a]/50">
                                                {other.rating !== null
                                                    ? `${other.rating}/5 from ${other.rating_count} ${
                                                          other.rating_count ===
                                                          1
                                                              ? 'review'
                                                              : 'reviews'
                                                      }`
                                                    : 'No reviews yet'}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                <aside className="space-y-5 lg:sticky lg:top-24 lg:h-fit">
                    <div className="rounded-2xl border border-[#1a3d1a]/10 bg-white p-6 shadow-sm">
                        <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#1a3d1a]/40">
                            Price
                        </p>
                        <p className="mt-1 font-serif-display text-4xl leading-none text-[#1a3d1a]">
                            {currency(service.price)}
                        </p>
                        <p className="mt-2 text-xs text-[#1a3d1a]/55">
                            {service.duration_minutes !== null
                                ? `About ${service.duration_minutes} minutes at the clinic`
                                : 'Ask the desk how long to set aside'}
                        </p>

                        {service.last_visit && (
                            <p className="mt-4 flex items-start gap-2 rounded-xl bg-[#EFFDF0] px-3.5 py-3 text-xs leading-relaxed text-[#1a3d1a]/70">
                                <CalendarCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#E86A10]" />
                                <span>
                                    You last had this on{' '}
                                    {longDate(service.last_visit)}.
                                </span>
                            </p>
                        )}

                        <button
                            type="button"
                            onClick={() => setBookingOpen(true)}
                            className={`${primaryButtonClass} mt-5 w-full`}
                        >
                            Book this service
                            <ArrowRight className="h-4 w-4" />
                        </button>

                        <p className="mt-3 text-xs leading-relaxed text-[#1a3d1a]/50">
                            The front desk confirms every request, and you can
                            follow its status on your appointments page.
                        </p>

                        <ul className="mt-5 space-y-2 border-t border-[#1a3d1a]/10 pt-4 text-xs text-[#1a3d1a]/60">
                            <li className="flex items-start gap-2">
                                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#E86A10]" />
                                {providerLabels[service.provider_role]}
                            </li>
                            <li className="flex items-start gap-2">
                                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#E86A10]" />
                                Free to cancel while the visit is upcoming
                            </li>
                            <li className="flex items-start gap-2">
                                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#E86A10]" />
                                Pay at the desk once the visit is done
                            </li>
                        </ul>
                    </div>

                    {providers.length > 0 && (
                        <div className="rounded-2xl border border-[#1a3d1a]/10 bg-white p-6 shadow-sm">
                            <h2 className="text-sm font-semibold text-[#1a3d1a]">
                                Who you may see
                            </h2>

                            <ul className="mt-4 space-y-3">
                                {providers.map((member) => (
                                    <li
                                        key={member.id}
                                        className="flex items-center gap-3"
                                    >
                                        {member.image ? (
                                            <img
                                                src={member.image}
                                                alt={member.name}
                                                draggable={false}
                                                className="h-10 w-10 shrink-0 rounded-xl object-cover"
                                            />
                                        ) : (
                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EFFDF0] text-sm font-semibold text-[#1a3d1a]">
                                                {initials(member.name)}
                                            </span>
                                        )}
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-[#1a3d1a]">
                                                {member.name}
                                            </p>
                                            {member.specialization && (
                                                <p className="truncate text-xs text-[#1a3d1a]/50">
                                                    {member.specialization}
                                                </p>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </aside>
            </div>

            <BookingModal
                service={service}
                dogs={dogs}
                team={team}
                show={bookingOpen}
                onClose={() => setBookingOpen(false)}
            />

            {bookingWindowDays > 0 && (
                <p className="mt-12 text-center text-xs text-[#1a3d1a]/40">
                    Online booking is open for the next {bookingWindowDays}{' '}
                    days. Need something sooner? Call the clinic.
                </p>
            )}
        </OwnerLayout>
    );
}
