import { secondaryButtonClass } from '@/Components/buttonStyles';
import Icon from '@/Components/Icon';
import Panel from '@/Components/Panel';
import StaffLayout from '@/Layouts/StaffLayout';
import { Link } from '@inertiajs/react';
import FaqForm, {
    FaqCategoryOption,
    FaqRecord,
} from './Partials/FaqForm';

export default function FaqEdit({
    faq,
    categories,
}: {
    faq: FaqRecord;
    categories: FaqCategoryOption[];
}) {
    return (
        <StaffLayout
            title="Edit Question"
            heading="Edit question"
            description="Reword a question or its answer, move it to another category, or take it off the portal."
            actions={
                <Link href={route('admin.faqs.index')} className={secondaryButtonClass}>
                    <Icon name="arrowRight" className="h-4 w-4 rotate-180" />
                    Back to FAQs
                </Link>
            }
        >
            <div className="max-w-3xl">
                <Panel
                    title="Question details"
                    icon="question"
                    action={
                        <span className="hidden shrink-0 text-xs font-medium text-[#1a3d1a]/45 sm:inline">
                            {faq.is_published ? 'Published' : 'Draft'}
                        </span>
                    }
                >
                    <FaqForm faq={faq} categories={categories} />
                </Panel>
            </div>
        </StaffLayout>
    );
}
