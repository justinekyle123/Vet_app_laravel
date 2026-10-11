import { secondaryButtonClass } from '@/Components/buttonStyles';
import Icon from '@/Components/Icon';
import Panel from '@/Components/Panel';
import StaffLayout from '@/Layouts/StaffLayout';
import { Link } from '@inertiajs/react';
import FaqForm, { FaqCategoryOption } from './Partials/FaqForm';

export default function FaqCreate({
    categories,
}: {
    categories: FaqCategoryOption[];
}) {
    return (
        <StaffLayout
            title="Add Question"
            heading="Add question"
            description="Write a help question and its answer, file it under a category, and publish it to the owner portal."
            actions={
                <Link href={route('admin.faqs.index')} className={secondaryButtonClass}>
                    <Icon name="arrowRight" className="h-4 w-4 rotate-180" />
                    Back to FAQs
                </Link>
            }
        >
            <div className="max-w-3xl">
                <Panel title="Question details" icon="question">
                    <FaqForm faq={null} categories={categories} />
                </Panel>
            </div>
        </StaffLayout>
    );
}
