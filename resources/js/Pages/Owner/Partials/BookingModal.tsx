import InputError from '@/Components/InputError';
import Modal from '@/Components/Modal';
import Spinner from '@/Components/Spinner';
import {
    primaryButtonClass,
    secondaryButtonClass,
} from '@/Components/buttonStyles';
import { TextAreaField } from '@/Components/Field';
import { labelClass } from '@/Components/formStyles';
import { Link, useForm } from '@inertiajs/react';
import { CalendarDays, Clock, X } from 'lucide-react';
import { FormEventHandler, useEffect, useMemo, useState } from 'react';
import {
    PortalDog,
    PortalService,
    PublicTeamMember,
    ServiceAvailability,
} from '@/types';
import { currency, initials } from '@/utils/format';
import BookingCalendar from './BookingCalendar';

/**
 * Books one service against the clinic's live calendar.
 *
 * The calendar is loaded per service from the availability endpoint: the
 * server decides which days and times are actually free, so the form only ever
 * offers a slot that can be taken. The booking is submitted as a request the
 * front desk confirms.
 */
export default function BookingModal({
    service,
    dogs,
    team,
    show,
    onClose,
}: {
    /** Null while the modal is closed; the service being booked otherwise. */
    service: PortalService | null;
    dogs: PortalDog[];
    /** The clinic's care team, so the owner sees who could take the visit. */
    team: PublicTeamMember[];
    show: boolean;
    onClose: () => void;
}) {
    const { data, setData, post, processing, errors, clearErrors } = useForm({
        service_id: '' as number | string,
        dog_id: '' as number | string,
        appointment_date: '',
        appointment_time: '',
        notes: '',
    });

    const [availability, setAvailability] =
        useState<ServiceAvailability | null>(null);
    const [loadingAvailability, setLoadingAvailability] = useState(false);

    // Fresh form each time the modal opens, with the service already chosen.
    useEffect(() => {
        if (!show || !service) {
            return;
        }

        clearErrors();
        setData({
            service_id: service.id,
            dog_id: dogs.length === 1 ? dogs[0].id : '',
            appointment_date: '',
            appointment_time: '',
            notes: '',
        });
        // `dogs` is stable for the life of the page; only the open/service matter.
    }, [show, service?.id]);

    // Ask the server which days and times this service can be booked.
    useEffect(() => {
        if (!show || !service) {
            return;
        }

        let cancelled = false;
        setLoadingAvailability(true);
        setAvailability(null);

        fetch(route('owner.services.availability', service.id), {
            headers: { Accept: 'application/json' },
            credentials: 'same-origin',
        })
            .then((response) => response.json())
            .then((payload: ServiceAvailability) => {
                if (!cancelled) {
                    setAvailability(payload);
                }
            })
            .catch(() => {
                // A failed lookup reads as no availability rather than a crash.
                if (!cancelled) {
                    setAvailability({
                        windowDays: 0,
                        dates: [],
                        times: {},
                    });
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoadingAvailability(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [show, service?.id]);

    const availableDates = useMemo(
        () => new Set(availability?.dates ?? []),
        [availability],
    );

    const slots = useMemo(
        () =>
            data.appointment_date && availability
                ? (availability.times[data.appointment_date] ?? [])
                : [],
        [availability, data.appointment_date],
    );

    /*
     * Who the clinic can book for this service: groomers for grooming, vets for
     * everything else. The rule lives on the service so this list matches what
     * the clinic actually schedules.
     */
    const providers = useMemo(
        () =>
            service
                ? team.filter(
                      (member) => member.role_value === service.provider_role,
                  )
                : [],
        [team, service?.provider_role],
    );

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        post(route('owner.appointments.store'), {
            preserveScroll: true,
            onSuccess: () => onClose(),
        });
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="2xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#1a3d1a]/10 px-6 py-5">
                <div className="min-w-0">
                    <h2 className="font-serif-display text-2xl leading-tight text-[#1a3d1a]">
                        {service ? `Book ${service.service_name}` : 'Book a visit'}
                    </h2>
                    {service && (
                        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#1a3d1a]/60">
                            <span className="inline-flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" />
                                {service.duration_minutes ?? '—'} min
                            </span>
                            <span>{currency(service.price)}</span>
                            <span>Requests are confirmed by the front desk.</span>
                        </p>
                    )}
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#1a3d1a]/15 bg-white text-[#1a3d1a] transition-colors duration-150 hover:bg-[#EFFDF0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {dogs.length === 0 ? (
                <div className="p-6">
                    <p className="rounded-xl bg-[#EFFDF0]/70 px-4 py-4 text-sm leading-relaxed text-[#1a3d1a]/60">
                        Add a dog to your account before booking a visit — the
                        clinic needs to know who is coming in.
                    </p>
                    <div className="mt-5 flex justify-end">
                        <Link
                            href={route('owner.account.edit')}
                            className={primaryButtonClass}
                            onClick={onClose}
                        >
                            Add a dog
                        </Link>
                    </div>
                </div>
            ) : (
                <form
                    onSubmit={submit}
                    className="max-h-[70vh] overflow-y-auto p-6"
                >
                    <fieldset>
                        <legend className={labelClass}>Which dog?</legend>
                        <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {dogs.map((dog) => {
                                const selected = String(data.dog_id) === String(dog.id);

                                return (
                                    <button
                                        key={dog.id}
                                        type="button"
                                        onClick={() =>
                                            setData('dog_id', dog.id)
                                        }
                                        aria-pressed={selected}
                                        className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a] ${
                                            selected
                                                ? 'border-[#E86A10] bg-[#E86A10]/5 text-[#1a3d1a]'
                                                : 'border-[#1a3d1a]/15 bg-white text-[#1a3d1a]/75 hover:bg-[#EFFDF0]'
                                        }`}
                                    >
                                        {dog.dog_name}
                                        {dog.breed && (
                                            <span className="mt-0.5 block text-xs font-normal text-[#1a3d1a]/50">
                                                {dog.breed}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        <InputError className="mt-2" message={errors.dog_id} />
                    </fieldset>

                    {service && providers.length > 0 && (
                        <fieldset className="mt-6">
                            <legend className={labelClass}>
                                Who you could see
                            </legend>
                            <p className="mt-1.5 text-xs leading-relaxed text-[#1a3d1a]/50">
                                {service.provider_role === 'groomer'
                                    ? 'Groomers'
                                    : 'Veterinarians'}{' '}
                                who take this service. The front desk confirms
                                who is free at your time.
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2.5">
                                {providers.map((member) => (
                                    <div
                                        key={member.id}
                                        className="flex items-center gap-3 rounded-2xl border border-[#1a3d1a]/10 bg-white px-3 py-2"
                                    >
                                        {member.image ? (
                                            <img
                                                src={member.image}
                                                alt=""
                                                draggable={false}
                                                className="h-10 w-10 shrink-0 rounded-xl object-cover"
                                            />
                                        ) : (
                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EFFDF0] text-xs font-semibold text-[#1a3d1a]">
                                                {initials(member.name)}
                                            </span>
                                        )}
                                        <span className="min-w-0">
                                            <span className="block truncate text-sm font-semibold text-[#1a3d1a]">
                                                {member.name}
                                            </span>
                                            <span className="block truncate text-xs text-[#1a3d1a]/50">
                                                {member.specialization ??
                                                    member.role}
                                            </span>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </fieldset>
                    )}

                    <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
                        <div className="min-w-0">
                            <p className={labelClass}>Pick a day</p>
                            {loadingAvailability ? (
                                <div className="mt-2.5 flex h-[19rem] items-center justify-center gap-2 rounded-2xl border border-[#1a3d1a]/10 bg-white text-sm text-[#1a3d1a]/55">
                                    <Spinner className="h-4 w-4" />
                                    Checking the calendar…
                                </div>
                            ) : (
                                <div className="mt-2.5">
                                    <BookingCalendar
                                        availableDates={availableDates}
                                        selected={
                                            data.appointment_date || null
                                        }
                                        onSelect={(iso) => {
                                            setData(
                                                'appointment_date',
                                                iso,
                                            );
                                            setData('appointment_time', '');
                                        }}
                                    />
                                </div>
                            )}
                            <InputError
                                className="mt-2"
                                message={errors.appointment_date}
                            />
                        </div>

                        <div className="min-w-0">
                            <p className={labelClass}>Pick a time</p>
                            {!data.appointment_date ? (
                                <p className="mt-2.5 rounded-2xl border border-dashed border-[#1a3d1a]/15 bg-white px-4 py-6 text-sm leading-relaxed text-[#1a3d1a]/50">
                                    <CalendarDays className="mb-2 h-4 w-4" />
                                    Choose a day first, then pick a time.
                                </p>
                            ) : slots.length === 0 ? (
                                <p className="mt-2.5 rounded-2xl border border-dashed border-[#1a3d1a]/15 bg-white px-4 py-6 text-sm leading-relaxed text-[#1a3d1a]/50">
                                    No times left on that day. Please pick
                                    another one.
                                </p>
                            ) : (
                                <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                                    {slots.map((slot) => {
                                        const selected =
                                            data.appointment_time ===
                                            slot.value;

                                        return (
                                            <button
                                                key={slot.value}
                                                type="button"
                                                onClick={() =>
                                                    setData(
                                                        'appointment_time',
                                                        slot.value,
                                                    )
                                                }
                                                aria-pressed={selected}
                                                className={`rounded-xl border px-2 py-2.5 text-sm font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a] ${
                                                    selected
                                                        ? 'border-[#E86A10] bg-[#E86A10] text-white'
                                                        : 'border-[#1a3d1a]/15 bg-white text-[#1a3d1a] hover:bg-[#EFFDF0]'
                                                }`}
                                            >
                                                {slot.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                            <InputError
                                className="mt-2"
                                message={errors.appointment_time}
                            />
                        </div>
                    </div>

                    <div className="mt-6">
                        <TextAreaField
                            label="Anything the clinic should know?"
                            name="notes"
                            rows={3}
                            value={data.notes}
                            onChange={(event) =>
                                setData('notes', event.target.value)
                            }
                            error={errors.notes}
                            hint="Optional. Symptoms, behaviour, or a preferred vet."
                        />
                    </div>

                    <div className="mt-6 flex justify-end gap-3 border-t border-[#1a3d1a]/10 pt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className={secondaryButtonClass}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className={primaryButtonClass}
                        >
                            {processing && <Spinner className="h-4 w-4" />}
                            Request this visit
                        </button>
                    </div>
                </form>
            )}
        </Modal>
    );
}
