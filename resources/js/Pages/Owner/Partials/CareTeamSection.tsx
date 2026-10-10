import { PublicTeamMember } from '@/types';
import { initials } from '@/utils/format';
import { SectionLabel } from './OwnerHero';

/**
 * The clinic's care team, as the owner portal lists it.
 *
 * The same members back the landing page's care-team section; here they sit
 * beside the menu so an owner can see who might take their booking and read
 * each person's background before they choose a service.
 */
export default function CareTeamSection({ team }: { team: PublicTeamMember[] }) {
    if (team.length === 0) {
        return null;
    }

    const groups = [
        {
            label: 'Veterinarians',
            members: team.filter((member) => member.role_value === 'veterinarian'),
        },
        {
            label: 'Groomers',
            members: team.filter((member) => member.role_value === 'groomer'),
        },
    ].filter((group) => group.members.length > 0);

    return (
        <section aria-labelledby="care-team-heading">
            <SectionLabel>
                <span id="care-team-heading">Meet the care team</span>
            </SectionLabel>

            <p className="mb-5 max-w-2xl text-sm leading-relaxed text-[#1a3d1a]/60">
                Every grooming service is handled by one of our groomers, and
                every medical visit by one of our veterinarians. Here is who
                could be looking after your dog.
            </p>

            <div className="space-y-8">
                {groups.map((group) => (
                    <div key={group.label}>
                        <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-[#1a3d1a]/40">
                            {group.label}
                        </h3>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {group.members.map((member) => (
                                <article
                                    key={member.id}
                                    className="flex h-full flex-col overflow-hidden rounded-2xl border border-[#1a3d1a]/10 bg-white shadow-sm"
                                >
                                    <div className="flex items-center gap-3 p-5">
                                        {member.image ? (
                                            <img
                                                src={member.image}
                                                alt={member.name}
                                                draggable={false}
                                                className="h-14 w-14 shrink-0 rounded-2xl object-cover"
                                            />
                                        ) : (
                                            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#EFFDF0] font-serif-display text-lg text-[#1a3d1a]">
                                                {initials(member.name)}
                                            </span>
                                        )}

                                        <div className="min-w-0">
                                            <p className="truncate font-serif-display text-lg leading-tight text-[#1a3d1a]">
                                                {member.name}
                                            </p>
                                            <p className="mt-0.5 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[#E86A10]">
                                                {member.role}
                                            </p>
                                            {member.specialization && (
                                                <p className="mt-0.5 truncate text-xs text-[#1a3d1a]/55">
                                                    {member.specialization}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {member.background && (
                                        <p className="px-5 text-sm leading-relaxed text-[#1a3d1a]/60">
                                            {member.background}
                                        </p>
                                    )}

                                    <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 border-t border-[#1a3d1a]/10 px-5 py-4 text-xs text-[#1a3d1a]/55">
                                        {member.experience_years !== null && (
                                            <span>
                                                {member.experience_years} years
                                                experience
                                            </span>
                                        )}
                                        {member.qualifications && (
                                            <span>
                                                {member.qualifications}
                                            </span>
                                        )}
                                        {member.license_number && (
                                            <span>
                                                License {member.license_number}
                                            </span>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
