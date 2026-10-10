import { secondaryButtonClass } from '@/Components/buttonStyles';
import Icon from '@/Components/Icon';
import Panel from '@/Components/Panel';
import StaffLayout from '@/Layouts/StaffLayout';
import { Link } from '@inertiajs/react';
import ServiceForm, {
    ServiceCategoryOption,
    ServiceRecord,
} from './Partials/ServiceForm';

export default function ServiceEdit({
    service,
    categories,
}: {
    service: ServiceRecord;
    categories: ServiceCategoryOption[];
}) {
    return (
        <StaffLayout
            title={`Edit ${service.service_name}`}
            heading={`Edit ${service.service_name}`}
            description="Update the category, description, image, duration, price, or availability for this service."
            actions={
                <Link href={route('admin.services.index')} className={secondaryButtonClass}>
                    <Icon name="arrowRight" className="h-4 w-4 rotate-180" />
                    Back to services
                </Link>
            }
        >
            <div className="max-w-3xl">
                <Panel title="Service details" icon="scissors">
                    <ServiceForm service={service} categories={categories} />
                </Panel>
            </div>
        </StaffLayout>
    );
}
