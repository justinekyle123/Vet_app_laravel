import { Star } from 'lucide-react';

/**
 * Star ratings for the owner portal.
 *
 * `StarRating` renders a score someone else gave — a service's average or a
 * review's own rating — so it is presentational and readable by screen readers
 * as a labelled value. `StarPicker` is the input the review form uses.
 *
 * Both draw five stars in the same size so a score and a control sitting near
 * each other line up.
 */

const sizes = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-6 w-6',
} as const;

export default function StarRating({
    value,
    size = 'md',
    className = '',
}: {
    /** The score to show, e.g. 4 or 4.3. Rounded to the nearest star. */
    value: number;
    size?: keyof typeof sizes;
    className?: string;
}) {
    const filled = Math.round(value);

    return (
        <span
            className={`inline-flex items-center gap-0.5 ${className}`}
            role="img"
            aria-label={`${value} out of 5 stars`}
        >
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    aria-hidden="true"
                    className={`${sizes[size]} ${
                        star <= filled
                            ? 'fill-[#E86A10] text-[#E86A10]'
                            : 'fill-transparent text-[#1a3d1a]/25'
                    }`}
                />
            ))}
        </span>
    );
}

/** The rating control: five buttons, keyboard reachable, one tap to score. */
export function StarPicker({
    value,
    onChange,
    disabled = false,
}: {
    value: number;
    onChange: (rating: number) => void;
    disabled?: boolean;
}) {
    const labels = ['Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

    return (
        <div
            className="flex items-center gap-1"
            role="radiogroup"
            aria-label="Rating"
        >
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    role="radio"
                    aria-checked={value === star}
                    aria-label={`${star} star${star === 1 ? '' : 's'} — ${
                        labels[star - 1]
                    }`}
                    disabled={disabled}
                    onClick={() => onChange(star)}
                    className="rounded-full p-1 transition-transform duration-150 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <Star
                        aria-hidden="true"
                        className={`h-7 w-7 transition-colors duration-150 ${
                            star <= value
                                ? 'fill-[#E86A10] text-[#E86A10]'
                                : 'fill-transparent text-[#1a3d1a]/25'
                        }`}
                    />
                </button>
            ))}
        </div>
    );
}
