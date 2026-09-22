import CountUp from './CountUp';
import Icon, { IconName } from './Icon';

interface StatCardProps {
    label: string;
    value: number;
    icon?: IconName;
    /** Small caption under the value. */
    hint?: string;
}

export default function StatCard({ label, value, icon, hint }: StatCardProps) {
    return (
        <div className="overflow-hidden bg-white p-6 shadow-sm sm:rounded-lg">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-500">{label}</p>
                {icon && (
                    <Icon name={icon} className="h-5 w-5 text-emerald-600" />
                )}
            </div>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
                <CountUp end={value} />
            </p>
            {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
        </div>
    );
}
