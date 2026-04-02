import typography from '@tailwindcss/typography';
import type { Config } from 'tailwindcss';

export default {
    darkMode: 'class',
    content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
    theme: {
        extend: {},
    },
    plugins: [typography, require('tailwindcss-animate')],
} satisfies Config;
