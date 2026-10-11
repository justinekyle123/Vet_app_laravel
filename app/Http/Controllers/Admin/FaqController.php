<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SaveFaqRequest;
use App\Models\Faq;
use App\Models\FaqCategory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The clinic's side of the help questions the portal shows behind its floating
 * FAQ button.
 *
 * A question is a draft until the clinic publishes it, so an answer can be
 * written before any client reads it. Unlike a service, a question has nothing
 * hanging off it, so deleting one costs no history.
 */
class FaqController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Admin/FaqCreate', [
            'categories' => $this->categories(),
        ]);
    }

    public function edit(Faq $faq): Response
    {
        return Inertia::render('Admin/FaqEdit', [
            'faq' => [
                'id' => $faq->faq_id,
                'question' => $faq->question,
                'answer' => $faq->answer,
                'faq_category_id' => $faq->faq_category_id,
                'category_name' => $faq->category?->category_name,
                'is_published' => $faq->is_published,
            ],
            'categories' => $this->categories(),
        ]);
    }

    public function index(Request $request): Response
    {
        /*
         * Both filters are applied in the query so they span the whole help
         * list, not just the page currently in view.
         */
        $filter = (string) $request->query('filter', 'all');

        if (! in_array($filter, ['all', 'published', 'drafts'], true)) {
            $filter = 'all';
        }

        $search = trim((string) $request->query('search', ''));

        return Inertia::render('Admin/Faqs', [
            'faqs' => Faq::query()
                ->with('category:faq_category_id,category_name')
                ->when($filter === 'published', fn (Builder $query) => $query->where('is_published', true))
                ->when($filter === 'drafts', fn (Builder $query) => $query->where('is_published', false))
                ->when($search !== '', fn (Builder $query) => $query->where(
                    fn (Builder $questions) => $questions
                        ->where('question', 'like', "%{$search}%")
                        ->orWhere('answer', 'like', "%{$search}%")
                ))
                ->orderBy('faq_category_id')
                ->orderBy('question')
                ->paginate(10)
                ->withQueryString()
                ->through(fn (Faq $faq): array => [
                    'id' => $faq->faq_id,
                    'question' => $faq->question,
                    'answer' => $faq->answer,
                    'category_name' => $faq->category?->category_name,
                    'is_published' => $faq->is_published,
                    'updated_at' => $faq->updated_at?->toDateString(),
                ]),
            'filters' => [
                'filter' => $filter,
                'search' => $search,
            ],
            'counts' => [
                'published' => Faq::query()->where('is_published', true)->count(),
                'drafts' => Faq::query()->where('is_published', false)->count(),
                'total' => Faq::query()->count(),
            ],
        ]);
    }

    public function store(SaveFaqRequest $request): RedirectResponse
    {
        Faq::create($this->payload($request));

        return redirect()
            ->route('admin.faqs.index')
            ->with('status', 'faq-created');
    }

    public function update(SaveFaqRequest $request, Faq $faq): RedirectResponse
    {
        $faq->update($this->payload($request));

        return redirect()
            ->route('admin.faqs.index')
            ->with('status', 'faq-updated');
    }

    /**
     * Publish a finished answer to the portal, or pull it back to a draft.
     */
    public function toggle(Faq $faq): RedirectResponse
    {
        $faq->update(['is_published' => ! $faq->is_published]);

        return redirect()
            ->route('admin.faqs.index')
            ->with(
                'status',
                $faq->is_published ? 'faq-published' : 'faq-unpublished',
            );
    }

    public function destroy(Faq $faq): RedirectResponse
    {
        $faq->delete();

        return redirect()
            ->route('admin.faqs.index')
            ->with('status', 'faq-deleted');
    }

    /**
     * The columns a question is written from, with its category resolved.
     *
     * @return array<string, mixed>
     */
    private function payload(SaveFaqRequest $request): array
    {
        return [
            'question' => trim((string) $request->input('question')),
            'answer' => trim((string) $request->input('answer')),
            'faq_category_id' => $this->categoryId($request),
            'is_published' => $request->boolean('is_published'),
        ];
    }

    /**
     * The category a question is filed under: an existing one by id, or a new
     * one by name. Category names are unique, so filing a second question under
     * a name that already exists reuses that category rather than failing.
     */
    private function categoryId(SaveFaqRequest $request): int
    {
        $newName = trim((string) $request->input('new_category', ''));

        if ($newName !== '') {
            return FaqCategory::firstOrCreate(['category_name' => $newName])->faq_category_id;
        }

        return $request->integer('faq_category_id');
    }

    /** @return list<array{faq_category_id: int, category_name: string}> */
    private function categories(): array
    {
        return FaqCategory::query()
            ->orderBy('category_name')
            ->get(['faq_category_id', 'category_name'])
            ->map(fn (FaqCategory $category): array => [
                'faq_category_id' => $category->faq_category_id,
                'category_name' => $category->category_name,
            ])
            ->all();
    }
}
