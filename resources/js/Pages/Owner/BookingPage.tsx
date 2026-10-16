import InputError from '@/Components/InputError';
import Spinner from '@/Components/Spinner';
import OwnerLayout from '@/Layouts/OwnerLayout';
import { PageProps, PortalDog, PortalServiceSummary, ServiceAvailability } from '@/types';
import { currency } from '@/utils/format';
import { Link, useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    Check,
    ChevronLeft,
    ChevronRight,
    Clock,
    ImageUp,
    Info,
    Phone,
    Plus,
    X,
} from 'lucide-react';
import { FormEventHandler, Fragment, useEffect, useMemo, useRef, useState } from 'react';
import BookingCalendar from './Partials/BookingCalendar';

type BookableService = PortalServiceSummary & { category: string | null };
type Extra = { id: string; name: string; price: number; description: string };

const EXTRAS: Extra[] = [
    { id: 'nail', name: 'Nail trim', price: 250, description: 'Claw clipping and filing' },
    { id: 'ear', name: 'Ear cleaning', price: 200, description: 'Gentle flush and check' },
    { id: 'deworm', name: 'Deworming', price: 450, description: 'Weight-based dose' },
    { id: 'flea', name: 'Flea treatment', price: 600, description: 'Topical spot-on' },
    { id: 'micro', name: 'Microchipping', price: 950, description: 'Includes registration' },
];

/** The look each service category gets on its carousel card. */
const categoryThemes: Record<string, { icon: string; gradient: string }> = {
    wellness: { icon: '🩺', gradient: 'from-emerald-400 to-emerald-600' },
    vaccination: { icon: '💉', gradient: 'from-sky-400 to-sky-600' },
    dental: { icon: '🦷', gradient: 'from-teal-400 to-teal-600' },
    grooming: { icon: '✂️', gradient: 'from-amber-400 to-amber-600' },
    diagnostics: { icon: '🔬', gradient: 'from-violet-400 to-violet-600' },
};

const themeFor = (category: string | null) =>
    categoryThemes[(category ?? '').toLowerCase()] ?? {
        icon: '🐾',
        gradient: 'from-[#2a5a2a] to-[#1a3d1a]',
    };

/** The tile colour each payment channel shows, as the booking mock-up draws it. */
const methodThemes: Record<string, { color: string; letter: string }> = {
    gcash: { color: '#007DFE', letter: 'G' },
    maya: { color: '#11B36B', letter: 'M' },
    card: { color: '#64748B', letter: 'C' },
    'bank transfer': { color: '#475569', letter: 'B' },
};

const methodThemeFor = (name: string) =>
    methodThemes[name.toLowerCase()] ?? {
        color: '#1a3d1a',
        letter: name.charAt(0).toUpperCase() || '₱',
    };

const steps = ['Service & schedule', 'Extras', 'Payment', 'Confirmation'];

/** The wizard's Back / Continue pair, drawn as the mock-up's pills. */
const navBackClass =
    'inline-flex items-center gap-2 rounded-full border border-[#1a3d1a]/15 bg-white px-5 py-2.5 text-sm font-semibold text-[#1a3d1a] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#EFFDF0] hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]';

const navNextClass =
    'inline-flex items-center gap-2 rounded-full bg-[#1a3d1a] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#1a3d1a]/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#2a5a2a] hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-[#1a3d1a] disabled:hover:shadow-lg';

/** The uppercase micro-labels hung over every field in the mock-up. */
const microLabelClass =
    'block text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#1a3d1a]/50';

const fieldPillClass =
    'mt-2 block w-full rounded-xl border border-[#1a3d1a]/15 bg-[#EFFDF0]/40 px-3.5 py-2.5 text-sm text-[#1a3d1a] transition-all duration-200 focus:border-[#1a3d1a] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1a3d1a]/15';

/** "Wed, Oct 16, 2026" from the bare YYYY-MM-DD the API stores. */
function prettyDate(iso: string): string {
    return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

/** "9:00 AM" from the 24-hour "HH:MM" slot value. */
function prettyTime(value: string): string {
    const [hours, minutes] = value.split(':').map(Number);
    const suffix = hours < 12 ? 'AM' : 'PM';
    const hour = hours % 12 === 0 ? 12 : hours % 12;

    return `${hour}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

function Stepper({ active }: { active: number }) {
    return (
        <div className="fade-in rounded-2xl border border-[#1a3d1a]/10 bg-white px-4 py-4 shadow-card sm:px-6">
            <ol className="no-scrollbar flex items-center gap-2 overflow-x-auto sm:justify-center sm:gap-0">
                {steps.map((label, index) => {
                    const number = index + 1;
                    const done = number < active;
                    const isActive = number === active;

                    return (
                        <Fragment key={label}>
                            {index > 0 && (
                                <li
                                    aria-hidden="true"
                                    className={`step-connector h-[2px] w-5 shrink-0 rounded-full sm:w-14 ${
                                        done ? 'bg-[#2a5a2a]' : 'bg-[#1a3d1a]/15'
                                    }`}
                                />
                            )}
                            <li className="flex shrink-0 items-center gap-2.5">
                                <span
                                    className={`step-node flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${
                                        done
                                            ? 'bg-[#2a5a2a] text-white'
                                            : isActive
                                              ? 'is-active bg-[#E86A10] font-bold text-white ring-4 ring-[#E86A10]/15'
                                              : 'border border-[#1a3d1a]/20 bg-white font-semibold text-[#1a3d1a]/40'
                                    }`}
                                >
                                    {done ? (
                                        <Check className="h-4 w-4" strokeWidth={3} />
                                    ) : (
                                        number
                                    )}
                                </span>
                                <span
                                    className={`hidden text-sm font-semibold transition-colors duration-300 sm:block ${
                                        done || isActive
                                            ? 'text-[#1a3d1a]'
                                            : 'text-[#1a3d1a]/40'
                                    }`}
                                >
                                    {label}
                                </span>
                            </li>
                        </Fragment>
                    );
                })}
            </ol>
            <p className="mt-3 text-center text-xs font-semibold text-[#1a3d1a]/55 sm:hidden">
                Step {active} of 4 · {steps[active - 1]}
            </p>
        </div>
    );
}

/**
 * The service detail sheet the carousel's "Details" link opens. It holds the
 * same facts the card compresses, plus the pick button, so a client can read
 * a service properly without losing their place in the wizard.
 */
function ServiceDetailModal({
    service,
    selected,
    onToggle,
    onClose,
}: {
    service: BookableService;
    selected: boolean;
    onToggle: () => void;
    onClose: () => void;
}) {
    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };

        document.addEventListener('keydown', onKey);
        document.body.classList.add('modal-open');

        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.classList.remove('modal-open');
        };
    }, [onClose]);

    const theme = themeFor(service.category);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-modal-title"
        >
            <div
                className="modal-backdrop absolute inset-0 bg-[#122b12]/50 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="modal-panel relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-[#1a3d1a]/10 bg-white shadow-2xl shadow-[#122b12]/25">
                <div className="relative h-40 shrink-0 overflow-hidden">
                    {service.image ? (
                        <img
                            src={service.image}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover"
                        />
                    ) : (
                        <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient}`}>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-7xl opacity-90 drop-shadow-sm">
                                    {theme.icon}
                                </span>
                            </div>
                        </div>
                    )}
                    <span
                        aria-hidden="true"
                        className="absolute inset-0 bg-gradient-to-t from-[#122b12]/70 via-[#122b12]/20 to-transparent"
                    />

                    <span className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[#1a3d1a] shadow-sm backdrop-blur">
                        <span>{theme.icon}</span>
                        {service.category ?? 'Service'}
                    </span>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-[#1a3d1a] shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                        <X className="h-4 w-4" />
                    </button>

                    <h2
                        id="service-modal-title"
                        className="absolute inset-x-5 bottom-4 font-serif-display text-2xl leading-tight text-white drop-shadow-md"
                    >
                        {service.service_name}
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto p-6 sm:p-7">
                    <p className="text-sm leading-relaxed text-[#1a3d1a]/70">
                        {service.description ?? 'Ask the clinic for details about this service.'}
                    </p>

                    <dl className="mt-6 grid grid-cols-3 gap-3">
                        <div className="rounded-xl border border-[#1a3d1a]/10 bg-[#EFFDF0]/60 p-3.5">
                            <dt className="text-[0.58rem] font-bold uppercase tracking-[0.12em] text-[#1a3d1a]/45">
                                Price
                            </dt>
                            <dd className="mt-1.5 font-serif-display text-lg leading-none text-[#1a3d1a]">
                                {currency(service.price)}
                            </dd>
                        </div>
                        <div className="rounded-xl border border-[#1a3d1a]/10 bg-[#EFFDF0]/60 p-3.5">
                            <dt className="text-[0.58rem] font-bold uppercase tracking-[0.12em] text-[#1a3d1a]/45">
                                Duration
                            </dt>
                            <dd className="mt-1.5 font-serif-display text-lg leading-none text-[#1a3d1a]">
                                {service.duration_minutes ?? 0}
                                <span className="ml-0.5 font-sans text-xs font-semibold text-[#1a3d1a]/50">
                                    min
                                </span>
                            </dd>
                        </div>
                        <div className="rounded-xl border border-[#1a3d1a]/10 bg-[#EFFDF0]/60 p-3.5">
                            <dt className="text-[0.58rem] font-bold uppercase tracking-[0.12em] text-[#1a3d1a]/45">
                                Code
                            </dt>
                            <dd className="mt-1.5 font-mono text-sm font-semibold tracking-wide text-[#1a3d1a]">
                                #{String(service.id).padStart(4, '0')}
                            </dd>
                        </div>
                    </dl>

                    <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-[#1a3d1a]/10 bg-white px-4 py-3">
                        <span className="text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[#1a3d1a]/45">
                            Filed under
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1a3d1a]">
                            <span>{theme.icon}</span>
                            {service.category ?? '—'}
                        </span>
                    </div>

                    <div className="mt-4 flex items-start gap-3 rounded-xl bg-[#EFFDF0] px-4 py-3.5">
                        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#2a5a2a]" />
                        <p className="text-xs leading-relaxed text-[#1a3d1a]/65">
                            Carried out in a single visit. If the vet needs more time than
                            booked, the desk will let you know before you arrive.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#1a3d1a]/10 bg-[#EFFDF0]/40 p-5 sm:p-6">
                    <button type="button" onClick={onClose} className={navBackClass}>
                        Close
                    </button>
                    <button
                        type="button"
                        onClick={onToggle}
                        className={
                            selected
                                ? 'inline-flex items-center gap-2 rounded-full border border-[#1a3d1a]/15 bg-white px-5 py-2.5 text-sm font-semibold text-[#1a3d1a] shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]'
                                : 'inline-flex items-center gap-2 rounded-full bg-[#1a3d1a] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#1a3d1a]/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#2a5a2a] hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]'
                        }
                    >
                        {selected ? (
                            <>
                                <X className="h-4 w-4" /> Remove from booking
                            </>
                        ) : (
                            <>
                                <Plus className="h-4 w-4" strokeWidth={2.4} /> Add to booking
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function BookingPage({ services, dogs, bookingWindowDays, bookingSubmitted }: PageProps<{
    services: BookableService[];
    dogs: PortalDog[];
    bookingWindowDays: number;
    bookingSubmitted: boolean;
}>) {
    const paymentMethods = usePage<PageProps>().props.portal?.paymentMethods ?? [];
    const [step, setStep] = useState(1);
    const [category, setCategory] = useState('All');
    const [page, setPage] = useState(0);
    const [serviceId, setServiceId] = useState<number | ''>('');
    const [extraIds, setExtraIds] = useState<string[]>([]);
    const [availability, setAvailability] = useState<ServiceAvailability | null>(null);
    const [loadingAvailability, setLoadingAvailability] = useState(false);
    const [proofPreview, setProofPreview] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);
    const [modalService, setModalService] = useState<BookableService | null>(null);
    const proofInput = useRef<HTMLInputElement>(null);
    const form = useForm({
        service_id: '' as number | string,
        dog_id: dogs.length === 1 ? dogs[0].id : ('' as number | string),
        appointment_date: '', appointment_time: '', notes: '',
        payment_method: paymentMethods[0]?.name ?? '', payment_amount: '',
        payment_reference: '', payment_proof: null as File | null,
        booking_flow: 'wizard',
    });

    const categories = ['All', ...Array.from(new Set(services.map((service) => service.category ?? 'Other services')))];
    const visibleServices = services.filter((service) => category === 'All' || (service.category ?? 'Other services') === category);
    const pages = Math.max(1, Math.ceil(visibleServices.length / 2));
    const displayedServices = visibleServices.slice(page * 2, page * 2 + 2);
    const selectedService = services.find((service) => service.id === serviceId);
    const selectedDog = dogs.find((dog) => String(dog.id) === String(form.data.dog_id));
    const extrasTotal = extraIds.reduce((sum, id) => sum + (EXTRAS.find((extra) => extra.id === id)?.price ?? 0), 0);
    const servicePrice = Number(selectedService?.price ?? 0);
    const total = servicePrice + extrasTotal;
    const deposit = servicePrice > 0 ? Math.ceil((servicePrice / 2) * 100) / 100 : 0;
    const amountToPay = Number(form.data.payment_amount) || deposit;
    const selectedSlots = availability && form.data.appointment_date ? availability.times[form.data.appointment_date] ?? [] : [];

    useEffect(() => {
        if (!selectedService) { setAvailability(null); return; }
        let cancelled = false;
        setLoadingAvailability(true);
        fetch(route('owner.services.availability', selectedService.id), { headers: { Accept: 'application/json' }, credentials: 'same-origin' })
            .then((response) => response.json())
            .then((payload: ServiceAvailability) => { if (!cancelled) setAvailability(payload); })
            .catch(() => { if (!cancelled) setAvailability({ windowDays: 0, dates: [], times: {} }); })
            .finally(() => { if (!cancelled) setLoadingAvailability(false); });
        return () => { cancelled = true; };
    }, [selectedService?.id]);

    useEffect(() => {
        if (selectedService && !form.data.payment_amount) form.setData('payment_amount', deposit.toFixed(2));
    }, [selectedService?.id, deposit]);

    useEffect(() => {
        if (!form.data.payment_proof) { setProofPreview(null); return; }
        const url = URL.createObjectURL(form.data.payment_proof);
        setProofPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [form.data.payment_proof]);

    // Each step rises in from below, so the page scrolls back to the top to
    // meet it rather than dropping the client mid-form.
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [step]);

    const availableDates = useMemo(() => new Set(availability?.dates ?? []), [availability]);
    const chooseService = (id: number) => { setServiceId(id); form.setData('service_id', id); form.setData('appointment_date', ''); form.setData('appointment_time', ''); };
    const clearService = () => { setServiceId(''); form.setData('service_id', ''); };
    const selectCategory = (value: string) => { setCategory(value); setPage(0); };
    const toggleExtra = (id: string) => setExtraIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
    const handleProofFile = (file: File | null | undefined) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) { form.setError('payment_proof', 'Please upload an image file (PNG or JPG).'); return; }
        if (file.size > 5 * 1024 * 1024) { form.setError('payment_proof', 'That image is over 5MB. Please upload a smaller one.'); return; }
        form.setData('payment_proof', file);
    };
    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        const addOns = extraIds.map((id) => EXTRAS.find((extra) => extra.id === id)?.name).filter(Boolean).join(', ');
        const notes = [form.data.notes.trim(), addOns ? `Add-ons requested: ${addOns}.` : ''].filter(Boolean).join('\n');
        form.transform((data) => ({ ...data, notes }));
        form.post(route('owner.appointments.store'), { forceFormData: true });
    };

    if (bookingSubmitted) {
        return (
            <OwnerLayout title="Booking received">
                <div className="space-y-6">
                    <div className="relative overflow-hidden rounded-3xl border border-[#1a3d1a]/10 bg-white p-8 text-center shadow-card sm:p-10">
                        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_70%_at_50%_0%,rgba(42,90,42,0.10),transparent_70%)]" />

                        <div className="relative">
                            <div className="mx-auto flex h-20 w-20 items-center justify-center">
                                <span className="success-ring absolute h-20 w-20 rounded-full bg-[#2a5a2a]/25" />
                                <span className="success-badge relative flex h-20 w-20 items-center justify-center rounded-full bg-[#2a5a2a] text-white shadow-lg shadow-[#2a5a2a]/30">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" className="success-check h-9 w-9">
                                        <path d="M20 6 9 17l-5-5" />
                                    </svg>
                                </span>
                            </div>

                            <p className="mt-6 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-[#1a3d1a]/40">Payment submitted</p>
                            <h1 className="mt-2 font-serif-display text-3xl leading-tight text-[#1a3d1a] sm:text-4xl">Booking received</h1>
                            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#1a3d1a]/60">
                                We've received your payment details. The clinic will verify your proof of payment and send a confirmation — usually within a few hours.
                            </p>

                            <div className="mt-6 flex justify-center">
                                <span className="inline-flex items-center gap-2 rounded-full bg-[#FEF3E7] px-3.5 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.1em] text-[#d45e0d] ring-1 ring-inset ring-[#E86A10]/15">
                                    <span className="relative flex h-1.5 w-1.5">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#E86A10] opacity-75" />
                                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#E86A10]" />
                                    </span>
                                    Awaiting verification
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-[#1a3d1a]/10 bg-[#EFFDF0] p-6 sm:p-7">
                        <h3 className="font-serif-display text-lg text-[#1a3d1a]">What happens next</h3>
                        <ol className="stagger mt-5 grid gap-4 sm:grid-cols-3">
                            <li className="flex gap-3">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-[#1a3d1a] shadow-sm">1</span>
                                <span className="text-sm leading-relaxed text-[#1a3d1a]/65">
                                    <strong className="block font-semibold text-[#1a3d1a]">We verify</strong>
                                    The desk checks your reference number and receipt.
                                </span>
                            </li>
                            <li className="flex gap-3">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-[#1a3d1a] shadow-sm">2</span>
                                <span className="text-sm leading-relaxed text-[#1a3d1a]/65">
                                    <strong className="block font-semibold text-[#1a3d1a]">You get a message</strong>
                                    A confirmation lands in your portal inbox.
                                </span>
                            </li>
                            <li className="flex gap-3">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-[#1a3d1a] shadow-sm">3</span>
                                <span className="text-sm leading-relaxed text-[#1a3d1a]/65">
                                    <strong className="block font-semibold text-[#1a3d1a]">We see your dog</strong>
                                    Come in at the booked time — the record is ready.
                                </span>
                            </li>
                        </ol>

                        <div className="mt-6 flex flex-wrap gap-3 border-t border-[#1a3d1a]/10 pt-5">
                            <Link href={route('owner.appointments.index')} className={navNextClass}>
                                View my appointments <ArrowRight className="h-4 w-4" />
                            </Link>
                            <Link href={route('owner.services.index')} className={navBackClass}>
                                Browse services
                            </Link>
                        </div>
                    </div>
                </div>
            </OwnerLayout>
        );
    }

    const errorMessages = Object.values(form.errors);
    const canContinue = step === 1 ? Boolean(serviceId && form.data.dog_id && form.data.appointment_date && form.data.appointment_time) : step === 2 ? true : Boolean(form.data.payment_method && form.data.payment_reference && form.data.payment_proof);

    return (
        <OwnerLayout title="Book a visit">
            {/* The booking page sits on the mock-up's mint surface. */}
            <div className="-mx-4 -mt-10 -mb-20 bg-[#EFFDF0] px-4 pb-20 pt-10 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
                <div className="mx-auto max-w-6xl">
                    {/* Title */}
                    <div className="mb-8 fade-in">
                        <p className="flex items-center gap-3 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#1a3d1a]/45">
                            <span aria-hidden="true" className="h-px w-8 bg-[#E86A10]" />
                            Book a visit
                        </p>
                        <h1 className="mt-3 font-serif-display text-3xl leading-tight text-[#1a3d1a] sm:text-4xl">
                            Reserve a time for your dog
                        </h1>
                        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#1a3d1a]/60">
                            Four short steps. Send your payment proof and the clinic will confirm your slot.
                        </p>
                    </div>

                    <Stepper active={step} />

                    {errorMessages.length > 0 && (
                        <div role="alert" className="fade-in mt-6 rounded-2xl border border-red-700/20 bg-red-50 px-4 py-3 text-sm text-red-800">
                            <p className="font-semibold">Please check the booking details.</p>
                            <ul className="mt-1 list-inside list-disc">
                                {errorMessages.map((error) => <li key={error}>{error}</li>)}
                            </ul>
                        </div>
                    )}

                    <form onSubmit={submit} className="mt-7">
                        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
                            <div className="space-y-6 lg:col-span-8">
                                {step === 1 && (
                                    <div key="step-1" className="step-panel space-y-6">
                                        {/* Services + category tabs + carousel */}
                                        <section className="rounded-2xl border border-[#1a3d1a]/10 bg-white shadow-card">
                                            <div className="p-6 pb-0 sm:p-7 sm:pb-0">
                                                <div className="flex flex-wrap items-start justify-between gap-4">
                                                    <div>
                                                        <h2 className="font-serif-display text-xl text-[#1a3d1a]">Which service do you need?</h2>
                                                        <p className="mt-1 text-sm text-[#1a3d1a]/60">Pick one from the clinic's live menu. Tap a card to choose it.</p>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <button type="button" aria-label="Previous services" onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={page === 0} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#1a3d1a]/15 bg-white text-[#1a3d1a] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#EFFDF0] hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0 disabled:hover:bg-white disabled:hover:shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]">
                                                            <ChevronLeft className="h-4 w-4" />
                                                        </button>
                                                        <button type="button" aria-label="Next services" onClick={() => setPage((current) => Math.min(pages - 1, current + 1))} disabled={page >= pages - 1} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#1a3d1a]/15 bg-white text-[#1a3d1a] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#EFFDF0] hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:translate-y-0 disabled:hover:bg-white disabled:hover:shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]">
                                                            <ChevronRight className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="no-scrollbar mt-5 flex gap-2 overflow-x-auto pb-1">
                                                    {categories.map((value) => {
                                                        const activeCategory = category === value;
                                                        const count = value === 'All' ? services.length : services.filter((service) => (service.category ?? 'Other services') === value).length;
                                                        const icon = value === 'All' ? '🐾' : themeFor(value).icon;

                                                        return (
                                                            <button
                                                                type="button"
                                                                key={value}
                                                                onClick={() => selectCategory(value)}
                                                                aria-pressed={activeCategory}
                                                                className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a] ${
                                                                    activeCategory
                                                                        ? 'border-[#1a3d1a] bg-[#1a3d1a] text-white shadow-md shadow-[#1a3d1a]/15'
                                                                        : 'border-[#1a3d1a]/12 bg-white text-[#1a3d1a]/65 hover:-translate-y-0.5 hover:border-[#1a3d1a]/30 hover:text-[#1a3d1a]'
                                                                }`}
                                                            >
                                                                <span className="text-sm">{icon}</span>
                                                                {value}
                                                                <span className={`rounded-full px-1.5 py-0.5 text-[0.6rem] font-bold tabular-nums ${activeCategory ? 'bg-white/20 text-white' : 'bg-[#1a3d1a]/8 text-[#1a3d1a]/55'}`}>
                                                                    {count}
                                                                </span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <div className="p-6 pt-5 sm:p-7 sm:pt-5">
                                                <div key={`${category}-${page}`} className="carousel-slide grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Services">
                                                    {displayedServices.length === 0 ? (
                                                        <div className="col-span-full rounded-2xl border border-dashed border-[#1a3d1a]/20 bg-[#EFFDF0]/60 p-8 text-center">
                                                            <p className="text-sm text-[#1a3d1a]/55">No services are available in this category right now.</p>
                                                        </div>
                                                    ) : displayedServices.map((service) => {
                                                        const selected = service.id === serviceId;
                                                        const theme = themeFor(service.category);

                                                        return (
                                                            <div
                                                                key={service.id}
                                                                role="radio"
                                                                tabIndex={0}
                                                                aria-checked={selected}
                                                                onClick={() => chooseService(service.id)}
                                                                onKeyDown={(event) => {
                                                                    if (event.key === 'Enter' || event.key === ' ') {
                                                                        event.preventDefault();
                                                                        chooseService(service.id);
                                                                    }
                                                                }}
                                                                className="service-card"
                                                            >
                                                                {/* Header */}
                                                                <div className="relative h-28 overflow-hidden">
                                                                    {service.image ? (
                                                                        <img src={service.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
                                                                    ) : (
                                                                        <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient}`}>
                                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                                <span className="text-5xl opacity-90 drop-shadow-sm">{theme.icon}</span>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#122b12]/65 via-[#122b12]/10 to-transparent" />

                                                                    <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-[#1a3d1a] shadow-sm backdrop-blur">
                                                                        {currency(service.price)}
                                                                    </span>

                                                                    <span className={`absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-full shadow-sm transition-all duration-300 ease-out ${selected ? 'scale-100 bg-[#1a3d1a] text-white opacity-100' : 'scale-75 bg-white/85 text-[#1a3d1a]/30 opacity-0'}`}>
                                                                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                                                                    </span>
                                                                </div>

                                                                {/* Body */}
                                                                <div className="flex flex-1 flex-col p-4">
                                                                    <h3 className="font-serif-display text-base font-semibold leading-tight text-[#1a3d1a]">
                                                                        {service.service_name}
                                                                    </h3>
                                                                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#1a3d1a]/55">
                                                                        {service.description ?? 'Ask the clinic for details.'}
                                                                    </p>

                                                                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#1a3d1a]/8 pt-3">
                                                                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1a3d1a]/60">
                                                                            <Clock className="h-3.5 w-3.5" />
                                                                            {service.duration_minutes ?? 0} min
                                                                        </span>

                                                                        <div className="flex items-center gap-2">
                                                                            <button
                                                                                type="button"
                                                                                onClick={(event) => { event.stopPropagation(); setModalService(service); }}
                                                                                className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[0.68rem] font-semibold text-[#1a3d1a]/55 transition-colors duration-150 hover:bg-[#EFFDF0] hover:text-[#1a3d1a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]"
                                                                                aria-label={`View details for ${service.service_name}`}
                                                                            >
                                                                                <Info className="h-3 w-3" />
                                                                                Details
                                                                            </button>
                                                                            <span className={`text-xs font-bold uppercase tracking-wider transition-colors duration-200 ${selected ? 'text-[#2a5a2a]' : 'text-[#1a3d1a]/40'}`}>
                                                                                {selected ? 'Selected' : 'Select'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                <div className="mt-5 flex items-center justify-between gap-4 border-t border-[#1a3d1a]/8 pt-4">
                                                    <div className="flex items-center gap-1.5">
                                                        {Array.from({ length: pages }).map((_, index) => (
                                                            <button
                                                                key={index}
                                                                type="button"
                                                                aria-label={`Go to slide ${index + 1}`}
                                                                onClick={() => setPage(index)}
                                                                className={`h-1.5 rounded-full transition-all duration-300 ${index === page ? 'w-6 bg-[#1a3d1a]' : 'w-1.5 bg-[#1a3d1a]/20 hover:bg-[#1a3d1a]/40'}`}
                                                            />
                                                        ))}
                                                    </div>
                                                    <p className="text-xs font-semibold text-[#1a3d1a]/55">
                                                        {selectedService ? `${selectedService.service_name} selected` : 'No service selected yet'}
                                                    </p>
                                                </div>
                                                <InputError className="mt-2" message={form.errors.service_id} />
                                            </div>
                                        </section>

                                        {/* Schedule */}
                                        <section className="rounded-2xl border border-[#1a3d1a]/10 bg-white p-6 shadow-card sm:p-7">
                                            <h2 className="font-serif-display text-xl text-[#1a3d1a]">When should we expect you?</h2>
                                            <p className="mt-1 text-sm text-[#1a3d1a]/60">
                                                Open days and times are checked live. Book up to {bookingWindowDays} days ahead.
                                            </p>

                                            {/* ── Date ── */}
                                            <div className="mt-6">
                                                <div className="flex items-center justify-between gap-3">
                                                    <p className={microLabelClass}>Preferred date</p>
                                                    <p className="text-xs text-[#1a3d1a]/45">
                                                        {form.data.appointment_date
                                                            ? prettyDate(form.data.appointment_date)
                                                            : `Book up to ${bookingWindowDays} days ahead`}
                                                    </p>
                                                </div>

                                                <div className="mt-3">
                                                    {loadingAvailability ? (
                                                        <div className="flex h-72 items-center justify-center gap-2 rounded-2xl border border-[#1a3d1a]/10 text-sm text-[#1a3d1a]/55">
                                                            <Spinner className="h-4 w-4" /> Checking availability...
                                                        </div>
                                                    ) : (
                                                        <BookingCalendar
                                                            availableDates={availableDates}
                                                            selected={form.data.appointment_date || null}
                                                            onSelect={(date) => { form.setData('appointment_date', date); form.setData('appointment_time', ''); }}
                                                        />
                                                    )}
                                                </div>

                                                <p className="mt-3 text-[0.68rem] leading-relaxed text-[#1a3d1a]/40">
                                                    Greyed dates are unavailable or fall outside the clinic's booking window.
                                                </p>
                                                <InputError className="mt-2" message={form.errors.appointment_date} />
                                            </div>

                                            {/* ── Time ── */}
                                            <div className="mt-6">
                                                <p className={microLabelClass}>Preferred time</p>
                                                {!form.data.appointment_date ? (
                                                    <p className="mt-2.5 rounded-2xl border border-dashed border-[#1a3d1a]/15 px-4 py-6 text-sm text-[#1a3d1a]/50">Choose a day first.</p>
                                                ) : (
                                                    <div className="mt-2.5 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6" role="radiogroup" aria-label="Preferred time">
                                                        {selectedSlots.map((slot) => {
                                                            const selected = form.data.appointment_time === slot.value;

                                                            return (
                                                                <button
                                                                    type="button"
                                                                    key={slot.value}
                                                                    role="radio"
                                                                    aria-checked={selected}
                                                                    onClick={() => form.setData('appointment_time', slot.value)}
                                                                    className={`rounded-xl border px-2 py-2 text-sm font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a] ${
                                                                        selected
                                                                            ? 'border-[#1a3d1a] bg-[#1a3d1a] text-white shadow-md shadow-[#1a3d1a]/20'
                                                                            : 'border-[#1a3d1a]/12 bg-white text-[#1a3d1a]/70 hover:-translate-y-0.5 hover:border-[#1a3d1a]/30 hover:text-[#1a3d1a] hover:shadow-sm'
                                                                    }`}
                                                                >
                                                                    {slot.label}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                                <InputError className="mt-2" message={form.errors.appointment_time} />
                                            </div>

                                            {/* ── Dog ── */}
                                            <div className="mt-6">
                                                <label htmlFor="pet-select" className={microLabelClass}>Which dog?</label>
                                                <select
                                                    id="pet-select"
                                                    value={String(form.data.dog_id)}
                                                    onChange={(event) => form.setData('dog_id', event.target.value)}
                                                    className={fieldPillClass}
                                                >
                                                    <option value="">Select a dog…</option>
                                                    {dogs.map((dog) => (
                                                        <option key={dog.id} value={dog.id}>
                                                            {dog.dog_name}{dog.breed ? ` · ${dog.breed}` : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                                <InputError className="mt-2" message={form.errors.dog_id} />
                                            </div>
                                        </section>
                                    </div>
                                )}

                                {step === 2 && (
                                    <div key="step-2" className="step-panel space-y-6">
                                        <section className="rounded-2xl border border-[#1a3d1a]/10 bg-white p-6 shadow-card sm:p-7">
                                            <h2 className="font-serif-display text-xl text-[#1a3d1a]">Anything to add?</h2>
                                            <p className="mt-1 text-sm text-[#1a3d1a]/60">
                                                Optional extras the clinic can do in the same visit. Skip anything you don't need.
                                            </p>

                                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                                {EXTRAS.map((extra) => {
                                                    const selected = extraIds.includes(extra.id);

                                                    return (
                                                        <button
                                                            type="button"
                                                            key={extra.id}
                                                            role="checkbox"
                                                            aria-checked={selected}
                                                            onClick={() => toggleExtra(extra.id)}
                                                            className="option items-start"
                                                        >
                                                            <span className="option-check">
                                                                <Check className="h-3 w-3" strokeWidth={3} />
                                                            </span>
                                                            <span className="min-w-0 flex-1">
                                                                <span className="block text-sm font-semibold text-[#1a3d1a]">{extra.name}</span>
                                                                <span className="mt-0.5 block text-xs text-[#1a3d1a]/55">{extra.description}</span>
                                                            </span>
                                                            <span className="shrink-0 font-semibold text-[#1a3d1a]">{currency(extra.price)}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            <label htmlFor="booking-notes" className="mt-6 block text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#1a3d1a]/50">
                                                Anything the clinic should know?
                                            </label>
                                            <textarea
                                                id="booking-notes"
                                                rows={4}
                                                value={form.data.notes}
                                                onChange={(event) => form.setData('notes', event.target.value)}
                                                className={`${fieldPillClass} resize-none`}
                                                placeholder="Symptoms, behaviour, or a preferred vet..."
                                            />
                                        </section>

                                        <div className="rounded-2xl border border-[#1a3d1a]/10 bg-[#EFFDF0] p-5 sm:p-6">
                                            <div className="flex gap-3">
                                                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1a3d1a]/8 text-[#1a3d1a]">
                                                    <Info className="h-4 w-4" />
                                                </span>
                                                <p className="text-sm leading-relaxed text-[#1a3d1a]/65">
                                                    Add-ons are done in the same visit where possible. If the vet thinks one isn't suitable today, the desk will refund it or move it to your next appointment.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {step === 3 && (
                                    <div key="step-3" className="step-panel space-y-6">
                                        <section className="rounded-2xl border border-[#1a3d1a]/10 bg-white p-6 shadow-card sm:p-7">
                                            <h2 className="font-serif-display text-xl text-[#1a3d1a]">How would you like to pay?</h2>
                                            <p className="mt-1 text-sm text-[#1a3d1a]/60">
                                                Send your payment using any method below, then upload your proof and reference number. The clinic verifies it before your slot is locked in.
                                            </p>

                                            <div className="mt-5 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Payment method">
                                                {paymentMethods.map((method) => {
                                                    const theme = methodThemeFor(method.name);
                                                    const selected = form.data.payment_method === method.name;

                                                    return (
                                                        <button
                                                            type="button"
                                                            key={method.name}
                                                            role="radio"
                                                            aria-checked={selected}
                                                            onClick={() => form.setData('payment_method', method.name)}
                                                            className="option items-center"
                                                        >
                                                            <span className="option-check">
                                                                <Check className="h-3 w-3" strokeWidth={3} />
                                                            </span>
                                                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-serif-display text-lg font-semibold text-white" style={{ background: theme.color }}>
                                                                {theme.letter}
                                                            </span>
                                                            <span className="min-w-0 flex-1">
                                                                <span className="block text-sm font-semibold text-[#1a3d1a]">{method.name}</span>
                                                                <span className="mt-0.5 block text-xs text-[#1a3d1a]/55">{method.description}</span>
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <InputError className="mt-2" message={form.errors.payment_method} />
                                        </section>

                                        {form.data.payment_method ? (
                                            <div key={form.data.payment_method} className="fade-in rounded-2xl border border-[#1a3d1a]/10 bg-white p-6 shadow-card sm:p-7">
                                                <div className="flex items-center gap-3">
                                                    <span className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold text-white" style={{ background: methodThemeFor(form.data.payment_method).color }}>
                                                        {methodThemeFor(form.data.payment_method).letter}
                                                    </span>
                                                    <h3 className="font-serif-display text-lg text-[#1a3d1a]">Pay with {form.data.payment_method}</h3>
                                                </div>

                                                <p className="mt-4 text-sm leading-relaxed text-[#1a3d1a]/60">
                                                    Send exactly <strong className="font-semibold text-[#1a3d1a]">{currency(total)}</strong> using {form.data.payment_method}, then upload a screenshot or photo of the receipt below.
                                                </p>

                                                <div className="mt-6 grid gap-5 border-t border-[#1a3d1a]/10 pt-6 sm:grid-cols-2">
                                                    <div>
                                                        <label htmlFor="payment-reference" className={microLabelClass}>Reference number</label>
                                                        <input
                                                            id="payment-reference"
                                                            type="text"
                                                            inputMode="numeric"
                                                            autoComplete="off"
                                                            value={form.data.payment_reference}
                                                            onChange={(event) => form.setData('payment_reference', event.target.value)}
                                                            className={`${fieldPillClass} font-mono tracking-wide placeholder:font-sans placeholder:tracking-normal`}
                                                            placeholder="e.g. 0123 456 789012"
                                                        />
                                                        <p className="mt-1.5 text-xs text-[#1a3d1a]/45">Found on your {form.data.payment_method} receipt.</p>
                                                        <InputError className="mt-2" message={form.errors.payment_reference} />
                                                    </div>

                                                    <div>
                                                        <p className={microLabelClass}>Proof of payment</p>
                                                        {proofPreview ? (
                                                            <div className="fade-in mt-2 flex items-center gap-3 rounded-xl border border-[#1a3d1a]/15 bg-[#EFFDF0] p-3">
                                                                <img src={proofPreview} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover ring-1 ring-[#1a3d1a]/10" />
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="truncate text-sm font-semibold text-[#1a3d1a]">{form.data.payment_proof?.name}</p>
                                                                    <p className="text-xs text-[#1a3d1a]/50">Ready to upload</p>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => { form.setData('payment_proof', null); if (proofInput.current) proofInput.current.value = ''; }}
                                                                    aria-label="Remove proof"
                                                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#1a3d1a]/50 transition-colors hover:bg-white hover:text-[#1a3d1a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <label
                                                                className={`upload-zone mt-2 flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-[#1a3d1a]/20 bg-[#EFFDF0]/40 px-4 py-6 text-center ${dragging ? 'is-dragging' : ''}`}
                                                                onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
                                                                onDragLeave={() => setDragging(false)}
                                                                onDrop={(event) => { event.preventDefault(); setDragging(false); handleProofFile(event.dataTransfer.files?.[0]); }}
                                                            >
                                                                <input ref={proofInput} type="file" accept="image/*" className="sr-only" onChange={(event) => handleProofFile(event.target.files?.[0] ?? null)} />
                                                                <ImageUp className="h-6 w-6 text-[#1a3d1a]/40" />
                                                                <span className="text-sm font-semibold text-[#1a3d1a]">Upload receipt</span>
                                                                <span className="text-xs text-[#1a3d1a]/45">PNG, JPG, or WEBP up to 5MB</span>
                                                            </label>
                                                        )}
                                                        <InputError className="mt-2" message={form.errors.payment_proof} />
                                                    </div>
                                                </div>

                                                <div className="mt-6 flex items-start gap-3 rounded-xl bg-[#FEF3E7] px-4 py-3.5">
                                                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#E86A10]" />
                                                    <p className="text-xs leading-relaxed text-[#d45e0d]">
                                                        The clinic checks each payment by hand. You'll get a confirmation message once it's verified — usually within a few hours during opening times.
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="fade-in rounded-2xl border border-dashed border-[#1a3d1a]/20 bg-white/60 p-8 text-center">
                                                <p className="text-sm text-[#1a3d1a]/55">Choose a payment method above to see the next steps.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* RIGHT: sticky summary */}
                            <aside className="lg:col-span-4">
                                <div className="space-y-4 lg:sticky lg:top-24">
                                    <section className="rounded-2xl border border-[#1a3d1a]/10 bg-white p-6 shadow-card transition-shadow duration-300 hover:shadow-lift">
                                        <h2 className="font-serif-display text-lg text-[#1a3d1a]">Reservation summary</h2>

                                        <div className="mt-5 space-y-4">
                                            {[
                                                { label: 'Service', value: selectedService?.service_name ?? 'Not selected yet', empty: !selectedService },
                                                { label: 'Dog', value: selectedDog?.dog_name ?? 'Not chosen yet', empty: !selectedDog },
                                                { label: 'Date', value: form.data.appointment_date ? prettyDate(form.data.appointment_date) : 'Not chosen yet', empty: !form.data.appointment_date },
                                                { label: 'Time', value: form.data.appointment_time ? prettyTime(form.data.appointment_time) : 'Not chosen yet', empty: !form.data.appointment_time },
                                                { label: 'Total time', value: selectedService?.duration_minutes ? `${selectedService.duration_minutes} min` : 'Not set', empty: !selectedService?.duration_minutes },
                                            ].map((item) => (
                                                <div key={item.label} className="flex items-start justify-between gap-4">
                                                    <p className="shrink-0 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-[#1a3d1a]/40">{item.label}</p>
                                                    <p className={`max-w-[62%] rounded px-1.5 text-right text-sm ${item.empty ? 'font-normal text-[#1a3d1a]/35' : 'font-semibold text-[#1a3d1a]'}`}>
                                                        <span key={item.value} className="value-flash rounded px-1.5">{item.value}</span>
                                                    </p>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-6 border-t border-[#1a3d1a]/10 pt-5">
                                            <h3 className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#1a3d1a]/45">Your price summary</h3>
                                            <div className="mt-3.5 space-y-2.5 text-sm">
                                                {selectedService ? (
                                                    <>
                                                        <div key={`service-${selectedService.id}`} className="fade-in flex items-center justify-between gap-4">
                                                            <span className="truncate text-[#1a3d1a]/60" title={selectedService.service_name}>{selectedService.service_name}</span>
                                                            <span className="shrink-0 font-semibold text-[#1a3d1a]">{currency(servicePrice)}</span>
                                                        </div>
                                                        {extraIds.map((id) => {
                                                            const extra = EXTRAS.find((item) => item.id === id);
                                                            if (!extra) return null;

                                                            return (
                                                                <div key={id} className="fade-in flex items-center justify-between gap-4">
                                                                    <span className="truncate text-[#1a3d1a]/60" title={extra.name}>{extra.name}</span>
                                                                    <span className="shrink-0 font-semibold text-[#1a3d1a]">{currency(extra.price)}</span>
                                                                </div>
                                                            );
                                                        })}
                                                    </>
                                                ) : (
                                                    <p className="text-sm text-[#1a3d1a]/40">Pick a service to see pricing.</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-5 border-t border-[#1a3d1a]/10 pt-4">
                                            <div className="flex items-center justify-between gap-4">
                                                <span className="font-serif-display text-lg text-[#1a3d1a]">Total</span>
                                                <span key={total} className="value-flash rounded px-1.5 font-serif-display text-2xl leading-none text-[#1a3d1a]">{currency(total)}</span>
                                            </div>
                                            <p className="mt-2 text-xs text-[#1a3d1a]/45">A 50% deposit is required for the primary service.</p>
                                        </div>
                                    </section>

                                    <div className="rounded-2xl border border-[#1a3d1a]/10 bg-[#EFFDF0] p-5">
                                        <p className="flex items-center gap-2 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-[#1a3d1a]/45">
                                            <Phone className="h-3.5 w-3.5 text-[#E86A10]" />
                                            Need a hand?
                                        </p>
                                        <p className="mt-2.5 text-sm leading-relaxed text-[#1a3d1a]/65">
                                            Call the front desk on{' '}
                                            <a href="tel:+639171234567" className="font-semibold text-[#1a3d1a] underline decoration-[#1a3d1a]/20 underline-offset-2 transition-colors hover:text-[#E86A10]">0917 123 4567</a>
                                            {' '}and we'll walk you through the booking.
                                        </p>
                                    </div>
                                </div>
                            </aside>
                        </div>

                        {/* Nav bar */}
                        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-1">
                            {step === 1 ? (
                                <Link href={route('owner.services.index')} className={navBackClass}>
                                    <ArrowLeft className="h-4 w-4" /> Browse services
                                </Link>
                            ) : (
                                <button type="button" onClick={() => setStep((current) => current - 1)} className={navBackClass}>
                                    <ArrowLeft className="h-4 w-4" /> Back
                                </button>
                            )}

                            <div className="flex items-center gap-3">
                                {step < 3 ? (
                                    <button type="button" onClick={() => setStep((current) => current + 1)} disabled={!canContinue} className={navNextClass}>
                                        Continue <ArrowRight className="h-4 w-4" />
                                    </button>
                                ) : (
                                    <button type="submit" disabled={!canContinue || form.processing} className={navNextClass}>
                                        {form.processing ? <Spinner className="h-4 w-4" /> : null} Confirm payment
                                    </button>
                                )}
                            </div>
                        </div>
                    </form>

                    {modalService && (
                        <ServiceDetailModal
                            service={modalService}
                            selected={modalService.id === serviceId}
                            onToggle={() => {
                                if (modalService.id === serviceId) clearService();
                                else chooseService(modalService.id);
                            }}
                            onClose={() => setModalService(null)}
                        />
                    )}
                </div>
            </div>
        </OwnerLayout>
    );
}
