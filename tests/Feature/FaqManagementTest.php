<?php

use App\Models\DogOwner;
use App\Models\Faq;
use App\Models\FaqCategory;
use App\Models\Staff;
use Inertia\Testing\AssertableInertia as Assert;

test('an admin can view the help list with its counts', function () {
    Faq::factory()->count(2)->create();
    Faq::factory()->draft()->create();

    $this->actingAs(Staff::factory()->admin()->create())
        ->get(route('admin.faqs.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Faqs')
            ->has('faqs.data', 3)
            ->where('faqs.total', 3)
            ->where('counts.published', 2)
            ->where('counts.drafts', 1)
        );
});

test('the help list can be filtered by draft and searched', function () {
    $bookings = FaqCategory::factory()->create(['category_name' => 'Bookings']);
    Faq::factory()->for($bookings, 'category')->create([
        'question' => 'Can I cancel a booking?',
        'answer' => 'Yes, from your appointments page.',
    ]);
    $draft = Faq::factory()->draft()->for($bookings, 'category')->create([
        'question' => 'How do refunds work?',
        'answer' => 'The desk refunds to the original payment method.',
    ]);

    $admin = Staff::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.faqs.index', ['filter' => 'drafts']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('faqs.data', 1)
            ->where('faqs.data.0.id', $draft->faq_id)
            ->where('filters.filter', 'drafts')
        );

    // The search spans the answer text, not just the question.
    $this->actingAs($admin)
        ->get(route('admin.faqs.index', ['search' => 'refunds']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('faqs.data', 1)
            ->where('faqs.data.0.id', $draft->faq_id)
            ->where('filters.search', 'refunds')
        );
});

test('an admin can open separate FAQ create and edit pages', function () {
    $faq = Faq::factory()->create();
    $admin = Staff::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.faqs.create'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/FaqCreate')
            ->has('categories')
        );

    $this->actingAs($admin)
        ->get(route('admin.faqs.edit', $faq))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/FaqEdit')
            ->where('faq.id', $faq->faq_id)
            ->where('faq.question', $faq->question)
            ->has('categories')
        );
});

test('an admin can add a question to an existing category', function () {
    $category = FaqCategory::factory()->create();

    $this->actingAs(Staff::factory()->admin()->create())
        ->post(route('admin.faqs.store'), [
            'question' => 'Can I book for two dogs at once?',
            'answer' => 'Book one visit per dog so each gets its own slot.',
            'faq_category_id' => $category->faq_category_id,
            'is_published' => true,
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('admin.faqs.index'));

    $faq = Faq::where('question', 'Can I book for two dogs at once?')->firstOrFail();

    expect($faq->faq_category_id)->toBe($category->faq_category_id)
        ->and($faq->is_published)->toBeTrue();
});

test('a new question can name a category that does not exist yet', function () {
    $this->actingAs(Staff::factory()->admin()->create())
        ->post(route('admin.faqs.store'), [
            'question' => 'Do you take walk-ins?',
            'answer' => 'Yes, when a vet is free between booked visits.',
            'new_category' => 'Opening hours',
            'is_published' => false,
        ])
        ->assertSessionHasNoErrors();

    $faq = Faq::where('question', 'Do you take walk-ins?')->firstOrFail();

    expect($faq->category->category_name)->toBe('Opening hours')
        ->and($faq->is_published)->toBeFalse();
});

test('naming a category that already exists reuses it', function () {
    $existing = FaqCategory::factory()->create(['category_name' => 'Visits']);

    $this->actingAs(Staff::factory()->admin()->create())
        ->post(route('admin.faqs.store'), [
            'question' => 'How long is a visit?',
            'answer' => 'Each service lists its own length on the menu.',
            'new_category' => 'Visits',
            'is_published' => true,
        ])
        ->assertSessionHasNoErrors();

    $faq = Faq::where('question', 'How long is a visit?')->firstOrFail();

    expect(FaqCategory::where('category_name', 'Visits')->count())->toBe(1)
        ->and($faq->faq_category_id)->toBe($existing->faq_category_id);
});

test('a question needs a question, an answer, and a category', function () {
    $this->actingAs(Staff::factory()->admin()->create())
        ->from(route('admin.faqs.index'))
        ->post(route('admin.faqs.store'), [])
        ->assertSessionHasErrors(['question', 'answer', 'faq_category_id']);
});

test('an admin can reword a question and move it to another category', function () {
    $original = FaqCategory::factory()->create();
    $other = FaqCategory::factory()->create();
    $faq = Faq::factory()->for($original, 'category')->create([
        'question' => 'Old question?',
    ]);

    $this->actingAs(Staff::factory()->admin()->create())
        ->patch(route('admin.faqs.update', $faq), [
            'question' => 'New question?',
            'answer' => 'A clearer answer.',
            'faq_category_id' => $other->faq_category_id,
            'is_published' => false,
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('admin.faqs.index'));

    $updated = $faq->fresh();

    expect($updated->question)->toBe('New question?')
        ->and($updated->answer)->toBe('A clearer answer.')
        ->and($updated->faq_category_id)->toBe($other->faq_category_id)
        ->and($updated->is_published)->toBeFalse();
});

test('publishing a question puts it in front of clients and unpublishing hides it', function () {
    $faq = Faq::factory()->draft()->create(['question' => 'Do you groom cats?']);
    $admin = Staff::factory()->admin()->create();

    $this->actingAs($admin)
        ->patch(route('admin.faqs.toggle', $faq))
        ->assertRedirect(route('admin.faqs.index'));

    expect($faq->fresh()->is_published)->toBeTrue();

    $this->actingAs(DogOwner::factory()->create())
        ->getJson(route('owner.faqs'))
        ->assertOk()
        ->assertJsonPath('categories.0.faqs.0.question', 'Do you groom cats?');

    $this->actingAs($admin)
        ->patch(route('admin.faqs.toggle', $faq))
        ->assertRedirect(route('admin.faqs.index'));

    expect($faq->fresh()->is_published)->toBeFalse();

    $this->actingAs(DogOwner::factory()->create())
        ->getJson(route('owner.faqs'))
        ->assertOk()
        ->assertJsonCount(0, 'categories');
});

test('an admin can delete a question', function () {
    $faq = Faq::factory()->create();

    $this->actingAs(Staff::factory()->admin()->create())
        ->delete(route('admin.faqs.destroy', $faq))
        ->assertRedirect(route('admin.faqs.index'));

    expect(Faq::find($faq->faq_id))->toBeNull();
});

test('veterinarian profiles cannot manage help questions', function () {
    $faq = Faq::factory()->create();
    $vet = Staff::factory()->veterinarian()->create();

    $this->actingAs($vet)
        ->get(route('admin.faqs.index'))
        ->assertForbidden();

    $this->actingAs($vet)
        ->post(route('admin.faqs.store'), [
            'question' => 'Sneaky question?',
            'answer' => 'Sneaky answer.',
            'faq_category_id' => FaqCategory::factory()->create()->faq_category_id,
        ])
        ->assertForbidden();

    $this->actingAs($vet)
        ->patch(route('admin.faqs.toggle', $faq))
        ->assertForbidden();

    $this->actingAs($vet)
        ->delete(route('admin.faqs.destroy', $faq))
        ->assertForbidden();

    expect($faq->fresh()->is_published)->toBeTrue();
});
