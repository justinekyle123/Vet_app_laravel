<?php

namespace App\Services\Faqs;

use App\Models\DogOwner;
use App\Models\Faq;
use Illuminate\Support\Collection;

/**
 * The answers behind the portal's FAQ chat.
 *
 * A client does not read a help centre in order; they type a question and
 * expect the desk's answer back. This matches what they wrote against the
 * questions the clinic has published, and answers only when the clinic has
 * actually said something about it — a wrong answer is worse than admitting
 * the desk has not covered it yet, which is also what sends the client to the
 * complaint thread.
 *
 * Matching is a plain word overlap with a small stemmer rather than a search
 * service: the clinic's help list is a few dozen rows, so the whole thing fits
 * in one query and every answer stays traceable to a row an admin wrote.
 */
class FaqAssistant
{
    /**
     * Words too common to tell one question from another. Without these, "Do
     * you…" and "Can I…" match everything.
     */
    private const STOP_WORDS = [
        'about', 'after', 'again', 'all', 'also', 'and', 'any', 'are', 'because',
        'been', 'before', 'being', 'but', 'can', 'cant', 'clinic', 'could', 'did', 'does',
        'doing', 'done', 'dont', 'for', 'from', 'get', 'got', 'had', 'has',
        'have', 'how', 'into', 'its', 'just', 'know', 'let', 'like', 'may',
        'mine', 'much', 'must', 'need', 'not', 'now', 'off', 'one', 'only',
        'our', 'out', 'over', 'own', 'please', 'say', 'should', 'some', 'still',
        'such', 'take', 'tell', 'than', 'that', 'the', 'their', 'them', 'then',
        'there', 'these', 'they', 'this', 'those', 'want', 'was', 'were', 'what',
        'when', 'where', 'which', 'while', 'who', 'why', 'will', 'with', 'would',
        'you', 'your', 'yours',
    ];

    /** How many published answers one question may surface. */
    private const MATCH_LIMIT = 3;

    /** Related questions offered on the opener and after an answer. */
    private const QUESTION_LIMIT = 4;

    /**
     * How much of what the client asked an answer has to cover before it is
     * offered. Under this the chat says it does not know rather than pointing
     * them at something unrelated.
     */
    private const CONFIDENCE_FLOOR = 0.3;

    /** Published questions, memoised so one request reads them once. */
    private ?Collection $published = null;

    /** The word sets per faq id, so a long answer is only tokenised once. */
    private array $words = [];

    /**
     * Opening the chat: a greeting in the client's own name, and what the desk
     * can actually answer.
     *
     * @return array{greeting: string, suggestions: list<array<string, mixed>>}
     */
    public function start(DogOwner $owner): array
    {
        return [
            'greeting' => sprintf(
                'Hi %s! Ask me anything about the clinic and I will answer from the questions our front desk has dealt with.',
                $owner->first_name,
            ),
            'suggestions' => $this->opener(),
        ];
    }

    /**
     * Answer one question from the clinic's published questions.
     *
     * @return array{
     *     found: bool,
     *     reply: string,
     *     matches: list<array<string, mixed>>,
     *     suggestions: list<array<string, mixed>>
     * }
     */
    public function ask(string $question): array
    {
        $asked = $this->tokens($question);

        if ($asked === []) {
            return $this->unknown();
        }

        $scored = $this->published()
            ->map(fn (Faq $faq): array => [
                'faq' => $faq,
                ...$this->match($asked, $faq),
            ])
            ->filter(fn (array $hit): bool => $hit['score'] >= self::CONFIDENCE_FLOOR
                // A single word that only turns up somewhere in an answer is
                // not enough to answer with: the desk has to have asked the
                // question, or said enough of it to be sure.
                && ($hit['question_hits'] > 0 || $hit['answer_hits'] > 1))
            ->sortBy([['score', 'desc'], ['faq.faq_id', 'asc']])
            ->values();

        if ($scored->isEmpty()) {
            return $this->unknown();
        }

        $matches = $scored->take(self::MATCH_LIMIT);
        $asked_ids = $matches->pluck('faq.faq_id')->all();

        return [
            'found' => true,
            'reply' => $matches->count() === 1
                ? 'Here is what the clinic says:'
                : 'A few of the clinic\'s questions touch on that:',
            'matches' => $matches
                ->map(fn (array $hit): array => $this->present($hit['faq'], (float) $hit['score']))
                ->all(),
            'suggestions' => $this->related($matches->first()['faq'], $asked_ids),
        ];
    }

    /**
     * The questions the chat opens with: one from each category first, so the
     * client sees the range of things the desk answers rather than four
     * questions about bookings.
     *
     * @return list<array<string, mixed>>
     */
    private function opener(): array
    {
        $published = $this->published();

        $picked = $published
            ->unique('faq_category_id')
            ->take(self::QUESTION_LIMIT);

        if ($picked->count() < self::QUESTION_LIMIT) {
            $picked = $picked->concat(
                $published
                    ->whereNotIn('faq_id', $picked->pluck('faq_id')->all())
                    ->take(self::QUESTION_LIMIT - $picked->count()),
            );
        }

        return $picked
            ->map(fn (Faq $faq): array => $this->question($faq))
            ->values()
            ->all();
    }

    /**
     * What to offer next: the rest of the category the best answer came from,
     * topped up with anything else the desk has published.
     *
     * @param  list<int>  $exclude
     * @return list<array<string, mixed>>
     */
    private function related(Faq $source, array $exclude): array
    {
        $same_category = $this->published()
            ->where('faq_category_id', $source->faq_category_id)
            ->whereNotIn('faq_id', $exclude);

        $picked = $same_category->take(self::QUESTION_LIMIT);

        if ($picked->count() < self::QUESTION_LIMIT) {
            $picked = $picked->concat(
                $this->published()
                    ->whereNotIn('faq_id', [...$exclude, ...$picked->pluck('faq_id')->all()])
                    ->take(self::QUESTION_LIMIT - $picked->count()),
            );
        }

        return $picked
            ->map(fn (Faq $faq): array => $this->question($faq))
            ->values()
            ->all();
    }

    /**
     * When the clinic has published nothing that covers the question. The
     * client is offered the opener again so the chat stays useful, and the
     * panel turns this into "send it to the clinic instead".
     *
     * @return array{found: bool, reply: string, matches: list<array<string, mixed>>, suggestions: list<array<string, mixed>>}
     */
    private function unknown(): array
    {
        return [
            'found' => false,
            'reply' => 'I could not find that in the questions our front desk has answered. Send it to the clinic and someone will reply to you here.',
            'matches' => [],
            'suggestions' => $this->opener(),
        ];
    }

    /**
     * How much of the client's question one published answer covers, 0 to 1,
     * with the two kinds of hit kept apart for the caller to judge.
     *
     * A word from the question itself is what they are asking about; a word
     * that only appears in the answer is a hint. Dividing by the client's own
     * word count means a long answer cannot win by being long.
     *
     * @param  list<string>  $asked
     * @return array{score: float, question_hits: int, answer_hits: int}
     */
    private function match(array $asked, Faq $faq): array
    {
        $words = $this->wordsFor($faq);
        $question_hits = 0;
        $answer_hits = 0;

        foreach ($asked as $token) {
            if (in_array($token, $words['question'], true)) {
                $question_hits++;
            } elseif (in_array($token, $words['answer'], true)) {
                $answer_hits++;
            }
        }

        return [
            'score' => ($question_hits * 3 + $answer_hits) / (count($asked) * 3),
            'question_hits' => $question_hits,
            'answer_hits' => $answer_hits,
        ];
    }

    /**
     * The significant words in a piece of text, stemmed and de-duplicated.
     *
     * @return list<string>
     */
    private function tokens(string $text): array
    {
        $words = preg_split('/[^a-z0-9]+/', mb_strtolower($text)) ?: [];
        $tokens = [];

        foreach ($words as $word) {
            if (mb_strlen($word) < 3 || in_array($word, self::STOP_WORDS, true)) {
                continue;
            }

            $tokens[] = $this->stem($word);
        }

        return array_values(array_unique($tokens));
    }

    /**
     * A deliberately small stemmer: enough that "book" finds "bookings" and
     * "cancel" finds "cancelling", without the weight of a real one.
     */
    private function stem(string $word): string
    {
        if (str_ends_with($word, 'ies') && mb_strlen($word) > 4) {
            return mb_substr($word, 0, -3).'y';
        }

        if (str_ends_with($word, 'ing') && mb_strlen($word) > 5) {
            $word = mb_substr($word, 0, -3);
        } elseif (str_ends_with($word, 'ed') && mb_strlen($word) > 4) {
            $word = mb_substr($word, 0, -2);
        } elseif (
            str_ends_with($word, 's')
            && ! str_ends_with($word, 'ss')
            && mb_strlen($word) > 3
        ) {
            $word = mb_substr($word, 0, -1);
        }

        // "cancelling" loses its ending and leaves "cancell", which is not how
        // the question spells it.
        if (preg_match('/(.)\1$/', $word) === 1) {
            $word = mb_substr($word, 0, -1);
        }

        return $word;
    }

    /**
     * @return array{question: list<string>, answer: list<string>}
     */
    private function wordsFor(Faq $faq): array
    {
        return $this->words[$faq->faq_id] ??= [
            'question' => $this->tokens($faq->question),
            'answer' => $this->tokens($faq->answer),
        ];
    }

    /**
     * Everything the clinic has published, read once per request.
     *
     * @return Collection<int, Faq>
     */
    private function published(): Collection
    {
        return $this->published ??= Faq::query()
            ->where('is_published', true)
            ->with('category:faq_category_id,category_name')
            ->orderBy('faq_id')
            ->get();
    }

    /**
     * @return array{id: int, question: string}
     */
    private function question(Faq $faq): array
    {
        return [
            'id' => $faq->faq_id,
            'question' => $faq->question,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function present(Faq $faq, float $score): array
    {
        return [
            'id' => $faq->faq_id,
            'question' => $faq->question,
            'answer' => $faq->answer,
            'category' => $faq->category?->category_name,
            'score' => round($score, 2),
        ];
    }
}
