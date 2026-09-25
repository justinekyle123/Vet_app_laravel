import {
    rowButtonClass,
    secondaryButtonClass,
} from '@/Components/buttonStyles';
import Icon from '@/Components/Icon';
import Panel, { SoonState } from '@/Components/Panel';
import StaffLayout from '@/Layouts/StaffLayout';
import { Link } from '@inertiajs/react';
import { useState } from 'react';
import ResetStaffPasswordForm, {
    StaffMember,
} from './Partials/ResetStaffPasswordForm';

const roleLabels: Record<StaffMember['role'], string> = {
    admin: 'Administrator',
    front_desk: 'Front Desk',
};

const roleBadges: Record<StaffMember['role'], string> = {
    admin: 'bg-[#1a3d1a]/10 text-[#1a3d1a]',
    front_desk: 'bg-[#2a5a2a]/10 text-[#2a5a2a]',
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

export default function Staff({ staff }: { staff: StaffMember[] }) {
    const [selected, setSelected] = useState<StaffMember | null>(null);

    return (
        <StaffLayout
            title="Staff Accounts"
            heading="Staff accounts"
            description="Reset a staff member's password when they are locked out or still on a default one."
            actions={
                <Link
                    href={route('admin.dashboard')}
                    className={secondaryButtonClass}
                >
                    <Icon name="arrowRight" className="h-4 w-4 rotate-180" />
                    Back to overview
                </Link>
            }
        >
            <Panel
                title="Clinic staff"
                icon="shield"
                flush
                action={
                    <span className="text-xs font-medium text-[#1a3d1a]/45">
                        {staff.length}{' '}
                        {staff.length === 1 ? 'account' : 'accounts'}
                    </span>
                }
            >
                {staff.length === 0 ? (
                    <div className="p-5">
                        <SoonState message="No staff accounts exist yet. Administrators and front desk accounts will be listed here." />
                    </div>
                ) : (
                    <ul className="divide-y divide-[#1a3d1a]/10">
                        {staff.map((member) => (
                            <li
                                key={member.id}
                                className="flex flex-col gap-3 px-5 py-4 transition-colors duration-150 hover:bg-[#EFFDF0]/60 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div className="flex min-w-0 items-center gap-3">
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EFFDF0] text-sm font-semibold text-[#1a3d1a] ring-1 ring-[#1a3d1a]/10">
                                        {initials(member.name)}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-[#1a3d1a]">
                                            {member.name}
                                        </p>
                                        <p className="truncate text-xs text-[#1a3d1a]/55">
                                            {member.email}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex shrink-0 items-center gap-3">
                                    <span
                                        className={`rounded-full px-2.5 py-1 text-[0.68rem] font-semibold ${roleBadges[member.role]}`}
                                    >
                                        {roleLabels[member.role]}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setSelected(member)}
                                        className={rowButtonClass}
                                    >
                                        <Icon
                                            name="lock"
                                            className="h-3.5 w-3.5"
                                        />
                                        Reset password
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </Panel>

            <ResetStaffPasswordForm
                staff={selected}
                show={selected !== null}
                onClose={() => setSelected(null)}
            />
        </StaffLayout>
    );
}
