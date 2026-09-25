import { secondaryButtonClass } from '@/Components/buttonStyles';
import Icon from '@/Components/Icon';
import Panel from '@/Components/Panel';
import StaffLayout from '@/Layouts/StaffLayout';
import { Link } from '@inertiajs/react';
import OwnerForm from './Partials/OwnerForm';

export default function Create() {
    return (
        <StaffLayout
            title="New Dog Owner"
            heading="New dog owner"
            description="Record a walk-in client. They can link a login account later by registering with the same email address."
            actions={
                <Link
                    href={route('owners.index')}
                    className={secondaryButtonClass}
                >
                    <Icon name="arrowRight" className="h-4 w-4 rotate-180" />
                    Back to dog owners
                </Link>
            }
        >
            <div className="max-w-3xl">
                <Panel title="Owner details" icon="user">
                    <OwnerForm />
                </Panel>
            </div>
        </StaffLayout>
    );
}
