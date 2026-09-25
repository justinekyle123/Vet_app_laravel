/**
 * Shared button styling for the staff console.
 *
 * Every console action is a pill: orange for the primary action on a page or
 * form, white with a hairline border for everything secondary.
 */

/** Primary action — the orange pill. */
export const primaryButtonClass =
    'inline-flex items-center justify-center gap-2 rounded-full bg-[#E86A10] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#E86A10]/25 transition-colors duration-200 hover:bg-[#d45e0d] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-[#E86A10] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E86A10] focus-visible:ring-offset-2';

/** Secondary action — white pill, hairline border. */
export const secondaryButtonClass =
    'inline-flex items-center justify-center gap-2 rounded-full border border-[#1a3d1a]/15 bg-white px-4 py-2.5 text-sm font-semibold text-[#1a3d1a] transition-colors duration-200 hover:bg-[#EFFDF0] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a] focus-visible:ring-offset-2';

/** Row-level action, sized to sit inside a table row beside its record. */
export const rowButtonClass =
    'inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-[#1a3d1a]/15 bg-white px-3.5 py-2 text-xs font-semibold text-[#1a3d1a] transition-colors duration-200 hover:bg-[#EFFDF0] disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3d1a] focus-visible:ring-offset-2';

/**
 * Destructive row action — same shape, but it reads as a warning rather than a
 * neutral control.
 */
export const dangerButtonClass =
    'inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-[#b3261e]/25 bg-white px-4 py-2.5 text-sm font-semibold text-[#b3261e] transition-colors duration-200 hover:bg-[#b3261e]/5 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b3261e] focus-visible:ring-offset-2';
