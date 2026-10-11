import Spinner from '@/Components/Spinner';
import { primaryButtonClass, secondaryButtonClass } from '@/Components/buttonStyles';
import { fieldClass, labelClass } from '@/Components/formStyles';
import {
    ComplaintPriority,
    ComplaintVisitOption,
    FaqAnswer,
    FaqChatStart,
    FaqMatch,
    FaqQuestion,
    PageProps,
    PortalComplaintThread,
    PortalFaqCategory,
} from '@/types';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import {
    ArrowLeft,
    ChevronDown,
    HelpCircle,
    MessageSquarePlus,
    RotateCcw,
    Send,
    X,
} from 'lucide-react';
import { FormEventHandler, useEffect, useRef, useState } from 'react';

/**
 * The floating help button, pinned to the bottom-right of every portal page.
 *
 * It answers the two things a client actually wants from a help button: the
 * clinic's own answers to common questions, and a way to reach a person when
 * the answer is not there. The FAQ side is a chat — the client asks in their
 * own words and is answered out of what the front desk has published, with the
 * whole list still a tap away — and the complaint side is a real conversation,
 * so a client can read the clinic's reply and write back without leaving the
 * page they were on. When the clinic has published nothing that covers a
 * question, the chat hands it straight over to a complaint.
 */

type Mode = 'faq' | 'complaints';

/** The FAQ side is a chat, with the clinic's whole list one tap away. */
type FaqView = 'chat' | 'browse';

/**
 * One bubble in the FAQ chat. The answers, and the questions to tap next, only
 * ever hang off the assistant's side.
 */
interface ChatBubble {
    id: number;
    role: 'owner' | 'assistant';
    text: string;
    /** The desk's answers, best first, in the clinic's own words. */
    matches?: FaqMatch[];
    /** Questions the client can tap to go further. */
    suggestions?: FaqQuestion[];
    /** True when nothing the clinic published covered the question. */
    unknown?: boolean;
    /** What the client asked, quoted when it is handed to the clinic. */
    asked?: string;
}

const priorityLabels: Record<ComplaintPriority, string> = {
    Low: 'Low — no rush',
    Medium: 'Medium',
    High: 'High — urgent',
};

/** A short "when" for a thread or message: the time today, else the date. */
function whenLabel(iso: string | null): string {
    if (!iso) {
        return '';
    }

    const date = new Date(iso);

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    const startOfDay = (value: Date) =>
        new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();

    const days = Math.round(
        (startOfDay(new Date()) - startOfDay(date)) / 86_400_000,
    );

    if (days === 0) {
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
        });
    }

    if (days === 1) {
        return 'Yesterday';
    }

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
}

/** The status pill for a thread, toned like the console's own markers. */
function statusTone(status: string): string {
    switch (status) {
        case 'Resolved':
        case 'Closed':
            return 'bg-[#2a5a2a]/10 text-[#2a5a2a]';
        case 'In Progress':
            return 'bg-[#E86A10]/10 text-[#E86A10]';
        default:
            return 'bg-[#1a3d1a]/10 text-[#1a3d1a]/70';
    }
}

/** The next id in a conversation, so restored bubbles never collide. */
function nextId(bubbles: ChatBubble[] | null): number {
    return Math.max(0, ...(bubbles ?? []).map((bubble) => bubble.id)) + 1;
}

/**
 * Where the client's FAQ conversation is kept between page visits. Keyed by
 * the client, so two accounts sharing a browser session never read each
 * other's chat, and capped so a long conversation cannot grow without bound.
 */
function readStoredChat(key: string): ChatBubble[] | null {
    try {
        const stored = window.sessionStorage.getItem(key);
        const bubbles: unknown = stored === null ? null : JSON.parse(stored);

        if (! Array.isArray(bubbles) || bubbles.length === 0) {
            return null;
        }

        const usable = bubbles.every(
            (bubble) =>
                typeof bubble === 'object' &&
                bubble !== null &&
                typeof (bubble as ChatBubble).role === 'string' &&
                typeof (bubble as ChatBubble).text === 'string',
        );

        return usable ? (bubbles as ChatBubble[]).slice(-40) : null;
    } catch {
        // A conversation we cannot read is simply no conversation.
        return null;
    }
}

export default function PortalHelpPanel() {
    const { auth } = usePage<PageProps>().props;
    const chatKey = `portal-faq-chat:${auth?.user?.id ?? 'guest'}`;

    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<Mode>('faq');

    /* The help articles, for the browse view. Loaded the first time it opens. */
    const [categories, setCategories] = useState<PortalFaqCategory[] | null>(
        null,
    );
    const [expanded, setExpanded] = useState<number | null>(null);

    /* The FAQ chat: the conversation, and how the desk opened it. */
    const [faqView, setFaqView] = useState<FaqView>('chat');
    const [chat, setChat] = useState<ChatBubble[] | null>(() =>
        readStoredChat(chatKey),
    );
    const [starter, setStarter] = useState<FaqChatStart | null>(null);
    const [question, setQuestion] = useState('');
    const [asking, setAsking] = useState(false);
    const [chatError, setChatError] = useState<string | null>(null);

    /* The client's complaint threads, and the visits they can point one at. */
    const [threads, setThreads] = useState<PortalComplaintThread[] | null>(null);
    const [visits, setVisits] = useState<ComplaintVisitOption[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [composing, setComposing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /* The new-complaint form. */
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<ComplaintPriority>('Medium');
    const [visitId, setVisitId] = useState('');

    /* The reply box on whichever thread is open. */
    const [reply, setReply] = useState('');
    const [replyError, setReplyError] = useState<string | null>(null);

    const threadEndRef = useRef<HTMLLIElement>(null);
    const chatEndRef = useRef<HTMLLIElement>(null);

    const selected =
        threads?.find((thread) => thread.id === selectedId) ?? null;


    /* The articles, fetched the first time the FAQ side is shown. */
    useEffect(() => {
        if (!open || mode !== 'faq' || categories !== null) {
            return;
        }

        let cancelled = false;
        setLoading(true);

        axios
            .get<{ categories: PortalFaqCategory[] }>(route('owner.faqs'))
            .then((response) => {
                if (!cancelled) {
                    setCategories(response.data.categories);
                }
            })
            .catch(() => {
                // A failed load is just an empty panel; the button still closes.
                if (!cancelled) {
                    setCategories([]);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [open, mode, categories]);

    /* The chat opener — the greeting and the questions to tap — fetched the
       first time the chat is shown. */
    useEffect(() => {
        if (!open || mode !== 'faq' || faqView !== 'chat' || chat !== null) {
            return;
        }

        let cancelled = false;
        setLoading(true);

        axios
            .get<FaqChatStart>(route('owner.faqs.chat'))
            .then((response) => {
                if (cancelled) {
                    return;
                }

                setStarter(response.data);
                setChat([
                    {
                        id: 1,
                        role: 'assistant',
                        text: response.data.greeting,
                        suggestions: response.data.suggestions,
                    },
                ]);
            })
            .catch(() => {
                if (!cancelled) {
                    setChat([
                        {
                            id: 1,
                            role: 'assistant',
                            text: 'Our help questions did not load. Please try again in a moment.',
                        },
                    ]);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [open, mode, faqView, chat]);

    /* Keep the conversation for the rest of the browser session, so moving to
       another portal page does not lose what the client just asked. */
    useEffect(() => {
        try {
            if (chat === null) {
                window.sessionStorage.removeItem(chatKey);
            } else {
                window.sessionStorage.setItem(
                    chatKey,
                    JSON.stringify(chat.slice(-40)),
                );
            }
        } catch {
            // Without storage the chat simply does not outlive the page.
        }
    }, [chat, chatKey]);

    /* The client's own threads, fetched the first time the complaint side is
       shown and refreshed after anything is sent. */
    const loadThreads = () => {
        setLoading(true);

        return axios
            .get<{ threads: PortalComplaintThread[]; visits: ComplaintVisitOption[] }>(
                route('owner.complaints.index'),
            )
            .then((response) => {
                setThreads(response.data.threads);
                setVisits(response.data.visits);
            })
            .catch(() => {
                setThreads([]);
                setError('We could not load your messages. Please try again.');
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (!open || mode !== 'complaints' || threads !== null) {
            return;
        }

        void loadThreads();
    }, [open, mode, threads]);

    /* Escape closes the panel, like the header's own dropdowns. */
    useEffect(() => {
        if (!open) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open]);

    /* A new message lands at the foot of the thread, so follow it there. */
    useEffect(() => {
        threadEndRef.current?.scrollIntoView({ block: 'nearest' });
    }, [selected?.messages.length, mode]);

    /* The same for the chat: the newest answer is the one being read. */
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ block: 'nearest' });
    }, [chat?.length, asking, faqView]);

    const switchMode = (next: Mode) => {
        setMode(next);
        setError(null);

        if (next === 'complaints') {
            setComposing(threads === null || threads.length === 0);
        }
    };

    const close = () => {
        setOpen(false);
        setError(null);
    };

    const submitComplaint: FormEventHandler = (event) => {
        event.preventDefault();
        setSending(true);
        setError(null);

        axios
            .post<{ thread: PortalComplaintThread }>(
                route('owner.complaints.store'),
                {
                    subject,
                    description,
                    priority,
                    appointment_id: visitId === '' ? null : Number(visitId),
                },
            )
            .then((response) => {
                const created = response.data.thread;

                setThreads((current) => [created, ...(current ?? [])]);
                setSelectedId(created.id);
                setComposing(false);
                setSubject('');
                setDescription('');
                setPriority('Medium');
                setVisitId('');
            })
            .catch((failure) => {
                const errors = failure?.response?.data?.errors ?? {};

                setError(
                    errors.subject?.[0] ??
                        errors.description?.[0] ??
                        'That message did not send. Please try again.',
                );
            })
            .finally(() => setSending(false));
    };

    const sendReply: FormEventHandler = (event) => {
        event.preventDefault();

        if (selected === null) {
            return;
        }

        setSending(true);
        setReplyError(null);

        axios
            .post<{ thread: PortalComplaintThread }>(
                route('owner.complaints.reply', selected.id),
                { body: reply },
            )
            .then((response) => {
                const updated = response.data.thread;

                setThreads((current) =>
                    (current ?? []).map((thread) =>
                        thread.id === updated.id ? updated : thread,
                    ),
                );
                setReply('');
            })
            .catch((failure) => {
                const errors = failure?.response?.data?.errors ?? {};

                setReplyError(
                    errors.body?.[0] ??
                        'That message did not send. Please try again.',
                );
            })
            .finally(() => setSending(false));
    };

    /**
     * Send one question and hear back. The client's own words go to the
     * matcher, and the answer is the clinic's, not the chat's.
     */
    const askQuestion = (text: string) => {
        const asked = text.trim();

        if (asked === '' || asking) {
            return;
        }

        setChat((current) => [
            ...(current ?? []),
            { id: nextId(current), role: 'owner', text: asked },
        ]);
        setQuestion('');
        setAsking(true);
        setChatError(null);

        axios
            .post<FaqAnswer>(route('owner.faqs.ask'), { message: asked })
            .then((response) => {
                const answer = response.data;

                setChat((current) => [
                    ...(current ?? []),
                    {
                        id: nextId(current),
                        role: 'assistant',
                        text: answer.reply,
                        matches: answer.matches,
                        suggestions: answer.suggestions,
                        unknown: ! answer.found,
                        asked,
                    },
                ]);
            })
            .catch(() =>
                setChatError('That question did not send. Please try again.'),
            )
            .finally(() => setAsking(false));
    };

    /**
     * Nothing published covers the question, so carry it into a complaint
     * rather than making the client type it a second time.
     */
    const handToClinic = (text: string) => {
        setSubject(text.slice(0, 150));
        setDescription(text);
        setError(null);
        setMode('complaints');
        setComposing(true);
    };

    /** Back to the greeting, for a client with a second question. */
    const startOver = () => {
        if (starter === null) {
            setChat(null);

            return;
        }

        setChat([
            {
                id: 1,
                role: 'assistant',
                text: starter.greeting,
                suggestions: starter.suggestions,
            },
        ]);
        setQuestion('');
        setChatError(null);
    };

    /* What to offer the client next, above the composer: the answers that were
       not shown in full, then the clinic's related questions — minus anything
       already asked in this conversation. */
    const lastAnswer = [...(chat ?? [])]
        .reverse()
        .find((bubble) => bubble.role === 'assistant');

    const askedAlready = new Set(
        (chat ?? [])
            .filter((bubble) => bubble.role === 'owner')
            .map((bubble) => bubble.text.toLowerCase()),
    );

    const chips = (
        lastAnswer === undefined
            ? []
            : [
                  ...(lastAnswer.matches ?? [])
                      .slice(1)
                      .map((match) => ({
                          id: match.id,
                          question: match.question,
                      })),
                  ...(lastAnswer.suggestions ?? []),
              ]
    )
        .filter(
            (suggestion, index, all) =>
                all.findIndex((other) => other.id === suggestion.id) ===
                    index &&
                ! askedAlready.has(suggestion.question.toLowerCase()),
        )
        .slice(0, 4);

    return (
        <div className="fixed bottom-5 right-4 z-40 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
            {open && (
                <div
                    id="portal-faq"
                    role="dialog"
                    aria-label="Help and complaints"
                    className="flex max-h-[75vh] w-[min(24rem,calc(100vw-2rem))] animate-dropdown flex-col overflow-hidden rounded-2xl border border-[#1a3d1a]/10 bg-white shadow-2xl shadow-[#1a3d1a]/15"
                >
                    <div className="flex items-center justify-between gap-3 border-b border-[#1a3d1a]/10 bg-[#EFFDF0]/70 px-5 py-3.5">
                        <h2 className="text-sm font-semibold text-[#1a3d1a]">
                            How can we help?
                        </h2>
                        <div className="flex items-center gap-1">
                            {mode === 'faq' && faqView === 'chat' && (
                                <button
                                    type="button"
                                    onClick={startOver}
                                    aria-label="Start a new chat"
                                    title="Start a new chat"
                                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#1a3d1a]/50 transition-colors duration-200 hover:bg-white hover:text-[#1a3d1a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]"
                                >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={close}
                                aria-label="Close help"
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#1a3d1a]/50 transition-colors duration-200 hover:bg-white hover:text-[#1a3d1a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Two ways in: read the clinic's answers, or start a
                        conversation with the clinic. */}
                    <div
                        role="tablist"
                        aria-label="Help options"
                        className="flex items-center gap-1 border-b border-[#1a3d1a]/10 bg-white p-2"
                    >
                        {(
                            [
                                { value: 'faq', label: 'Ask a question' },
                                { value: 'complaints', label: 'Complaints' },
                            ] as { value: Mode; label: string }[]
                        ).map((tab) => (
                            <button
                                key={tab.value}
                                type="button"
                                role="tab"
                                aria-selected={mode === tab.value}
                                onClick={() => switchMode(tab.value)}
                                className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a] ${
                                    mode === tab.value
                                        ? 'bg-[#1a3d1a] text-white'
                                        : 'text-[#1a3d1a]/60 hover:bg-[#EFFDF0] hover:text-[#1a3d1a]'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto p-2">
                        {mode === 'faq' &&
                            faqView === 'browse' &&
                            (loading && categories === null ? (
                                <p className="flex items-center gap-2 px-4 py-6 text-sm text-[#1a3d1a]/55">
                                    <Spinner className="h-4 w-4" />
                                    Loading questions…
                                </p>
                            ) : categories && categories.length > 0 ? (
                                categories.map((category) => (
                                    <div key={category.name} className="py-1">
                                        <p className="px-3 pb-1 pt-2 text-[0.66rem] font-bold uppercase tracking-[0.14em] text-[#1a3d1a]/40">
                                            {category.name}
                                        </p>
                                        <ul>
                                            {category.faqs.map((faq) => (
                                                <li key={faq.id}>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setExpanded(
                                                                (current) =>
                                                                    current ===
                                                                    faq.id
                                                                        ? null
                                                                        : faq.id,
                                                            )
                                                        }
                                                        aria-expanded={
                                                            expanded === faq.id
                                                        }
                                                        className="flex w-full items-start justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-150 hover:bg-[#EFFDF0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]"
                                                    >
                                                        <span className="text-sm font-medium text-[#1a3d1a]">
                                                            {faq.question}
                                                        </span>
                                                        <ChevronDown
                                                            className={`mt-0.5 h-4 w-4 shrink-0 text-[#1a3d1a]/40 transition-transform duration-200 ${
                                                                expanded ===
                                                                faq.id
                                                                    ? 'rotate-180'
                                                                    : ''
                                                            }`}
                                                        />
                                                    </button>
                                                    {expanded === faq.id && (
                                                        <p className="px-3 pb-3 text-sm leading-relaxed text-[#1a3d1a]/60">
                                                            {faq.answer}
                                                        </p>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))
                            ) : (
                                <div className="px-4 py-6">
                                    <p className="text-sm leading-relaxed text-[#1a3d1a]/55">
                                        No help articles yet.
                                    </p>
                                </div>
                            ))}

                        {/*
                         * The FAQ chat: the client's own question, then the
                         * clinic's published answer to it.
                         */}
                        {mode === 'faq' &&
                            faqView === 'chat' &&
                            (loading && chat === null ? (
                                <p className="flex items-center gap-2 px-4 py-6 text-sm text-[#1a3d1a]/55">
                                    <Spinner className="h-4 w-4" />
                                    Opening your chat…
                                </p>
                            ) : (
                                <ul className="space-y-3 px-2 py-2">
                                    {(chat ?? []).map((bubble) =>
                                        bubble.role === 'owner' ? (
                                            <li
                                                key={bubble.id}
                                                className="flex justify-end"
                                            >
                                                <p className="max-w-[85%] rounded-2xl bg-[#1a3d1a] px-3.5 py-2.5 text-sm leading-relaxed text-white">
                                                    {bubble.text}
                                                </p>
                                            </li>
                                        ) : (
                                            <li
                                                key={bubble.id}
                                                className="flex justify-start"
                                            >
                                                <div className="max-w-[92%] space-y-2">
                                                    <p className="rounded-2xl bg-[#EFFDF0] px-3.5 py-2.5 text-sm leading-relaxed text-[#1a3d1a]">
                                                        {bubble.text}
                                                    </p>

                                                    {/* The clinic's own words, as they published them. */}
                                                    {(bubble.matches ?? [])
                                                        .slice(0, 1)
                                                        .map((match) => (
                                                            <div
                                                                key={
                                                                    match.id
                                                                }
                                                                className="rounded-2xl border border-[#1a3d1a]/10 bg-white px-3.5 py-3"
                                                            >
                                                                <p className="text-sm font-semibold text-[#1a3d1a]">
                                                                    {
                                                                        match.question
                                                                    }
                                                                </p>
                                                                {match.category && (
                                                                    <span className="mt-1 inline-block rounded-full bg-[#1a3d1a]/10 px-2 py-0.5 text-[0.62rem] font-semibold text-[#1a3d1a]/55">
                                                                        {
                                                                            match.category
                                                                        }
                                                                    </span>
                                                                )}
                                                                <p className="mt-2 text-sm leading-relaxed text-[#1a3d1a]/70">
                                                                    {
                                                                        match.answer
                                                                    }
                                                                </p>
                                                            </div>
                                                        ))}

                                                    {bubble.unknown && (
                                                        <div className="rounded-2xl border border-dashed border-[#E86A10]/40 bg-white px-3.5 py-3">
                                                            <p className="text-xs leading-relaxed text-[#1a3d1a]/55">
                                                                Nobody has
                                                                written this one
                                                                down yet.
                                                            </p>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handToClinic(
                                                                        bubble.asked ??
                                                                            '',
                                                                    )
                                                                }
                                                                className={`${primaryButtonClass} mt-2 px-3 py-1.5 text-xs`}
                                                            >
                                                                <Send className="h-3.5 w-3.5" />
                                                                Ask the clinic
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </li>
                                        ),
                                    )}

                                    {asking && (
                                        <li className="flex justify-start">
                                            <span className="flex items-center gap-2 rounded-2xl bg-[#EFFDF0] px-3.5 py-2.5 text-sm text-[#1a3d1a]/55">
                                                <Spinner className="h-4 w-4" />
                                                Looking through the clinic's
                                                questions…
                                            </span>
                                        </li>
                                    )}

                                    <li ref={chatEndRef} aria-hidden="true" />
                                </ul>
                            ))}

                        {mode === 'complaints' &&
                            (selected ? (
                                /* One thread: the conversation, then a box to
                                   add to it. */
                                <div className="flex h-full flex-col">
                                    <div className="flex items-start justify-between gap-3 px-3 pb-2 pt-1">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedId(null)}
                                            className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#1a3d1a]/50 transition-colors duration-150 hover:bg-[#EFFDF0] hover:text-[#1a3d1a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]"
                                            aria-label="Back to your complaints"
                                        >
                                            <ArrowLeft className="h-4 w-4" />
                                        </button>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-[#1a3d1a]">
                                                {selected.subject}
                                            </p>
                                            <p className="mt-1 flex flex-wrap items-center gap-2 text-[0.68rem] text-[#1a3d1a]/50">
                                                <span
                                                    className={`rounded-full px-2 py-0.5 font-semibold ${statusTone(
                                                        selected.status,
                                                    )}`}
                                                >
                                                    {selected.status}
                                                </span>
                                                <span>
                                                    {priorityLabels[
                                                        selected.priority
                                                    ] ?? selected.priority}
                                                </span>
                                            </p>
                                        </div>
                                    </div>

                                    <ul className="space-y-2.5 px-2 py-2">
                                        {selected.messages.map((message) => (
                                            <li
                                                key={message.id}
                                                className={`flex ${
                                                    message.mine
                                                        ? 'justify-end'
                                                        : 'justify-start'
                                                }`}
                                            >
                                                <div
                                                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${
                                                        message.mine
                                                            ? 'bg-[#1a3d1a] text-white'
                                                            : 'bg-[#EFFDF0] text-[#1a3d1a]'
                                                    }`}
                                                >
                                                    <p className="text-sm leading-relaxed">
                                                        {message.body}
                                                    </p>
                                                    <p
                                                        className={`mt-1 text-[0.62rem] ${
                                                            message.mine
                                                                ? 'text-white/50'
                                                                : 'text-[#1a3d1a]/45'
                                                        }`}
                                                    >
                                                        {message.mine
                                                            ? 'You'
                                                            : (message.author ??
                                                              'The clinic')}
                                                        {whenLabel(message.at)
                                                            ? ` · ${whenLabel(
                                                                  message.at,
                                                              )}`
                                                            : ''}
                                                    </p>
                                                </div>
                                            </li>
                                        ))}
                                        <li ref={threadEndRef} aria-hidden="true" />
                                    </ul>

                                    <div className="border-t border-[#1a3d1a]/10 px-3 py-3">
                                        {selected.settled && (
                                            <p className="mb-2 rounded-xl bg-[#EFFDF0] px-3 py-2 text-xs leading-relaxed text-[#1a3d1a]/60">
                                                The clinic has marked this
                                                resolved. Write again and it
                                                reopens.
                                            </p>
                                        )}
                                        <form
                                            onSubmit={sendReply}
                                            className="flex items-end gap-2"
                                        >
                                            <label
                                                htmlFor="complaint-reply"
                                                className="sr-only"
                                            >
                                                Your message
                                            </label>
                                            <textarea
                                                id="complaint-reply"
                                                rows={2}
                                                value={reply}
                                                onChange={(event) =>
                                                    setReply(event.target.value)
                                                }
                                                maxLength={2000}
                                                placeholder="Write a message…"
                                                className={`${fieldClass} min-h-[2.75rem] flex-1 resize-none py-2.5 text-sm`}
                                            />
                                            <button
                                                type="submit"
                                                disabled={sending || reply.trim() === ''}
                                                aria-label="Send message"
                                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E86A10] text-white transition-colors duration-200 hover:bg-[#d45e0d] disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {sending ? (
                                                    <Spinner className="h-4 w-4" />
                                                ) : (
                                                    <Send className="h-4 w-4" />
                                                )}
                                            </button>
                                        </form>
                                        {replyError && (
                                            <p className="mt-2 text-xs text-[#b3261e]">
                                                {replyError}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : composing ? (
                                /* A new complaint. */
                                <form
                                    onSubmit={submitComplaint}
                                    className="space-y-3 px-3 py-2"
                                >
                                    <p className="text-xs leading-relaxed text-[#1a3d1a]/55">
                                        Tell the clinic what went wrong and
                                        someone will reply here.
                                    </p>

                                    <div>
                                        <label
                                            htmlFor="complaint-subject"
                                            className={labelClass}
                                        >
                                            Subject
                                        </label>
                                        <input
                                            id="complaint-subject"
                                            type="text"
                                            value={subject}
                                            onChange={(event) =>
                                                setSubject(event.target.value)
                                            }
                                            maxLength={150}
                                            required
                                            placeholder="Short title"
                                            className={`${fieldClass} py-2.5 text-sm`}
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="complaint-details"
                                            className={labelClass}
                                        >
                                            What happened?
                                        </label>
                                        <textarea
                                            id="complaint-details"
                                            rows={4}
                                            value={description}
                                            onChange={(event) =>
                                                setDescription(
                                                    event.target.value,
                                                )
                                            }
                                            maxLength={2000}
                                            required
                                            placeholder="As much detail as you can give…"
                                            className={`${fieldClass} resize-none py-2.5 text-sm`}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label
                                                htmlFor="complaint-priority"
                                                className={labelClass}
                                            >
                                                Urgency
                                            </label>
                                            <select
                                                id="complaint-priority"
                                                value={priority}
                                                onChange={(event) =>
                                                    setPriority(
                                                        event.target
                                                            .value as ComplaintPriority,
                                                    )
                                                }
                                                className={`${fieldClass} py-2.5 text-sm`}
                                            >
                                                {(
                                                    Object.keys(
                                                        priorityLabels,
                                                    ) as ComplaintPriority[]
                                                ).map((value) => (
                                                    <option
                                                        key={value}
                                                        value={value}
                                                    >
                                                        {priorityLabels[value]}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="complaint-visit"
                                                className={labelClass}
                                            >
                                                About a visit?
                                            </label>
                                            <select
                                                id="complaint-visit"
                                                value={visitId}
                                                onChange={(event) =>
                                                    setVisitId(
                                                        event.target.value,
                                                    )
                                                }
                                                className={`${fieldClass} py-2.5 text-sm`}
                                            >
                                                <option value="">
                                                    Not a specific visit
                                                </option>
                                                {visits.map((visit) => (
                                                    <option
                                                        key={visit.id}
                                                        value={visit.id}
                                                    >
                                                        {visit.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {error && (
                                        <p className="text-xs text-[#b3261e]">
                                            {error}
                                        </p>
                                    )}

                                    <div className="flex flex-wrap items-center gap-2 pt-1">
                                        <button
                                            type="submit"
                                            disabled={sending}
                                            className={`${primaryButtonClass} px-3.5 py-2 text-xs`}
                                        >
                                            {sending && (
                                                <Spinner className="h-3.5 w-3.5" />
                                            )}
                                            Send complaint
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setComposing(false)}
                                            className={`${secondaryButtonClass} px-3.5 py-2 text-xs`}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                /* The client's threads. */
                                <div className="px-1 py-1">
                                    {loading && threads === null ? (
                                        <p className="flex items-center gap-2 px-3 py-6 text-sm text-[#1a3d1a]/55">
                                            <Spinner className="h-4 w-4" />
                                            Loading your messages…
                                        </p>
                                    ) : threads && threads.length > 0 ? (
                                        <ul className="space-y-1">
                                            {threads.map((thread) => {
                                                const last =
                                                    thread.messages[
                                                        thread.messages.length -
                                                            1
                                                    ];

                                                return (
                                                    <li key={thread.id}>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setSelectedId(
                                                                    thread.id,
                                                                )
                                                            }
                                                            className="w-full rounded-xl px-3 py-2.5 text-left transition-colors duration-150 hover:bg-[#EFFDF0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]"
                                                        >
                                                            <span className="flex items-start justify-between gap-2">
                                                                <span className="text-sm font-semibold text-[#1a3d1a]">
                                                                    {
                                                                        thread.subject
                                                                    }
                                                                </span>
                                                                <span
                                                                    className={`shrink-0 rounded-full px-2 py-0.5 text-[0.62rem] font-semibold ${statusTone(
                                                                        thread.status,
                                                                    )}`}
                                                                >
                                                                    {
                                                                        thread.status
                                                                    }
                                                                </span>
                                                            </span>
                                                            {last && (
                                                                <span className="mt-1 block truncate text-xs text-[#1a3d1a]/55">
                                                                    {last.from_owner
                                                                        ? 'You: '
                                                                        : ''}
                                                                    {last.body}
                                                                </span>
                                                            )}
                                                            <span className="mt-1 block text-[0.62rem] text-[#1a3d1a]/40">
                                                                {thread.messages_count}{' '}
                                                                {thread.messages_count ===
                                                                1
                                                                    ? 'message'
                                                                    : 'messages'}
                                                                {whenLabel(
                                                                    thread.updated_at,
                                                                )
                                                                    ? ` · ${whenLabel(
                                                                          thread.updated_at,
                                                                      )}`
                                                                    : ''}
                                                            </span>
                                                        </button>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    ) : (
                                        <p className="px-3 py-6 text-sm leading-relaxed text-[#1a3d1a]/55">
                                            You have not raised a complaint.
                                            If something went wrong, tell the
                                            clinic here and they will reply.
                                        </p>
                                    )}

                                    {error && (
                                        <p className="px-3 pt-2 text-xs text-[#b3261e]">
                                            {error}
                                        </p>
                                    )}

                                    <div className="px-2 py-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setComposing(true);
                                                setError(null);
                                            }}
                                            className={`${secondaryButtonClass} w-full px-3.5 py-2 text-xs`}
                                        >
                                            <MessageSquarePlus className="h-3.5 w-3.5" />
                                            New complaint
                                        </button>
                                    </div>
                                </div>
                            ))}
                    </div>

                    {mode === 'faq' && (
                        <div className="border-t border-[#1a3d1a]/10 bg-[#EFFDF0]/40">
                            {faqView === 'chat' && (
                                <>
                                    {/* What to tap next: the clinic's other
                                        answers, offered as questions. */}
                                    {chips.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 px-3 pt-3">
                                            {chips.map((chip) => (
                                                <button
                                                    key={chip.id}
                                                    type="button"
                                                    onClick={() =>
                                                        askQuestion(
                                                            chip.question,
                                                        )
                                                    }
                                                    disabled={asking}
                                                    className="max-w-full truncate rounded-full border border-[#1a3d1a]/15 bg-white px-3 py-1.5 text-left text-xs font-medium text-[#1a3d1a]/70 transition-colors duration-150 hover:border-[#1a3d1a]/30 hover:bg-[#EFFDF0] hover:text-[#1a3d1a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a] disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {chip.question}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <form
                                        onSubmit={(event) => {
                                            event.preventDefault();
                                            askQuestion(question);
                                        }}
                                        className="flex items-center gap-2 px-3 pt-3"
                                    >
                                        <label
                                            htmlFor="faq-question"
                                            className="sr-only"
                                        >
                                            Your question
                                        </label>
                                        <input
                                            id="faq-question"
                                            type="text"
                                            value={question}
                                            onChange={(event) =>
                                                setQuestion(event.target.value)
                                            }
                                            maxLength={500}
                                            placeholder="Ask a question…"
                                            className={`${fieldClass} min-w-0 flex-1 py-2.5 text-sm`}
                                        />
                                        <button
                                            type="submit"
                                            disabled={
                                                asking ||
                                                question.trim() === ''
                                            }
                                            aria-label="Send question"
                                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E86A10] text-white transition-colors duration-200 hover:bg-[#d45e0d] disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {asking ? (
                                                <Spinner className="h-4 w-4" />
                                            ) : (
                                                <Send className="h-4 w-4" />
                                            )}
                                        </button>
                                    </form>
                                </>
                            )}

                            {chatError !== null && faqView === 'chat' && (
                                <p className="px-4 pt-2 text-xs text-[#b3261e]">
                                    {chatError}
                                </p>
                            )}

                            <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 px-4 pb-3 pt-2 text-xs leading-relaxed text-[#1a3d1a]/55">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setFaqView(
                                            faqView === 'chat' ? 'browse' : 'chat',
                                        )
                                    }
                                    className="font-semibold text-[#E86A10] underline decoration-[#E86A10]/40 underline-offset-2 transition-colors duration-150 hover:text-[#d45e0d] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E86A10]"
                                >
                                    {faqView === 'chat'
                                        ? 'Browse every question'
                                        : 'Back to the chat'}
                                </button>
                                <span aria-hidden="true">·</span>
                                <span>Can&apos;t find it?</span>
                                <button
                                    type="button"
                                    onClick={() => switchMode('complaints')}
                                    className="font-semibold text-[#E86A10] underline decoration-[#E86A10]/40 underline-offset-2 transition-colors duration-150 hover:text-[#d45e0d] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E86A10]"
                                >
                                    Send the clinic a complaint
                                </button>
                                <span>and they will reply here.</span>
                            </p>
                        </div>
                    )}
                </div>
            )}

            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-label="Help and complaints"
                aria-expanded={open}
                aria-controls="portal-faq"
                className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1a3d1a] text-white shadow-xl shadow-[#1a3d1a]/30 transition-colors duration-200 hover:bg-[#2a5a2a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a] focus-visible:ring-offset-2"
            >
                {open ? (
                    <X className="h-6 w-6" />
                ) : (
                    <HelpCircle className="h-6 w-6" />
                )}
            </button>
        </div>
    );
}
