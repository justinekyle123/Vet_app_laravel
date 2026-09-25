import { secondaryButtonClass } from '@/Components/buttonStyles';
import Icon from '@/Components/Icon';
import Panel from '@/Components/Panel';
import StaffLayout from '@/Layouts/StaffLayout';
import { Link } from '@inertiajs/react';
import OwnerForm, { OwnerRecord } from './Partials/OwnerForm';

export default function Edit({ owner }: { owner: OwnerRecord }) {
    const fullName = `${owner.first_name} ${owner.last_name}`;

    return (
        <StaffLayout
            title={`Edit ${fullName}`}
            heading={`Edit ${fullName}`}
            description="Update this client's contact details and status."
            actions={
                <Link
                    href={route('owners.show', owner.id)}
                    className={secondaryButtonClass}
                >
                    <Icon name="arrowRight" className="h-4 w-4 rotate-180" />
                    Back to client
                </Link>
            }
        >
            <div className="max-w-3xl">
                <Panel title="Owner details" icon="user">
                    <OwnerForm owner={owner} />
                </Panel>
            </div>
        </StaffLayout>
    );
}
