import CountUp from '@/Components/CountUp';
import Reveal from '@/Components/Reveal';
import { EmptyState } from '@/Components/Panel';
import { primaryButtonClass } from '@/Components/buttonStyles';
import OwnerLayout from '@/Layouts/OwnerLayout';
import { PageProps, PortalAppointment, PortalDog } from '@/types';
import { currency } from '@/utils/format';
import { Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    CalendarDays,
    Clock,
    Mail,
    PawPrint,
    Plus,
    Syringe,
} from 'lucide-react';
import { fullDate } from './Partials/AppointmentList';

/* ─────────────────────────────────────────────────────────────
   Photography — the three pet portraits from the Welcome page.
   ───────────────────────────────────────────────────────────── */
const assets = {
    avatar: 'https://polo-pecan-73837341.figma.site/_assets/v11/e62173d41f91350a59628e8a9a55ae078a886fb9.png?w=128',
    petLeft:
        'https://polo-pecan-73837341.figma.site/_assets/v11/8d44b25186ef45a5789c74668fb781cea4e1ff49.png',
    petCenter:
        'https://polo-pecan-73837341.figma.site/_assets/v11/96745c4e72ad5c5208e53a885df797fd82cd854a.png?h=1024',
    petRight:
        'https://polo-pecan-73837341.figma.site/_assets/v11/81bd2e7a66b58f3d8f3ad78fd1ebf01af8dfdee1.png',
};

interface DashboardStats {
    dogs: number;
    upcoming: number;
    unread: number;
}

/* ─────────────────────────────────────────────────────────────
   Small shared pieces
   ───────────────────────────────────────────────────────────── */

function CountChip({ count }: { count: number }) {
    return (
        <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#1a3d1a]/8 px-1.5 text-[0.62rem] font-bold tabular-nums text-[#1a3d1a]/70">
            {count}
        </span>
    );
}

function CardHeader({
    icon,
    title,
    action,
}: {
    icon: React.ReactNode;
    title: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-between gap-3 border-b border-[#1a3d1a]/8 px-5 py-3.5">
            <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EFFDF0] text-[#1a3d1a]">
                    {icon}
                </span>
                <h3 className="text-sm font-semibold text-[#1a3d1a]">
                    {title}
                </h3>
            </div>
            {action}
        </div>
    );
}

function ViewAllLink({ href, label = 'View all' }: { href: string; label?: string }) {
    return (
        <Link
            href={href}
            className="text-xs font-semibold text-[#1a3d1a]/55 transition-colors duration-150 hover:text-[#1a3d1a]"
        >
            {label}
        </Link>
    );
}

/* ─────────────────────────────────────────────────────────────
   HERO — 60vh, three pet photos, staggered text entrance
   ───────────────────────────────────────────────────────────── */
function HeroCard({
    firstName,
    appointment,
}: {
    firstName: string;
    appointment: PortalAppointment | null;
}) {
    return (
        <div className="relative overflow-hidden rounded-3xl border border-[#1a3d1a]/10 bg-white shadow-sm">
            <div className="grid min-h-[60vh] grid-cols-1 lg:grid-cols-12">

                {/* ── Info panel — 7/12 on lg ─────────────────── */}
                <div className="relative flex flex-col justify-between bg-[#1a3d1a] p-8 text-white sm:p-10 lg:col-span-7 lg:p-14">
                    {/* Ambient radial glow for depth */}
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_90%_at_0%_0%,rgba(255,255,255,0.08),transparent_65%)]"
                    />
                    {/* Second subtle glow at bottom-left, warmer */}
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_0%_100%,rgba(232,106,16,0.10),transparent_70%)]"
                    />

                    {/* ─── Top: eyebrow + title ─────────────── */}
                    <div className="relative">
                        <p
                            className="hero-text flex items-center gap-3 text-[0.62rem] font-bold uppercase tracking-[0.2em] text-white/50"
                            style={{ animationDelay: '0ms' }}
                        >
                            <span
                                aria-hidden="true"
                                className="h-px w-6 bg-[#E86A10]"
                            />
                            {appointment ? 'Next visit' : 'Your visits'}
                        </p>

                        <h1 className="mt-6 font-serif-display text-4xl leading-[1.02] sm:text-5xl lg:text-6xl">
                            <span
                                className="hero-text block"
                                style={{ animationDelay: '120ms' }}
                            >
                                Welcome back,
                            </span>
                            <span
                                className="hero-text block text-[#E86A10]"
                                style={{ animationDelay: '240ms' }}
                            >
                                {firstName}
                            </span>
                        </h1>

                        {!appointment && (
                            <p
                                className="hero-text mt-6 max-w-md text-base leading-relaxed text-white/65"
                                style={{ animationDelay: '380ms' }}
                            >
                                Nothing is on the calendar yet. Browse the
                                clinic's services and book your dog's next
                                visit in a couple of taps.
                            </p>
                        )}
                    </div>

                    {/* ─── Middle: scheduled block ──────────── */}
                    {appointment && (
                        <div className="relative mt-10">
                            <p
                                className="hero-text text-[0.62rem] font-bold uppercase tracking-[0.16em] text-white/40"
                                style={{ animationDelay: '360ms' }}
                            >
                                Scheduled
                            </p>

                            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 text-base text-white/80">
                                <span
                                    className="hero-text inline-flex items-center gap-2.5"
                                    style={{ animationDelay: '460ms' }}
                                >
                                    <PawPrint className="h-5 w-5 text-[#E86A10]" />
                                    <span className="font-semibold text-white">
                                        {appointment.dog ?? 'Your dog'}
                                    </span>
                                </span>

                                <span
                                    className="hero-text inline-flex items-center gap-2.5"
                                    style={{ animationDelay: '520ms' }}
                                >
                                    <CalendarDays className="h-5 w-5 text-[#E86A10]" />
                                    {fullDate(appointment.date)}
                                </span>

                                {appointment.time && (
                                    <span
                                        className="hero-text inline-flex items-center gap-2.5"
                                        style={{ animationDelay: '580ms' }}
                                    >
                                        <Clock className="h-5 w-5 text-[#E86A10]" />
                                        {appointment.time}
                                    </span>
                                )}

                                {appointment.price && (
                                    <span
                                        className="hero-text rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-semibold text-white ring-1 ring-inset ring-white/15 backdrop-blur"
                                        style={{ animationDelay: '640ms' }}
                                    >
                                        {currency(appointment.price)}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ─── Bottom: actions ──────────────────── */}
                    <div
                        className="hero-text relative mt-10 flex flex-wrap items-center gap-3"
                        style={{ animationDelay: '720ms' }}
                    >
                        <Link
                            href={route('owner.booking')}
                            className={primaryButtonClass}
                        >
                            Book a visit
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                        <Link
                            href={route('owner.appointments.index')}
                            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition-colors duration-200 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                        >
                            My appointments
                        </Link>
                    </div>
                </div>

                {/* ── Photo panel — 5/12 on lg ─────────────────── */}
                <div className="relative flex min-h-[320px] flex-col lg:col-span-5">
                    {/* Three pet portraits, side by side */}
                    <div className="grid flex-1 grid-cols-3 overflow-hidden">
                        <div className="relative overflow-hidden">
                            <img
                                src={assets.petLeft}
                                alt="A dog being examined at the clinic"
                                draggable={false}
                                className="hero-photo absolute inset-0 h-full w-full object-cover object-top"
                                style={{ animationDelay: '180ms' }}
                            />
                            <span
                                aria-hidden="true"
                                className="absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-black/15 to-transparent"
                            />
                        </div>

                        <div className="relative overflow-hidden">
                            <img
                                src={assets.petCenter}
                                alt="A happy pet at the clinic"
                                draggable={false}
                                className="hero-photo absolute inset-0 h-full w-full object-cover object-top"
                                style={{ animationDelay: '300ms' }}
                            />
                            <span
                                aria-hidden="true"
                                className="absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-black/15 to-transparent"
                            />
                            <span
                                aria-hidden="true"
                                className="absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-black/15 to-transparent"
                            />
                        </div>

                        <div className="relative overflow-hidden">
                            <img
                                src={assets.petRight}
                                alt="A patient resting after a visit"
                                draggable={false}
                                className="hero-photo absolute inset-0 h-full w-full object-cover object-top"
                                style={{ animationDelay: '420ms' }}
                            />
                            <span
                                aria-hidden="true"
                                className="absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-black/15 to-transparent"
                            />
                        </div>
                    </div>

                    {/* The light-green ledge the pets peek over */}
                    <div
                        className="hero-ledge relative h-20 shrink-0 bg-[#b9e9bd] sm:h-24 lg:h-28"
                        style={{ animationDelay: '600ms' }}
                    >
                        {/* Soft inner highlight along the top edge for dimension */}
                        <span
                            aria-hidden="true"
                            className="absolute inset-x-0 top-0 h-px bg-white/40"
                        />
                        <span
                            aria-hidden="true"
                            className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent"
                        />
                    </div>
                </div>
            </div>

            {/* Floating brand chip — top-right of the photo column */}
            <div className="absolute right-5 top-5 z-10 flex items-center gap-2.5 rounded-full bg-white/95 px-3 py-1.5 shadow-lg backdrop-blur">
                <img
                    src={assets.avatar}
                    alt=""
                    className="h-6 w-6 rounded-full object-cover"
                />
                <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#1a3d1a]">
                    MyVet Care
                </span>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   COLUMN 1 — Upcoming schedule
   ───────────────────────────────────────────────────────────── */
function ScheduleCard({
    appointments,
}: {
    appointments: PortalAppointment[];
}) {
    const visible = appointments.slice(0, 3);

    return (
        <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#1a3d1a]/10 bg-white shadow-sm">
            <CardHeader
                icon={<CalendarDays className="h-3.5 w-3.5" />}
                title="Upcoming schedule"
                action={
                    <div className="flex items-center gap-3">
                        <CountChip count={appointments.length} />
                        <ViewAllLink href={route('owner.appointments.index')} />
                    </div>
                }
            />

            {visible.length === 0 ? (
                <div className="flex flex-1 items-center justify-center p-6 text-center">
                    <div>
                        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EFFDF0] text-[#1a3d1a]/40">
                            <CalendarDays className="h-5 w-5" />
                        </span>
                        <p className="mt-3 text-sm font-semibold text-[#1a3d1a]">
                            No visits booked
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-[#1a3d1a]/55">
                            Book your dog's first appointment.
                        </p>
                    </div>
                </div>
            ) : (
                <ul className="divide-y divide-[#1a3d1a]/6 p-2">
                    {visible.map((appt) => {
                        const timeLabel = appt.time
                            ? appt.time.split(':').slice(0, 2).join(':')
                            : '—';
                        const isPm = appt.time
                            ? Number(appt.time.split(':')[0]) >= 12
                            : false;

                        return (
                            <li
                                key={`${appt.id}-${appt.date}`}
                                className="flex items-start gap-3 rounded-xl p-3 transition-colors duration-150 hover:bg-[#EFFDF0]/60"
                            >
                                <span className="flex h-11 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-[#1a3d1a] text-white">
                                    <span className="font-display text-sm leading-none">
                                        {timeLabel}
                                    </span>
                                    <span className="mt-0.5 text-[0.55rem] font-bold uppercase tracking-wider text-white/50">
                                        {appt.time ? (isPm ? 'PM' : 'AM') : ''}
                                    </span>
                                </span>

                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-[#1a3d1a]">
                                        {appt.service ?? 'Visit'}
                                    </p>
                                    <p className="mt-0.5 truncate text-xs text-[#1a3d1a]/55">
                                        {appt.dog ?? 'Your dog'}
                                    </p>
                                    <p className="mt-1 truncate text-[0.68rem] text-[#1a3d1a]/45">
                                        {fullDate(appt.date)}
                                    </p>
                                </div>

                                {appt.status && (
                                    <span className="shrink-0 rounded-full bg-[#EFFDF0] px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-wider text-[#1a3d1a]/65">
                                        {appt.status}
                                    </span>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}

            {visible.length > 0 && (
                <p className="mt-auto border-t border-[#1a3d1a]/8 px-5 py-3 text-[0.68rem] leading-relaxed text-[#1a3d1a]/45">
                    Need to reschedule? Call the front desk and we'll find you
                    another slot.
                </p>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   COLUMN 2 — At a glance
   ───────────────────────────────────────────────────────────── */
function StatRow({
    icon,
    label,
    value,
    accent = false,
    href,
}: {
    icon: React.ReactNode;
    label: string;
    value: number;
    accent?: boolean;
    href?: string;
}) {
    const content = (
        <>
            <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-150 ${
                    accent
                        ? 'bg-[#E86A10]/10 text-[#E86A10]'
                        : 'bg-[#EFFDF0] text-[#1a3d1a]'
                }`}
            >
                {icon}
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[#1a3d1a]/45">
                    {label}
                </p>
                <p
                    className={`mt-0.5 font-display text-2xl leading-none ${
                        accent ? 'text-[#E86A10]' : 'text-[#1a3d1a]'
                    }`}
                >
                    <CountUp end={value} />
                </p>
            </div>
            {href && (
                <ArrowRight className="h-4 w-4 shrink-0 text-[#1a3d1a]/25 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[#1a3d1a]" />
            )}
        </>
    );

    const baseClass =
        'group flex items-center gap-3.5 rounded-xl p-3 transition-colors duration-150';

    return href ? (
        <Link href={href} className={`${baseClass} hover:bg-[#EFFDF0]/60`}>
            {content}
        </Link>
    ) : (
        <div className={baseClass}>{content}</div>
    );
}

function StatsCard({ stats }: { stats: DashboardStats }) {
    return (
        <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#1a3d1a]/10 bg-white shadow-sm">
            <CardHeader
                icon={<PawPrint className="h-3.5 w-3.5" />}
                title="At a glance"
            />

            <div className="flex flex-1 flex-col justify-center gap-1.5 p-2.5">
                <StatRow
                    icon={<PawPrint className="h-4 w-4" />}
                    label="My dogs"
                    value={stats.dogs}
                    href={route('owner.account.edit')}
                />
                <StatRow
                    icon={<CalendarDays className="h-4 w-4" />}
                    label="Upcoming visits"
                    value={stats.upcoming}
                    href={route('owner.appointments.index')}
                />
                <StatRow
                    icon={<Mail className="h-4 w-4" />}
                    label="Unread messages"
                    value={stats.unread}
                    accent
                />
            </div>

            <p className="mt-auto border-t border-[#1a3d1a]/8 px-5 py-3 text-[0.68rem] leading-relaxed text-[#1a3d1a]/45">
                Counts update the moment the clinic records something new.
            </p>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   COLUMN 3 — Recent messages
   ───────────────────────────────────────────────────────────── */
interface PortalNotification {
    id: number | string;
    channel: string;
    message: string;
    sent_at?: string | null;
}

function MessagesCard({
    notifications,
    unread,
}: {
    notifications: PortalNotification[];
    unread: number;
}) {
    const visible = notifications.slice(0, 3);

    return (
        <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#1a3d1a]/10 bg-white shadow-sm">
            <CardHeader
                icon={<Mail className="h-3.5 w-3.5" />}
                title="From the clinic"
                action={
                    <span className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[#1a3d1a]/45">
                        {unread > 0 ? `${unread} unread` : 'All caught up'}
                    </span>
                }
            />

            {visible.length === 0 ? (
                <div className="flex flex-1 items-center justify-center p-6 text-center">
                    <div>
                        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EFFDF0] text-[#1a3d1a]/40">
                            <Mail className="h-5 w-5" />
                        </span>
                        <p className="mt-3 text-sm font-semibold text-[#1a3d1a]">
                            Nothing new
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-[#1a3d1a]/55">
                            Appointment reminders and clinic updates will land
                            here.
                        </p>
                    </div>
                </div>
            ) : (
                <ul className="divide-y divide-[#1a3d1a]/6">
                    {visible.map((n) => (
                        <li
                            key={n.id}
                            className="px-5 py-3.5 transition-colors duration-150 hover:bg-[#EFFDF0]/50"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <span className="rounded-full bg-[#EFFDF0] px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-[0.1em] text-[#1a3d1a]/70">
                                    {n.channel}
                                </span>
                                <span className="text-[0.68rem] text-[#1a3d1a]/45">
                                    {n.sent_at
                                        ? new Date(n.sent_at).toLocaleDateString(
                                              'en-US',
                                              {
                                                  month: 'short',
                                                  day: 'numeric',
                                              },
                                          )
                                        : ''}
                                </span>
                            </div>
                            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-[#1a3d1a]">
                                {n.message}
                            </p>
                        </li>
                    ))}
                </ul>
            )}

            {visible.length > 0 && (
                <p className="mt-auto border-t border-[#1a3d1a]/8 px-5 py-3 text-[0.68rem] leading-relaxed text-[#1a3d1a]/45">
                    Older messages stay in your portal inbox.
                </p>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   BOTTOM WIDE CARD — My dogs
   ───────────────────────────────────────────────────────────── */
function DogCard({ dog }: { dog: PortalDog }) {
    const meta =
        [dog.breed, dog.sex].filter(Boolean).join(' · ') || 'Breed not set';

    return (
        <article className="group flex min-w-[220px] flex-col rounded-2xl border border-[#1a3d1a]/10 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#1a3d1a]/20 hover:shadow-md hover:shadow-[#1a3d1a]/5">
            <div className="flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EFFDF0] text-[#1a3d1a] ring-1 ring-[#1a3d1a]/5">
                    <PawPrint className="h-5 w-5" />
                </span>

                <span
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wider ${
                        dog.is_vaccinated
                            ? 'bg-[#2a5a2a]/10 text-[#2a5a2a]'
                            : 'bg-[#E86A10]/10 text-[#E86A10]'
                    }`}
                >
                    <Syringe className="h-2.5 w-2.5" />
                    {dog.is_vaccinated ? 'Vaccinated' : 'Booster due'}
                </span>
            </div>

            <p className="mt-3.5 font-display text-lg leading-tight text-[#1a3d1a]">
                {dog.dog_name}
            </p>
            <p className="mt-1 truncate text-xs text-[#1a3d1a]/55">{meta}</p>

            <Link
                href={route('owner.account.edit')}
                className="mt-4 inline-flex items-center justify-between border-t border-[#1a3d1a]/8 pt-3 text-xs font-semibold text-[#1a3d1a] transition-colors duration-150 hover:text-[#E86A10]"
            >
                View record
                <ArrowRight className="h-3.5 w-3.5 text-[#E86A10] transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
        </article>
    );
}

function DogsCard({ dogs }: { dogs: PortalDog[] }) {
    return (
        <div className="overflow-hidden rounded-2xl border border-[#1a3d1a]/10 bg-white shadow-sm">
            <CardHeader
                icon={<PawPrint className="h-3.5 w-3.5" />}
                title="My dogs"
                action={
                    <div className="flex items-center gap-3">
                        <CountChip count={dogs.length} />
                        <Link
                            href={route('owner.account.edit')}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1a3d1a]/55 transition-colors duration-150 hover:text-[#1a3d1a]"
                        >
                            <Plus className="h-3 w-3" />
                            Add a dog
                        </Link>
                    </div>
                }
            />

            {dogs.length === 0 ? (
                <div className="p-6">
                    <EmptyState message="No dogs are registered under your account yet. Add your first one to get started." />
                </div>
            ) : (
                <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto p-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {dogs.map((dog) => (
                        <div key={dog.id} className="snap-start">
                            <DogCard dog={dog} />
                        </div>
                    ))}

                    <Link
                        href={route('owner.account.edit')}
                        className="group flex min-w-[180px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#1a3d1a]/15 bg-[#EFFDF0]/40 p-4 text-center transition-colors duration-200 hover:border-[#1a3d1a]/30 hover:bg-[#EFFDF0]"
                    >
                        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#1a3d1a] shadow-sm transition-transform duration-200 group-hover:scale-105">
                            <Plus className="h-5 w-5" />
                        </span>
                        <p className="text-xs font-semibold text-[#1a3d1a]">
                            Add another dog
                        </p>
                        <p className="text-[0.68rem] text-[#1a3d1a]/50">
                            Register a new pet
                        </p>
                    </Link>
                </div>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   PAGE
   ───────────────────────────────────────────────────────────── */
export default function OwnerDashboard({
    dogs,
    upcoming,
    stats,
}: PageProps<{
    dogs: PortalDog[];
    upcoming: PortalAppointment[];
    stats: DashboardStats;
}>) {
    const user = usePage<PageProps>().props.auth.user;
    const notifications =
        usePage<PageProps>().props.portal?.notifications ?? [];
    const firstName = user.name.trim().split(/\s+/)[0] ?? user.name;

    return (
        <OwnerLayout title="My portal">
            {/* ── Hero — 60vh, three-photo banner ─────────────────── */}
            <Reveal>
                <HeroCard
                    firstName={firstName}
                    appointment={upcoming[0] ?? null}
                />
            </Reveal>

            {/* ── Three balanced panels ───────────────────────────── */}
            <div className="mt-6 grid grid-cols-1 items-stretch gap-5 md:grid-cols-2 lg:grid-cols-3">
                <Reveal className="h-full">
                    <ScheduleCard appointments={upcoming} />
                </Reveal>
                <Reveal delay={80} className="h-full">
                    <StatsCard stats={stats} />
                </Reveal>
                <Reveal delay={160} className="h-full md:col-span-2 lg:col-span-1">
                    <MessagesCard
                        notifications={notifications}
                        unread={stats.unread}
                    />
                </Reveal>
            </div>

            {/* ── Wide bottom card — the dog roster ───────────────── */}
            <Reveal delay={240} className="mt-6">
                <DogsCard dogs={dogs} />
            </Reveal>
        </OwnerLayout>
    );
}