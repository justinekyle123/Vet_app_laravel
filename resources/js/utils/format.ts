/**
 * Display helpers shared by the staff console pages.
 *
 * Small and dependency-free on purpose — the console needs readable labels, not
 * a date or money library.
 */

/** First letters of the first two words, so an avatar chip has a label. */
export function initials(name: string): string {
    const parts = name.trim().split(/\s+/).slice(0, 2);

    return (
        parts
            .map((part) => part[0]?.toUpperCase() ?? '')
            .join('') || '?'
    );
}

/**
 * Money as the clinic would write it. Eloquent hands decimals back as strings,
 * so both shapes are accepted.
 */
export function currency(value: string | number | null): string {
    const amount = typeof value === 'string' ? Number.parseFloat(value) : value;

    if (amount === null || Number.isNaN(amount)) {
        return '—';
    }

    return amount.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
    });
}

/**
 * Date and time together, for records where both matter — a message, a reply,
 * anything with a moment attached rather than a calendar day.
 */
export function dateTime(iso: string | null): string {
    if (!iso) {
        return '—';
    }

    const date = new Date(iso);

    return Number.isNaN(date.getTime())
        ? '—'
        : date.toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
          });
}

/** Exact calendar date, for records where "3 weeks ago" would be imprecise. */
export function longDate(iso: string | null): string {
    if (!iso) {
        return '—';
    }

    const date = new Date(iso);

    return Number.isNaN(date.getTime())
        ? '—'
        : date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
          });
}
