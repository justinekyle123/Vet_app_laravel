<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Faq;
use App\Models\FaqCategory;
use Illuminate\Http\JsonResponse;

/**
 * The help questions behind the portal's floating FAQ button.
 *
 * Only published questions reach a client, and they are grouped by the clinic's
 * own categories so the answers read in the order the front desk arranged them.
 * Categories with nothing published are dropped rather than shown empty.
 */
class FaqController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $categories = FaqCategory::query()
            ->with(['faqs' => fn ($query) => $query
                ->where('is_published', true)
                ->orderBy('faq_id')])
            ->orderBy('faq_category_id')
            ->get()
            ->filter(fn (FaqCategory $category): bool => $category->faqs->isNotEmpty())
            ->map(fn (FaqCategory $category): array => [
                'name' => $category->category_name,
                'faqs' => $category->faqs
                    ->map(fn (Faq $faq): array => [
                        'id' => $faq->faq_id,
                        'question' => $faq->question,
                        'answer' => $faq->answer,
                    ])
                    ->values()
                    ->all(),
            ])
            ->values()
            ->all();

        return response()->json(['categories' => $categories]);
    }
}
