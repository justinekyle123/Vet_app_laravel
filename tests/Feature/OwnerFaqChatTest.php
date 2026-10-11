<?php

use App\Models\DogOwner;
use App\Models\Faq;
use App\Models\FaqCategory;
use App\Models\Staff;

/*
 * The portal's FAQ chat: a client asks in their own words and is answered out
 * of the questions the clinic has actually published. Every expectation here
 * is scoped to published rows, so an admin's draft is never spoken back to a
 * client as if the clinic had said it.
 */

/** A published question in the given category, with words worth matching on. */
function publish(string $question, string $answer, FaqCategory $category): Faq
{
    return Faq::factory()
        ->for($category, 'category')
        ->create(['question' => $question, 'answer' => $answer]);
}

test('opening the chat greets the client and offers questions to tap', function () {
    $bookings = FaqCategory::factory()->create(['category_name' => 'Bookings']);
    $billing = FaqCategory::factory()->create(['category_name' => 'Billing']);

    publish('Can I cancel a booking?', 'Yes, from your appointments page.', $bookings);
    publish('How far ahead can I book?', 'Up to eight weeks in advance.', $bookings);
    publish('Do you take walk-ins?', 'When a veterinarian is free.', $bookings);
    publish('When do I pay?', 'At the desk when you arrive.', $billing);
    Faq::factory()->draft()->create(['question' => 'Do you offer a loyalty discount?']);

    $this->actingAs(DogOwner::factory()->create(['first_name' => 'Ana']))
        ->getJson(route('owner.faqs.chat'))
        ->assertOk()
        ->assertJsonPath('greeting', fn (string $greeting): bool => str_contains($greeting, 'Ana'))
        // One from each category first, so the opener shows the range of
        // things the desk answers, then the rest of the list.
        ->assertJsonPath('suggestions.0.question', 'Can I cancel a booking?')
        ->assertJsonPath('suggestions.1.question', 'When do I pay?')
        ->assertJsonCount(4, 'suggestions')
        ->assertJsonPath('suggestions', fn (array $suggestions): bool => collect($suggestions)
            ->doesntContain(fn (array $suggestion): bool => $suggestion['question'] === 'Do you offer a loyalty discount?'));
});

test('asking a question the clinic has answered returns that answer', function () {
    $bookings = FaqCategory::factory()->create(['category_name' => 'Bookings']);
    $grooming = FaqCategory::factory()->create(['category_name' => 'Grooming']);

    publish(
        'Can I cancel a booking?',
        'Yes. Open your appointments page and cancel from the visit itself.',
        $bookings,
    );
    publish('How long is a grooming visit?', 'A full groom takes about ninety minutes.', $grooming);

    $this->actingAs(DogOwner::factory()->create())
        ->postJson(route('owner.faqs.ask'), ['message' => 'how do I cancel a booking?'])
        ->assertOk()
        ->assertJsonPath('found', true)
        // The client asked in their own words; the desk's own wording comes back.
        ->assertJsonPath('matches.0.question', 'Can I cancel a booking?')
        ->assertJsonPath(
            'matches.0.answer',
            'Yes. Open your appointments page and cancel from the visit itself.',
        )
        ->assertJsonPath('matches.0.category', 'Bookings');
});

test('a word that only appears in an answer still finds the question', function () {
    publish(
        'Do you take walk-ins?',
        'Yes, when a veterinarian is free between booked visits.',
        FaqCategory::factory()->create(['category_name' => 'Opening hours']),
    );

    $this->actingAs(DogOwner::factory()->create())
        ->postJson(route('owner.faqs.ask'), ['message' => 'walk in'])
        ->assertOk()
        ->assertJsonPath('found', true)
        ->assertJsonPath('matches.0.question', 'Do you take walk-ins?');
});

test('the chat says it does not know rather than offering something unrelated', function () {
    publish(
        'Can I cancel a booking?',
        'Yes. Open your appointments page and cancel from the visit itself.',
        FaqCategory::factory()->create(['category_name' => 'Bookings']),
    );

    $this->actingAs(DogOwner::factory()->create())
        ->postJson(route('owner.faqs.ask'), ['message' => 'do you sell aquarium gravel'])
        ->assertOk()
        ->assertJsonPath('found', false)
        ->assertJsonCount(0, 'matches')
        ->assertJsonPath('reply', fn (string $reply): bool => str_contains($reply, 'front desk'));
});

test('a draft answer is never spoken back to a client', function () {
    Faq::factory()->draft()->create([
        'question' => 'Do you offer a loyalty discount?',
        'answer' => 'Yes, every tenth visit is free.',
    ]);

    // The only published question is about something else entirely, so the
    // client's question has to come back unanswered.
    publish(
        'How long is a grooming visit?',
        'A full groom takes about ninety minutes.',
        FaqCategory::factory()->create(['category_name' => 'Grooming']),
    );

    $this->actingAs(DogOwner::factory()->create())
        ->postJson(route('owner.faqs.ask'), ['message' => 'is there a loyalty discount?'])
        ->assertOk()
        ->assertJsonPath('found', false)
        ->assertJsonCount(0, 'matches');
});

test('the answer already given is not offered again as a follow-up', function () {
    $bookings = FaqCategory::factory()->create(['category_name' => 'Bookings']);
    $grooming = FaqCategory::factory()->create(['category_name' => 'Grooming']);

    publish('Can I cancel a booking?', 'Yes, from your appointments page.', $bookings);
    publish('Who do I call for a vaccination record?', 'The front desk can print it.', $bookings);
    publish('Do you groom cats?', 'Dogs only, I am afraid.', $grooming);

    $this->actingAs(DogOwner::factory()->create())
        ->postJson(route('owner.faqs.ask'), ['message' => 'cancel a booking'])
        ->assertOk()
        ->assertJsonPath('matches.0.question', 'Can I cancel a booking?')
        ->assertJsonCount(1, 'matches')
        // The rest of the category is what to tap next, then anything else the
        // desk has published.
        ->assertJsonPath('suggestions.0.question', 'Who do I call for a vaccination record?')
        ->assertJsonPath('suggestions.1.question', 'Do you groom cats?')
        ->assertJsonCount(2, 'suggestions');
});

test('the chat only runs on the portal and a question needs some words', function () {
    $this->actingAs(Staff::factory()->veterinarian()->create())
        ->postJson(route('owner.faqs.ask'), ['message' => 'anything?'])
        ->assertForbidden();

    $this->actingAs(Staff::factory()->veterinarian()->create())
        ->getJson(route('owner.faqs.chat'))
        ->assertForbidden();

    $this->actingAs(DogOwner::factory()->create())
        ->postJson(route('owner.faqs.ask'), ['message' => ''])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('message');
});

test('a question made only of filler words is treated as unanswerable', function () {
    publish(
        'Can I cancel a booking?',
        'Yes, from your appointments page.',
        FaqCategory::factory()->create(['category_name' => 'Bookings']),
    );

    $this->actingAs(DogOwner::factory()->create())
        ->postJson(route('owner.faqs.ask'), ['message' => 'can you do it for me?'])
        ->assertOk()
        ->assertJsonPath('found', false)
        ->assertJsonCount(0, 'matches');
});
