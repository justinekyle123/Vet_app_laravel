import { secondaryButtonClass } from '@/Components/buttonStyles';
import Icon from '@/Components/Icon';
import Panel from '@/Components/Panel';
import StaffLayout from '@/Layouts/StaffLayout';
import { Link } from '@inertiajs/react';
import StaffForm, {
    StaffRecord,
    StaffRoleOption,
} from './Partials/StaffForm';

export default function StaffEdit({
    staff,
    roles,
}: {
    staff: StaffRecord;
    roles: StaffRoleOption[];
}) {
    const name = `${staff.first_name} ${staff.last_name}`.trim();

    return (
        <StaffLayout
            title={`Edit ${name}`}
            heading={`Edit ${name}`}
            description="Update this care-team profile. Vets and groomers do not sign in, so only their details change here."
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
                    <StaffForm roles={roles} staff={staff} />
                </Panel>
            </div>
        </StaffLayout>
    );
}
