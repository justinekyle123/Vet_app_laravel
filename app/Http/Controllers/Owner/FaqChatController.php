<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Http\Requests\Owner\AskFaqRequest;
use App\Models\DogOwner;
use App\Services\Faqs\FaqAssistant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The FAQ chat behind the portal's floating help button.
 *
 * Both endpoints answer JSON rather than Inertia pages: the panel is a
 * conversation that stays open while the client writes, so a page visit
 * between sentences would be the wrong shape for it.
 */
class FaqChatController extends Controller
{
    /**
     * Opening the chat: the greeting, and the questions the desk can answer.
     */
    public function start(Request $request, FaqAssistant $assistant): JsonResponse
    {
        /** @var DogOwner $owner */
        $owner = $request->user();

        return response()->json($assistant->start($owner));
    }

    /**
     * Answer one question from the clinic's published questions.
     */
    public function ask(AskFaqRequest $request, FaqAssistant $assistant): JsonResponse
    {
        return response()->json(
            $assistant->ask(trim((string) $request->validated('message'))),
        );
    }
}
