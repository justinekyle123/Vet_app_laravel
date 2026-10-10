import { secondaryButtonClass } from '@/Components/buttonStyles';
import Icon from '@/Components/Icon';
import Panel from '@/Components/Panel';
import StaffLayout from '@/Layouts/StaffLayout';
import { Link } from '@inertiajs/react';
import ServiceForm, { ServiceCategoryOption } from './Partials/ServiceForm';

export default function ServiceCreate({
    categories,
}: {
    categories: ServiceCategoryOption[];
}) {
    return (
        <StaffLayout
            title="Add Service"
            heading="Add service"
            description="Add a bookable service with its category, description, image, duration, price, and availability."
            actions={
                <Link href={route('admin.services.index')} className={secondaryButtonClass}>
                    <Icon name="arrowRight" className="h-4 w-4 rotate-180" />
                    Back to services
                </Link>
            }
        >
            <div className="max-w-3xl">
                <Panel title="Service details" icon="scissors">
                    <ServiceForm service={null} categories={categories} />
                </Panel>
            </div>
        </StaffLayout>
    );
}
