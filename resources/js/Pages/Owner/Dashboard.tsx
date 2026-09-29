import Panel, { EmptyState } from '@/Components/Panel';
import StatCard from '@/Components/StatCard';
import {
    primaryButtonClass,
    secondaryButtonClass,
} from '@/Components/buttonStyles';
import OwnerLayout from '@/Layouts/OwnerLayout';
import { PageProps, PortalAppointment, PortalDog } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, PawPrint, Plus, Syringe } from 'lucide-react';
import AppointmentList from './Partials/AppointmentList';

interface DashboardStats {
    dogs: number;
    upcoming: number;
    unread: number;
}

/**
 * The owner portal's home page.
 *
 * Leads with the two things a client opens the portal for — their dogs and
 * their next visit — and keeps the clinic's messages within reach rather than
 * burying them behind the bell alone.
 */
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
    const notifications = usePage<PageProps>().props.portal?.notifications ?? [];
    const firstName = user.name.trim().split(/\s+/)[0] ?? user.name;

    return (
        <OwnerLayout
            title="My portal"
            heading={`Welcome back, ${firstName}`}
            description="Your dogs, upcoming visits, and everything the clinic has sent you."
            actions={
                <>
                    <Link
                        href={route('owner.account.edit')}
                        className={secondaryButtonClass}
                    >
                        <Plus className="h-4 w-4" />
                        Add a dog
                    </Link>
                    <Link
                        href={route('owner.services.index')}
                        className={primaryButtonClass}
                    >
                        Book a service
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </>
            }
        >
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <StatCard
                    label="My dogs"
                    value={stats.dogs}
                    icon="paw"
                    hint="Registered under your account"
                />
                <StatCard
                    label="Upcoming visits"
                    value={stats.upcoming}
                    icon="calendar"
                    hint="Booked from today onwards"
                    accent="deep"
                />
                <StatCard
                    label="New messages"
                    value={stats.unread}
                    icon="mail"
                    hint="Since you last checked"
                    accent="accent"
                />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Panel
                    id="appointments"
                    title="Upcoming appointments"
                    icon="calendar"
                    action={
                        <Link
                            href={route('owner.appointments.index')}
                            className="text-xs font-semibold text-[#1a3d1a]/60 transition-colors duration-150 hover:text-[#1a3d1a]"
                        >
                            View all
                        </Link>
                    }
                >
                    <AppointmentList
                        appointments={upcoming}
                        emptyMessage="No visits booked yet. Browse the clinic's services to see what is available."
                    />
                </Panel>

                <Panel
                    id="dogs"
                    title="My dogs"
                    icon="paw"
                    action={
                        <Link
                            href={route('owner.account.edit')}
                            className="text-xs font-semibold text-[#1a3d1a]/60 transition-colors duration-150 hover:text-[#1a3d1a]"
                        >
                            Manage
                        </Link>
                    }
                >
                    {dogs.length === 0 ? (
                        <EmptyState message="No dogs are registered under your account yet. Add your first one to get started." />
                    ) : (
                        <ul className="divide-y divide-[#1a3d1a]/5">
                            {dogs.map((dog) => (
                                <li
                                    key={dog.id}
                                    className="flex items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EFFDF0] text-[#1a3d1a]">
                                            <PawPrint className="h-4 w-4" />
                                        </span>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-[#1a3d1a]">
                                                {dog.dog_name}
                                            </p>
                                            <p className="truncate text-xs text-[#1a3d1a]/55">
                                                {[dog.breed, dog.sex]
                                                    .filter(Boolean)
                                                    .join(' · ') ||
                                                    'Breed not set'}
                                            </p>
                                        </div>
                                    </div>

                                    <span
                                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.68rem] font-semibold ${
                                            dog.is_vaccinated
                                                ? 'bg-[#2a5a2a]/10 text-[#2a5a2a]'
                                                : 'bg-[#E86A10]/10 text-[#E86A10]'
                                        }`}
                                    >
                                        <Syringe className="h-3 w-3" />
                                        {dog.is_vaccinated
                                            ? 'Vaccinated'
                                            : 'Booster due'}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>
            </div>

            <div className="mt-6">
                <Panel
                    title="Messages from the clinic"
                    icon="mail"
                    action={
                        <span className="text-xs font-semibold text-[#1a3d1a]/45">
                            {stats.unread > 0
                                ? `${stats.unread} unread`
                                : 'All caught up'}
                        </span>
                    }
                >
                    {notifications.length === 0 ? (
                        <EmptyState
                            icon="mail"
                            message="Nothing yet. Appointment reminders and clinic updates will land here."
                        />
                    ) : (
                        <ul className="divide-y divide-[#1a3d1a]/5">
                            {notifications.slice(0, 4).map((notification) => (
                                <li
                                    key={notification.id}
                                    className="py-4 first:pt-0 last:pb-0"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="rounded-full bg-[#EFFDF0] px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-[#1a3d1a]/70">
                                            {notification.channel}
                                        </span>
                                        <span className="text-[0.68rem] text-[#1a3d1a]/45">
                                            {notification.sent_at
                                                ? new Date(
                                                      notification.sent_at,
                                                  ).toLocaleDateString(
                                                      'en-US',
                                                      {
                                                          month: 'short',
                                                          day: 'numeric',
                                                      },
                                                  )
                                                : ''}
                                        </span>
                                    </div>
                                    <p className="mt-1.5 text-sm leading-relaxed text-[#1a3d1a]">
                                        {notification.message}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>
            </div>
        </OwnerLayout>
    );
}
