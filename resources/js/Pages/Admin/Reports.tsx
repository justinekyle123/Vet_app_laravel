import Icon from '@/Components/Icon';
import Panel, { EmptyState, SoonChip, SoonState } from '@/Components/Panel';
import StatCard from '@/Components/StatCard';
import StaffLayout from '@/Layouts/StaffLayout';

interface SeriesPoint {
    label: string;
    count: number;
}

interface ReportsProps {
    accounts: {
        total: number;
        admins: number;
        front_desk: number;
        owners: number;
    };
    clients: {
        total: number;
        active: number;
        inactive: number;
    };
    dogs: {
        total: number;
        active: number;
    };
    signups: SeriesPoint[];
    breeds: SeriesPoint[];
}

/** Tallest value in a series, floored at 1 so ratios stay finite. */
function peakOf(series: SeriesPoint[]): number {
    return series.reduce((peak, point) => Math.max(peak, point.count), 1);
}

function share(value: number, total: number): number {
    return total > 0 ? Math.round((value / total) * 100) : 0;
}

/**
 * Monthly sign-ups as vertical bars. Bars are scaled against the busiest month
 * so the busiest one always fills the chart, and each bar keeps a small stub
 * when the month was empty so the row still reads as a month.
 */
function SignupChart({ data }: { data: SeriesPoint[] }) {
    const peak = peakOf(data);

    return (
        <>
            <div className="flex items-end gap-2 sm:gap-3" style={{ height: '11rem' }}>
                {data.map((point) => (
                    <div
                        key={point.label}
                        className="flex h-full flex-1 items-end"
                    >
                        <div
                            role="img"
                            aria-label={`${point.label}: ${point.count} new ${
                                point.count === 1 ? 'owner' : 'owners'
                            }`}
                            className="relative w-full rounded-t-lg bg-[#1a3d1a] transition-[height] duration-500 hover:bg-[#2a5a2a]"
                            style={{
                                height: `${Math.max(
                                    (point.count / peak) * 100,
                                    3,
                                )}%`,
                            }}
                        >
                            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-semibold text-[#1a3d1a]">
                                {point.count}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-2 flex gap-2 sm:gap-3">
                {data.map((point) => (
                    <span
                        key={point.label}
                        className="flex-1 text-center text-xs text-[#1a3d1a]/55"
                    >
                        {point.label}
                    </span>
                ))}
            </div>
        </>
    );
}

export default function Reports({
    accounts,
    clients,
    dogs,
    signups,
    breeds,
}: ReportsProps) {
    const signupTotal = signups.reduce((sum, point) => sum + point.count, 0);
    const breedPeak = peakOf(breeds);

    return (
        <StaffLayout
            title="Reports"
            heading="Reports"
            description="Clinic-wide figures drawn from live records. Money and appointment reporting join this page as those features ship."
        >
            <div className="space-y-6">
                <section
                    aria-label="Headline figures"
                    className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
                >
                    <StatCard
                        label="Total accounts"
                        value={accounts.total}
                        icon="user"
                        accent="brand"
                        hint={`${accounts.admins} admin · ${accounts.front_desk} front desk · ${accounts.owners} dog owners`}
                    />
                    <StatCard
                        label="Dog owners"
                        value={clients.total}
                        icon="paw"
                        accent="accent"
                        hint={`${clients.active} active · ${clients.inactive} inactive`}
                    />
                    <StatCard
                        label="Registered dogs"
                        value={dogs.total}
                        icon="heart"
                        accent="deep"
                        hint={`${dogs.active} active on file`}
                    />
                    <StatCard
                        label="New this month"
                        value={signups[signups.length - 1]?.count ?? 0}
                        icon="sparkles"
                        accent="brand"
                        hint={`${signupTotal} in the last ${signups.length} months`}
                    />
                </section>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Panel
                        title="New owner sign-ups"
                        icon="user"
                        fill
                        action={
                            <span className="text-xs font-medium text-[#1a3d1a]/45">
                                Last {signups.length} months
                            </span>
                        }
                    >
                        {signupTotal === 0 ? (
                            <EmptyState
                                icon="user"
                                message="No new owner accounts have been created in this window yet."
                            />
                        ) : (
                            <SignupChart data={signups} />
                        )}
                    </Panel>

                    <Panel
                        title="Dogs by breed"
                        icon="paw"
                        fill
                        action={
                            <span className="text-xs font-medium text-[#1a3d1a]/45">
                                {dogs.total} on file
                            </span>
                        }
                    >
                        {breeds.length === 0 ? (
                            <EmptyState
                                icon="paw"
                                message="No dogs are registered yet. Breed totals appear once owners add their dogs."
                            />
                        ) : (
                            <ul className="space-y-4">
                                {breeds.map((row) => (
                                    <li key={row.label}>
                                        <div className="flex items-center justify-between gap-3 text-sm">
                                            <span className="font-medium text-[#1a3d1a]">
                                                {row.label}
                                            </span>
                                            <span className="text-[#1a3d1a]/60">
                                                {row.count}
                                                <span className="ml-1.5 text-xs text-[#1a3d1a]/45">
                                                    {share(row.count, dogs.total)}
                                                    %
                                                </span>
                                            </span>
                                        </div>
                                        <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-[#1a3d1a]/5">
                                            <div
                                                className="h-full rounded-full bg-[#E86A10] transition-[width] duration-500"
                                                style={{
                                                    width: `${(row.count / breedPeak) * 100}%`,
                                                }}
                                            />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Panel>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <Panel title="Client records" icon="user" fill>
                            {clients.total === 0 ? (
                                <EmptyState
                                    icon="user"
                                    message="No client records exist yet. Register a walk-in client or let an owner sign up."
                                />
                            ) : (
                                <>
                                    <div
                                        role="img"
                                        aria-label={`${clients.active} active and ${clients.inactive} inactive client records`}
                                        className="flex h-2.5 w-full overflow-hidden rounded-full bg-[#1a3d1a]/5"
                                    >
                                        {clients.active > 0 && (
                                            <span
                                                className="bg-[#1a3d1a]"
                                                style={{
                                                    width: `${share(clients.active, clients.total)}%`,
                                                }}
                                            />
                                        )}
                                        {clients.inactive > 0 && (
                                            <span
                                                className="bg-[#E86A10]"
                                                style={{
                                                    width: `${share(clients.inactive, clients.total)}%`,
                                                }}
                                            />
                                        )}
                                    </div>

                                    <ul className="mt-5 space-y-3.5">
                                        <li className="flex items-center justify-between gap-3 text-sm">
                                            <span className="flex items-center gap-2.5 text-[#1a3d1a]/70">
                                                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#1a3d1a]" />
                                                Active clients
                                            </span>
                                            <span className="font-semibold text-[#1a3d1a]">
                                                {clients.active}
                                                <span className="ml-1.5 text-xs font-medium text-[#1a3d1a]/45">
                                                    {share(
                                                        clients.active,
                                                        clients.total,
                                                    )}
                                                    %
                                                </span>
                                            </span>
                                        </li>
                                        <li className="flex items-center justify-between gap-3 text-sm">
                                            <span className="flex items-center gap-2.5 text-[#1a3d1a]/70">
                                                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#E86A10]" />
                                                Inactive clients
                                            </span>
                                            <span className="font-semibold text-[#1a3d1a]">
                                                {clients.inactive}
                                                <span className="ml-1.5 text-xs font-medium text-[#1a3d1a]/45">
                                                    {share(
                                                        clients.inactive,
                                                        clients.total,
                                                    )}
                                                    %
                                                </span>
                                            </span>
                                        </li>
                                    </ul>

                                    <p className="mt-auto flex items-start gap-2.5 rounded-xl bg-[#EFFDF0] px-3.5 py-3 text-xs leading-relaxed text-[#1a3d1a]/70">
                                        <Icon
                                            name="sparkles"
                                            className="mt-0.5 h-4 w-4 shrink-0 text-[#1a3d1a]/50"
                                        />
                                        Every owner record is also a portal
                                        login: walk-ins created at the desk set
                                        their password through &ldquo;forgot
                                        password&rdquo;.
                                    </p>
                                </>
                            )}
                        </Panel>
                    </div>

                    <Panel
                        title="Money &amp; appointments"
                        icon="sparkles"
                        fill
                        action={<SoonChip />}
                    >
                        <SoonState message="Revenue, unpaid balances, and appointment volumes will be reported here once scheduling and payments are live. Nothing is being billed through MyVet yet." />
                    </Panel>
                </div>

                <p className="flex items-center gap-2 text-xs text-[#1a3d1a]/45">
                    <Icon name="clock" className="h-3.5 w-3.5" />
                    Figures reflect records as of{' '}
                    {new Date().toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                    })}
                    .
                </p>
            </div>
        </StaffLayout>
    );
}
