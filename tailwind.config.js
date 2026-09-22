import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.tsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },

            colors: {
                brand: {
                    50: '#f0fdfa',
                    100: '#ccfbf1',
                    200: '#99f6e4',
                    300: '#5eead4',
                    400: '#2dd4bf',
                    500: '#14b8a6',
                    600: '#0d9488',
                    700: '#0f766e',
                    800: '#115e59',
                    900: '#134e4a',
                    950: '#042f2e',
                },
            },

            keyframes: {
                /* Tracks hold two copies of their content, so shifting by
                   exactly half the track width loops seamlessly. */
                marquee: {
                    '0%': { transform: 'translateX(0)' },
                    '100%': { transform: 'translateX(-50%)' },
                },
                'marquee-reverse': {
                    '0%': { transform: 'translateX(-50%)' },
                    '100%': { transform: 'translateX(0)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-14px)' },
                },
                blob: {
                    '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
                    '33%': { transform: 'translate(28px, -38px) scale(1.1)' },
                    '66%': { transform: 'translate(-22px, 22px) scale(0.94)' },
                },
                'fade-in': {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                'pulse-soft': {
                    '0%, 100%': { opacity: '0.55', transform: 'scale(1)' },
                    '50%': { opacity: '1', transform: 'scale(1.06)' },
                },
            },

            animation: {
                marquee: 'marquee 40s linear infinite',
                'marquee-reverse': 'marquee-reverse 40s linear infinite',
                float: 'float 6s ease-in-out infinite',
                'float-delayed': 'float 6s ease-in-out 2s infinite',
                blob: 'blob 18s ease-in-out infinite',
                'blob-delayed': 'blob 22s ease-in-out 4s infinite',
                'fade-in': 'fade-in 0.9s ease-out both',
                'pulse-soft': 'pulse-soft 3s ease-in-out infinite',
            },
        },
    },

    plugins: [forms],
};
