<?php

use App\Models\DogOwner;
use App\Models\Faq;
use App\Models\FaqCategory;

/*
 * The clinic's own help copy.
 *
 * The FAQ chat can only be as good as what the desk has published, so the
 * seeded questions are held to a shape — and a handful of phrasings a client
 * would actually type are checked against them, because a help list nobody can
 * find the answer in is the same as no help list at all.
 */

beforeEach(fn () => $this->seed());

test('the help list covers every part of the portal', function () {
    expect(Faq::where('is_published', true)->count())->toBeGreaterThanOrEqual(25);

    $areas = FaqCategory::query()->has('faqs')->pluck('category_name');

    foreach (['Bookings', 'Visits', 'Billing', 'Reviews', 'Account', 'Get in touch'] as $area) {
        expect($areas)->toContain($area);
    }
});

test('every seeded question answers the thing it asks', function () {
    $questions = Faq::query()->with('category')->get();

    expect($questions)->not->toBeEmpty();

    foreach ($questions as $faq) {
        expect($faq->category)->not->toBeNull();
        // A question, not a heading: the chat reads these back to clients.
        expect($faq->question)->toMatch('/[?.]$/');
        // An answer, not a phrase: short is fine, unfinished is not.
        expect($faq->answer)->toMatch('/[.!?]$/');
        expect(mb_strlen((string) $faq->answer))->toBeGreaterThan(25);
    }
});

test('the same question is not published twice in one category', function () {
    $questions = Faq::where('is_published', true)->get(['faq_category_id', 'question']);

    $distinct = $questions
        ->unique(fn (Faq $faq): string => $faq->faq_category_id.'|'.$faq->question)
        ->count();

    expect($questions)->toHaveCount($distinct);
});

test('the chat answers the questions clients actually type', function () {
    $owner = DogOwner::factory()->create();

    $phrasings = [
        'how do i cancel my appointment' => 'Can I cancel a booking?',
        'can i move my visit to another day' => 'Can I move a booking to another day?',
        'do you accept gcash' => 'Which payment methods do you accept?',
        'can i stay with my dog during the visit' => 'Can I stay with my dog?',
        'i forgot my password' => 'I forgot my password.',
        'how do i add a second dog' => 'How do I add another dog?',
        'what does the booster due badge mean' => 'What does the Booster due badge mean?',
        'where do the clinic messages appear' => 'Where do the messages from the clinic appear?',
        'how do i complain about a visit' => 'How do I complain about a visit?',
    ];

    foreach ($phrasings as $asked => $expected) {
        $this->actingAs($owner)
            ->postJson(route('owner.faqs.ask'), ['message' => $asked])
            ->assertOk()
            ->assertJsonPath('found', true)
            ->assertJsonPath('matches.0.question', $expected);
    }
});

test('the chat admits when the clinic has not answered something yet', function () {
    $owner = DogOwner::factory()->create();

    // Nothing in the help list mentions these, and answering them from a
    // half-matching question would be worse than saying so.
    foreach (['do you sell aquarium gravel', 'how much is a consultation', 'is there parking at the clinic'] as $asked) {
        $this->actingAs($owner)
            ->postJson(route('owner.faqs.ask'), ['message' => $asked])
            ->assertOk()
            ->assertJsonPath('found', false)
            ->assertJsonCount(0, 'matches');
    }
});
