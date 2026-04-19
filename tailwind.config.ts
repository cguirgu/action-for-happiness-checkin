import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        warm: {
          50: '#fdf8f3',
          100: '#f9ecdb',
          200: '#f0d4ae',
          300: '#e6b984',
          500: '#d48c52',
          600: '#b36f3a',
          700: '#8a5028',
          900: '#3b2112',
        },
        dusk: {
          100: '#f7e4d7',
          200: '#eec5b5',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'ui-serif', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;
