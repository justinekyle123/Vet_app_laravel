import { ReactNode } from 'react';
import Icon, { IconName } from './Icon';

interface DashboardCardProps {
    title: string;
    icon?: IconName;
    /** Rendered top-right of the card header, e.g. a link or count. */
    action?: ReactNode;
    children: ReactNode;
}

/**
 * A titled panel used across the role dashboards so every area reads the same.
 */
export default function DashboardCard({
    title,
    icon,
    action,
    children,
}: DashboardCardProps) {
    return (
        <section className="flex flex-col overflow-hidden bg-white shadow-sm sm:rounded-lg">
            <header className="flex items-center justify-between gap-3 border-b border-gray-100 px-6 py-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                    {icon && (
                        <Icon name={icon} className="h-5 w-5 text-emerald-600" />
                    )}
                    {title}
                </h3>
                {action}
            </header>
            <div className="flex flex-1 flex-col p-6">{children}</div>
        </section>
    );
}

/**
 * The placeholder shown while a widget has no data (or no feature yet).
 */
export function EmptyState({ message }: { message: string }) {
    return <p className="my-auto text-sm text-gray-500">{message}</p>;
}
