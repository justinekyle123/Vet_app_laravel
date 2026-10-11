import { primaryButtonClass, secondaryButtonClass } from '@/Components/buttonStyles';
import Field, { TextAreaField } from '@/Components/Field';
import { checkboxClass, fieldClass, labelClass } from '@/Components/formStyles';
import Icon from '@/Components/Icon';
import InputError from '@/Components/InputError';
import Spinner from '@/Components/Spinner';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

export interface FaqRecord {
    id: number;
    question: string;
    answer: string;
    faq_category_id: number;
    category_name: string | null;
    is_published: boolean;
}

export interface FaqCategoryOption {
    faq_category_id: number;
    category_name: string;
}

export default function FaqForm({
    faq,
    categories,
}: {
    faq: FaqRecord | null;
    categories: FaqCategoryOption[];
}) {
    /*
     * A question is filed under a category the clinic already has, or under a
     * name typed in here. Only one of the two controls is on screen, so only
     * one of the two is ever sent.
     */
    const [creatingCategory, setCreatingCategory] = useState(false);

    const { data, setData, post, processing, errors, transform } = useForm({
        question: faq?.question ?? '',
        answer: faq?.answer ?? '',
        faq_category_id: faq ? String(faq.faq_category_id) : '',
        new_category: '',
        is_published: faq?.is_published ?? true,
    });

    const switchCategoryMode = () => {
        setCreatingCategory((current) => !current);
        setData({
            ...data,
            faq_category_id: '',
            new_category: '',
        });
    };

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        if (faq) {
            transform((formData) => ({ ...formData, _method: 'patch' }));
            post(route('admin.faqs.update', faq.id));
        } else {
            post(route('admin.faqs.store'));
        }
    };

    return (
        <form onSubmit={submit} className="space-y-8">
            <div className="space-y-5">
                <Field
                    label="Question"
                    name="question"
                    value={data.question}
                    onChange={(event) => setData('question', event.target.value)}
                    error={errors.question}
                    maxLength={255}
                    placeholder="How do I book a visit?"
                    hint="Written the way a client would ask it."
                    required
                    autoFocus
                />

                <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <label htmlFor="faq_category_id" className={labelClass}>
                            Category
                        </label>
                        <button
                            type="button"
                            onClick={switchCategoryMode}
                            className="rounded-full text-xs font-semibold text-[#E86A10] transition-colors duration-150 hover:text-[#d45e0d] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E86A10] focus-visible:ring-offset-2"
                        >
                            {creatingCategory
                                ? 'Pick an existing category'
                                : 'Add a new category'}
                        </button>
                    </div>

                    {creatingCategory ? (
                        <input
                            id="new_category"
                            name="new_category"
                            type="text"
                            value={data.new_category}
                            onChange={(event) =>
                                setData('new_category', event.target.value)
                            }
                            aria-invalid={errors.new_category ? true : undefined}
                            className={fieldClass}
                            placeholder="Bookings"
                            maxLength={100}
                            autoFocus
                        />
                    ) : (
                        <select
                            id="faq_category_id"
                            name="faq_category_id"
                            className={fieldClass}
                            value={data.faq_category_id}
                            onChange={(event) =>
                                setData('faq_category_id', event.target.value)
                            }
                        >
                            <option value="">Choose a category...</option>
                            {categories.map((category) => (
                                <option
                                    key={category.faq_category_id}
                                    value={category.faq_category_id}
                                >
                                    {category.category_name}
                                </option>
                            ))}
                        </select>
                    )}

                    <InputError
                        className="mt-2"
                        message={
                            creatingCategory
                                ? errors.new_category
                                : errors.faq_category_id
                        }
                    />
                    {creatingCategory && !errors.new_category && (
                        <p className="mt-1.5 text-xs text-[#1a3d1a]/45">
                            A category that already exists is reused.
                        </p>
                    )}
                </div>

                <TextAreaField
                    label="Answer"
                    name="answer"
                    rows={6}
                    value={data.answer}
                    onChange={(event) => setData('answer', event.target.value)}
                    error={errors.answer}
                    maxLength={2000}
                    placeholder="Open Services, pick the care your dog needs, then choose a day and time..."
                    hint="This is the text clients read in the portal's help panel."
                    required
                />
            </div>

            <label className="flex cursor-pointer items-start gap-2.5">
                <input
                    type="checkbox"
                    className={`mt-0.5 ${checkboxClass}`}
                    checked={data.is_published}
                    onChange={(event) =>
                        setData('is_published', event.target.checked)
                    }
                />
                <span className="text-sm font-semibold text-[#1a3d1a]">
                    Publish this question
                    <span className="mt-0.5 block text-xs font-normal leading-relaxed text-[#1a3d1a]/50">
                        Unpublished questions stay drafts — the clinic can read
                        them, clients cannot.
                    </span>
                </span>
            </label>

            <div className="flex flex-wrap items-center gap-3 border-t border-[#1a3d1a]/10 pt-6">
                <button
                    type="submit"
                    disabled={processing}
                    className={primaryButtonClass}
                >
                    {processing ? (
                        <Spinner className="h-4 w-4" />
                    ) : (
                        <Icon name="check" className="h-4 w-4" />
                    )}
                    {faq ? 'Save question' : 'Add question'}
                </button>
                <a href={route('admin.faqs.index')} className={secondaryButtonClass}>
                    Cancel
                </a>
            </div>
        </form>
    );
}
