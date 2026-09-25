import Icon, { IconName } from '@/Components/Icon';
import { UserRole } from '@/types';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Head, Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useEffect, useState } from 'react';

interface NavItem {
    label: string;
    href: string;
    /** Ziggy pattern compared against the current route name. */
    pattern: string;
    icon: IconName;
}

interface NavGroup {
    title: string;
    items: NavItem[];
}

const roleLabels: Record<UserRole, string> = {
    admin: 'Administrator',
    front_desk: 'Front desk',
    owner: 'Dog owner',
};

/**
 * The console navigation, split by what the signed-in role can actually reach.
 *
 * Administrators see clinic-wide management; front desk staff see only their
 * own desk plus the client records they share with admins. Offering a link the
 * role cannot open would just hand them a 403.
 */
function navGroupsFor(role: UserRole): NavGroup[] {
    const isAdmin = role === 'admin';

    const groups: NavGroup[] = [
        {
            title: 'Clinic',
            items: [
                isAdmin
                    ? {
                          label: 'Overview',
                          href: route('admin.dashboard'),
                          pattern: 'admin.dashboard',
                          icon: 'sparkles',
                      }
                    : {
                          label: 'Today',
                          href: route('front_desk.dashboard'),
                          pattern: 'front_desk.dashboard',
                          icon: 'calendar',
                      },
            ],
        },
        {
            title: 'Management',
            items: [
                ...(isAdmin
                    ? [
                          {
                              label: 'Staff accounts',
                              href: route('admin.staff.index'),
                              pattern: 'admin.staff.*',
                              icon: 'shield' as IconName,
                          },
                      ]
                    : []),
                {
                    label: 'Dog owners',
                    href: route('owners.index'),
                    pattern: 'owners.*',
                    icon: 'paw',
                },
            ],
        },
    ];

    if (isAdmin) {
        groups.push({
            title: 'Clinic setup',
            items: [
                {
                    label: 'Services',
                    href: route('admin.services.index'),
                    pattern: 'admin.services.*',
                    icon: 'scissors',
                },
                {
                    label: 'Reports',
                    href: route('admin.reports.index'),
                    pattern: 'admin.reports.*',
                    icon: 'flask',
                },
                {
                    label: 'Settings',
                    href: route('admin.settings.edit'),
                    pattern: 'admin.settings.*',
                    icon: 'cog',
                },
            ],
        });
    }

    return groups;
}

/** First letters of the first two words, so the avatar chip has a label. */
function initials(name: string): string {
    const parts = name.trim().split(/\s+/).slice(0, 2);

    return (
        parts
            .map((part) => part[0]?.toUpperCase() ?? '')
            .join('') || '?'
    );
}

/**
 * The console chrome shared by clinic staff: a dark sidebar that collapses into
 * a drawer below `lg`, a sticky topbar carrying the breadcrumb and the account
 * menu, and a page heading above the content.
 *
 * The dog owner portal deliberately does not use this — clients get their own
 * layout.
 */
export default function StaffLayout({
    title,
    heading,
    description,
    actions,
    children,
}: PropsWithChildren<{
    /** Document title. */
    title: string;
    /** Large serif heading at the top of the page body. */
    heading: string;
    description?: string;
    /** Rendered to the right of the heading, e.g. the page's main actions. */
    actions?: ReactNode;
}>) {
    const user = usePage().props.auth.user;
    const url = usePage().url;

    const [sidebarOpen, setSidebarOpen] = useState(false);

    const isAdmin = user.role === 'admin';
    const navGroups = navGroupsFor(user.role);
    const homeHref = isAdmin
        ? route('admin.dashboard')
        : route('front_desk.dashboard');
    const sectionLabel = isAdmin ? 'Admin' : 'Front desk';

    /* Land on a new page and the mobile drawer should already be closed. */
    useEffect(() => {
        setSidebarOpen(false);
    }, [url]);

    /*
     * A drawer over a scrolling page feels broken, so pin the body, and let
     * Escape back out of it the way the backdrop click does.
     */
    useEffect(() => {
        if (!sidebarOpen) {
            return;
        }

        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setSidebarOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = previous;
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [sidebarOpen]);

    return (
        <div className="min-h-screen bg-[#EFFDF0] font-inter text-[#1a3d1a] antialiased">
            {/* Dimmed backdrop. Stays mounted so it can fade both ways. */}
            <div
                aria-hidden="true"
                onClick={() => setSidebarOpen(false)}
                className={`fixed inset-0 z-40 bg-[#1a3d1a]/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
                    sidebarOpen
                        ? 'opacity-100'
                        : 'pointer-events-none opacity-0'
                }`}
            />

            <aside
                className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-[#1a3d1a] transition-transform duration-300 ease-out lg:translate-x-0 ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="flex h-20 shrink-0 items-center justify-between gap-3 px-6">
                    <Link
                        href={homeHref}
                        onClick={() => setSidebarOpen(false)}
                        className="group flex items-center gap-2.5 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EFFDF0]"
                    >
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFFDF0] text-[#1a3d1a] transition-colors duration-200 group-hover:bg-white">
                            <Icon name="paw" className="h-5 w-5" />
                        </span>
                        <span className="font-serif-display text-xl leading-none text-white">
                            My<span className="text-[#E86A10]">Vet</span>
                        </span>
                    </Link>

                    <button
                        type="button"
                        onClick={() => setSidebarOpen(false)}
                        aria-label="Close navigation"
                        className="flex h-9 w-9 items-center justify-center rounded-full text-[#EFFDF0]/70 transition-colors duration-200 hover:bg-white/10 hover:text-white lg:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EFFDF0]"
                    >
                        <Icon name="close" className="h-5 w-5" />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto px-3 pb-6">
                    {navGroups.map((group) => (
                        <div key={group.title} className="mt-6 first:mt-1">
                            <p className="px-3 pb-2 text-[0.66rem] font-bold uppercase tracking-[0.16em] text-[#EFFDF0]/40">
                                {group.title}
                            </p>
                            <ul className="space-y-1">
                                {group.items.map((item) => {
                                    const active = route().current(item.pattern);

                                    return (
                                        <li key={item.label}>
                                            <Link
                                                href={item.href}
                                                onClick={() =>
                                                    setSidebarOpen(false)
                                                }
                                                aria-current={
                                                    active ? 'page' : undefined
                                                }
                                                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EFFDF0] ${
                                                    active
                                                        ? 'bg-white/10 text-white'
                                                        : 'text-[#EFFDF0]/65 hover:bg-white/5 hover:text-white'
                                                }`}
                                            >
                                                <span
                                                    aria-hidden="true"
                                                    className={`absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-[#E86A10] transition-opacity duration-150 ${
                                                        active
                                                            ? 'opacity-100'
                                                            : 'opacity-0'
                                                    }`}
                                                />
                                                <Icon
                                                    name={item.icon}
                                                    className={`h-5 w-5 shrink-0 transition-colors duration-150 ${
                                                        active
                                                            ? 'text-[#E86A10]'
                                                            : 'text-[#EFFDF0]/45 group-hover:text-[#EFFDF0]/80'
                                                    }`}
                                                />
                                                {item.label}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </nav>

                <div className="shrink-0 border-t border-white/10 p-3">
                    <Link
                        href="/"
                        onClick={() => setSidebarOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#EFFDF0]/65 transition-colors duration-200 hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EFFDF0]"
                    >
                        <Icon
                            name="arrowRight"
                            className="h-5 w-5 rotate-180 text-[#EFFDF0]/45"
                        />
                        Back to website
                    </Link>
                    <p className="px-3 pt-2 text-[0.66rem] uppercase tracking-[0.16em] text-[#EFFDF0]/30">
                        {isAdmin ? 'Admin console' : 'Front desk console'}
                    </p>
                </div>
            </aside>

            <div className="lg:pl-72">
                <header className="sticky top-0 z-30 border-b border-[#1a3d1a]/10 bg-[#EFFDF0]/85 backdrop-blur-md">
                    <div className="flex h-20 items-center gap-3 px-4 sm:px-6 lg:px-10">
                        <button
                            type="button"
                            onClick={() => setSidebarOpen(true)}
                            aria-label="Open navigation"
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#1a3d1a]/10 bg-white text-[#1a3d1a] transition-colors duration-200 hover:bg-[#EFFDF0] lg:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]"
                        >
                            <Icon name="menu" className="h-5 w-5" />
                        </button>

                        <nav
                            aria-label="Breadcrumb"
                            className="flex min-w-0 flex-1 items-center gap-2 text-sm"
                        >
                            <span className="hidden text-[#1a3d1a]/45 sm:inline">
                                {sectionLabel}
                            </span>
                            <Icon
                                name="arrowRight"
                                className="hidden h-3.5 w-3.5 shrink-0 text-[#1a3d1a]/30 sm:inline"
                            />
                            <span className="truncate font-medium text-[#1a3d1a]">
                                {heading}
                            </span>
                        </nav>

                        <Menu as="div" className="relative shrink-0">
                            <MenuButton className="flex items-center gap-2.5 rounded-full border border-[#1a3d1a]/10 bg-white py-1.5 pl-1.5 pr-3 text-left transition-colors duration-200 hover:border-[#1a3d1a]/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a]">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a3d1a] text-xs font-semibold text-white">
                                    {initials(user.name)}
                                </span>
                                <span className="hidden text-left sm:block">
                                    <span className="block max-w-[10rem] truncate text-sm font-semibold leading-tight text-[#1a3d1a]">
                                        {user.name}
                                    </span>
                                    <span className="block text-[0.68rem] leading-tight text-[#1a3d1a]/50">
                                        {roleLabels[user.role]}
                                    </span>
                                </span>
                                <Icon
                                    name="chevronDown"
                                    className="h-4 w-4 text-[#1a3d1a]/40"
                                />
                            </MenuButton>

                            <MenuItems
                                transition
                                className="absolute right-0 z-50 mt-2 w-60 origin-top-right rounded-2xl border border-[#1a3d1a]/10 bg-white p-1.5 shadow-2xl shadow-[#1a3d1a]/10 transition duration-150 ease-out focus:outline-none data-[closed]:-translate-y-1 data-[closed]:opacity-0"
                            >
                                <div className="px-3 py-2.5">
                                    <p className="truncate text-sm font-semibold text-[#1a3d1a]">
                                        {user.name}
                                    </p>
                                    <p className="truncate text-xs text-[#1a3d1a]/55">
                                        {user.email}
                                    </p>
                                </div>
                                <div className="my-1 h-px bg-[#1a3d1a]/10" />
                                <MenuItem>
                                    {({ focus }) => (
                                        <Link
                                            href={route('profile.edit')}
                                            className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-[#1a3d1a] transition-colors duration-150 ${
                                                focus ? 'bg-[#EFFDF0]' : ''
                                            }`}
                                        >
                                            <Icon
                                                name="user"
                                                className="h-4 w-4 text-[#1a3d1a]/50"
                                            />
                                            Your profile
                                        </Link>
                                    )}
                                </MenuItem>
                                <MenuItem>
                                    {({ focus }) => (
                                        <Link
                                            href={route('logout')}
                                            method="post"
                                            as="button"
                                            className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-[#1a3d1a] transition-colors duration-150 ${
                                                focus ? 'bg-[#EFFDF0]' : ''
                                            }`}
                                        >
                                            <Icon
                                                name="arrowRight"
                                                className="h-4 w-4 text-[#1a3d1a]/50"
                                            />
                                            Log out
                                        </Link>
                                    )}
                                </MenuItem>
                            </MenuItems>
                        </Menu>
                    </div>
                </header>

                <main className="px-4 pb-16 pt-8 sm:px-6 lg:px-10">
                    <div className="mx-auto max-w-7xl">
                        <div className="flex flex-wrap items-end justify-between gap-4">
                            <div className="min-w-0">
                                <h1 className="font-serif-display text-3xl leading-tight tracking-tight text-[#1a3d1a] sm:text-[2.1rem]">
                                    {heading}
                                </h1>
                                {description && (
                                    <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[#1a3d1a]/60">
                                        {description}
                                    </p>
                                )}
                            </div>

                            {actions && (
                                <div className="flex flex-wrap items-center gap-2.5">
                                    {actions}
                                </div>
                            )}
                        </div>

                        <div className="mt-8">{children}</div>
                    </div>
                </main>
            </div>

            <Head title={title} />
        </div>
    );
}
