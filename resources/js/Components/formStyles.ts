/**
 * Shared field styling for the staff console.
 *
 * Mirrors the brand fields on the auth screens (rounded-2xl, green focus ring)
 * so every console form reads the same. Kept as one source of truth rather than
 * copy-pasted per form.
 */

export const labelClass = 'block text-sm font-semibold text-[#1a3d1a]';

export const fieldClass =
    'mt-1.5 block w-full rounded-2xl border border-[#1a3d1a]/15 bg-white px-4 py-3 text-[0.95rem] text-[#1a3d1a] shadow-sm transition-[border-color,box-shadow] duration-200 placeholder:text-[#1a3d1a]/35 focus:border-[#1a3d1a] focus:outline-none focus:ring-4 focus:ring-[#1a3d1a]/15';

export const textAreaClass = `${fieldClass} resize-none`;

/** Native checkbox, re-tinted from the form plugin's default indigo. */
export const checkboxClass =
    'h-4 w-4 rounded border-[#1a3d1a]/25 text-[#1a3d1a] transition-colors duration-150 focus:ring-2 focus:ring-[#1a3d1a]/25 focus:ring-offset-0';
