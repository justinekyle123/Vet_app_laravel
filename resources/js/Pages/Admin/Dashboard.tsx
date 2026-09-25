import {
    primaryButtonClass,
    secondaryButtonClass,
} from '@/Components/buttonStyles';
import Icon from '@/Components/Icon';
import StatCard, { StatAccent } from '@/Components/StatCard';
import Panel, { SoonChip, SoonState } from '@/Components/Panel';
import StaffLayout from '@/Layouts/StaffLayout';
import { UserRole } from '@/types';
import { Link } from '@inertiajs/react';

interface Stats {
    total_users: number;
    admins: number;
    front_desk: number;
    owners: number;
    unverified: number;
}

interface RecentUser {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    created_at: string;
}

const roleLabels: Record<UserRole, string> = {
    admin: 'Administrator',
    front_desk: 'Front Desk',
    owner: 'Dog Owner',
};

/* Badges stay inside the brand palette instead of the stock Tailwind hues. */
const roleBadges: Record<UserRole, string> = {
    admin: 'bg-[#1a3d1a]/10 text-[#1a3d1a]',
    front_desk: 'bg-[#2a5a2a]/10 text-[#2a5a2a]',
    owner: 'bg-[#E86A10]/10 text-[#E86A10]',
};

/** Segments of the role-mix bar, in the order they are stacked. */
const roleMix: {
    label: string;
    key: 'admins' | 'front_desk' | 'owners';
    bar: string;
    dot: string;
}[] = [
    { label: 'Administrators', key: 'admins', bar: 'bg-[#1a3d1a]', dot: 'bg-[#1a3d1a]' },
    { label: 'Front desk', key: 'front_desk', bar: 'bg-[#2a5a2a]', dot: 'bg-[#2a5a2a]' },
    { label: 'Dog owners', key: 'owners', bar: 'bg-[#E86A10]', dot: 'bg-[#E86A10]' },
];

const statHints: Record<string, string> = {
    total_users: 'Everyone with a MyVet login',
    admins: 'Full clinic management access',
    front_desk: 'Desk bookings and client records',
    owners: 'Client portal accounts',
};

/** First letters of the first two words, for the row avatars. */
function initials(name: string): string {
    const parts = name.trim().split(/\s+/).slice(0, 2);

    return (
        parts
            .map((part) => part[0]?.toUpperCase() ?? '')
            .join('') || '?'
    );
}

/**
 * Coarse relative label — exact timestamps are noise on a sign-up feed, and
 * this needs no date library.
 */
function joinedLabel(iso: string): string {
    const then = new Date(iso).getTime();

    if (Number.isNaN(then)) {
        return '';
    }

    const days = Math.floor((Date.now() - then) / 86_400_000);

    if (days <= 0) {
        return 'Today';
    }

    if (days === 1) {
        return 'Yesterday';
    }

    if (days < 7) {
        return `${days} days ago`;
    }

    if (days < 30) {
        return `${Math.floor(days / 7)}w ago`;
    }

    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

export default function AdminDashboard({
    stats,
    recentUsers,
}: {
    stats: Stats;
    recentUsers: RecentUser[];
}) {
    const rostered = stats.admins + stats.front_desk + stats.owners;
    const share = (value: number) =>
        rostered > 0 ? Math.round((value / rostered) * 100) : 0;

    const cards: {
        label: string;
        value: number;
        icon: 'user' | 'shield' | 'calendar' | 'paw' | 'mail';
        accent: StatAccent;
        hint: string;
    }[] = [
        {
            label: 'Total accounts',
            value: stats.total_users,
            icon: 'user',
            accent: 'brand',
            hint: statHints.total_users,
        },
        {
            label: 'Administrators',
            value: stats.admins,
            icon: 'shield',
            accent: 'deep',
            hint: statHints.admins,
        },
        {
            label: 'Front desk',
            value: stats.front_desk,
            icon: 'calendar',
            accent: 'brand',
            hint: statHints.front_desk,
        },
        {
            label: 'Dog owners',
            value: stats.owners,
            icon: 'paw',
            accent: 'deep',
            hint: statHints.owners,
        },
        {
            label: 'Unverified emails',
            value: stats.unverified,
            icon: 'mail',
            accent: 'accent',
            hint:
                stats.unverified === 0
                    ? 'Every account is confirmed'
                    : 'Awaiting email confirmation',
        },
    ];

    return (
        <StaffLayout
            title="Administrator Dashboard"
            heading="Administrator Dashboard"
            description="Clinic-wide accounts and operations at a glance."
            actions={
                <>
                    <Link
                        href={route('owners.index')}
                        className={secondaryButtonClass}
                    >
                        <Icon name="paw" className="h-4 w-4" />
                        Dog owners
                    </Link>
                    <Link
                        href={route('admin.staff.index')}
                        className={primaryButtonClass}
                    >
                        <Icon name="shield" className="h-4 w-4" />
                        Manage staff
                    </Link>
                </>
            }
        >
            <div className="space-y-6">
                <section
                    aria-label="Account totals"
                    className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5"
                >
                    {cards.map((card) => (
                        <StatCard
                            key={card.label}
                            label={card.label}
                            value={card.value}
                            icon={card.icon}
                            accent={card.accent}
                            hint={card.hint}
                        />
                    ))}
                </section>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <Panel
                            title="Recent sign-ups"
                            icon="user"
                            flush
                            fill
                            action={
                                <span className="text-xs font-medium text-[#1a3d1a]/45">
                                    Latest 5
                                </span>
                            }
                        >
                            {recentUsers.length === 0 ? (
                                <p className="px-5 py-6 text-sm text-[#1a3d1a]/55">
                                    No accounts have been created yet.
                                </p>
                            ) : (
                                <ul className="divide-y divide-[#1a3d1a]/10">
                                    {recentUsers.map((user) => (
                                        <li
                                            key={user.id}
                                            className="flex items-center gap-3 px-5 py-4 transition-colors duration-150 hover:bg-[#EFFDF0]/60"
                                        >
                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EFFDF0] text-sm font-semibold text-[#1a3d1a] ring-1 ring-[#1a3d1a]/10">
                                                {initials(user.name)}
                                            </span>

                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold text-[#1a3d1a]">
                                                    {user.name}
                                                </p>
                                                <p className="truncate text-xs text-[#1a3d1a]/55">
                                                    {user.email}
                                                </p>
                                            </div>

                                            <div className="flex shrink-0 flex-col items-end gap-1">
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-[0.68rem] font-semibold ${roleBadges[user.role]}`}
                                                >
                                                    {roleLabels[user.role]}
                                                </span>
                                                <span className="text-[0.68rem] text-[#1a3d1a]/45">
                                                    {joinedLabel(
                                                        user.created_at,
                                                    )}
                                                </span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </Panel>
                    </div>

                    <Panel
                        title="Role mix"
                        icon="sparkles"
                        fill
                        action={
                            <span className="text-xs font-medium text-[#1a3d1a]/45">
                                {rostered} rostered
                            </span>
                        }
                    >
                        {rostered === 0 ? (
                            <p className="my-auto text-sm text-[#1a3d1a]/55">
                                Role totals appear once accounts are created.
                            </p>
                        ) : (
                            <>
                                <div
                                    role="img"
                                    aria-label={`Role split across ${rostered} rostered accounts`}
                                    className="flex h-2.5 w-full overflow-hidden rounded-full bg-[#1a3d1a]/5"
                                >
                                    {roleMix
                                        .filter(
                                            (segment) => stats[segment.key] > 0,
                                        )
                                        .map((segment) => (
                                            <span
                                                key={segment.label}
                                                className={segment.bar}
                                                style={{
                                                    width: `${share(stats[segment.key])}%`,
                                                }}
                                            />
                                        ))}
                                </div>

                                <ul className="mt-5 space-y-3.5">
                                    {roleMix.map((segment) => (
                                        <li
                                            key={segment.label}
                                            className="flex items-center justify-between gap-3 text-sm"
                                        >
                                            <span className="flex items-center gap-2.5 text-[#1a3d1a]/70">
                                                <span
                                                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${segment.dot}`}
                                                />
                                                {segment.label}
                                            </span>
                                            <span className="font-semibold text-[#1a3d1a]">
                                                {stats[segment.key]}
                                                <span className="ml-1.5 text-xs font-medium text-[#1a3d1a]/45">
                                                    {share(stats[segment.key])}%
                                                </span>
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                <p className="mt-auto flex items-start gap-2.5 rounded-xl bg-[#EFFDF0] px-3.5 py-3 text-xs leading-relaxed text-[#1a3d1a]/70">
                                    <Icon
                                        name="mail"
                                        className="mt-0.5 h-4 w-4 shrink-0 text-[#1a3d1a]/50"
                                    />
                                    {stats.unverified === 0
                                        ? 'Every account has a confirmed email address.'
                                        : `${stats.unverified} ${
                                              stats.unverified === 1
                                                  ? 'account still needs'
                                                  : 'accounts still need'
                                          } to confirm an email address.`}
                                </p>
                            </>
                        )}
                    </Panel>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Panel
                        title="Appointments today"
                        icon="calendar"
                        action={<SoonChip />}
                    >
                        <SoonState message="Live booking counts will appear here once the scheduling feature ships. Owner records are already being collected in the meantime." />
                    </Panel>
                    <Panel
                        title="Revenue this month"
                        icon="sparkles"
                        action={<SoonChip />}
                    >
                        <SoonState message="Payment totals will appear here once invoicing goes live. Nothing is being billed through MyVet yet." />
                    </Panel>
                </div>
            </div>
        </StaffLayout>
    );
}
