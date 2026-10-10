import { secondaryButtonClass } from '@/Components/buttonStyles';
import Icon from '@/Components/Icon';
import Panel from '@/Components/Panel';
import StaffLayout from '@/Layouts/StaffLayout';
import { Link } from '@inertiajs/react';
import StaffForm, { StaffRoleOption } from './Partials/StaffForm';

export default function StaffCreate({ roles }: { roles: StaffRoleOption[] }) {
    return (
        <StaffLayout
            title="Add Staff"
            heading="Add a vet or groomer"
            description="Create a care team profile with the details dog owners see when they pick a service."
            actions={
                <Link
                    href={route('admin.staff.index')}
                    className={secondaryButtonClass}
                >
                    <Icon name="arrowRight" className="h-4 w-4 rotate-180" />
                    Back to staff
                </Link>
            }
        >
            <div className="max-w-3xl">
                <Panel title="Profile details" icon="user">
                    <StaffForm roles={roles} />
                </Panel>
            </div>
        </StaffLayout>
    );
}
