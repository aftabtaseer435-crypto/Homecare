import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#13251E', soft: '#3D5249', mute: '#6B7D75' },
        canvas: '#F2F5F3',
        line: '#DCE4E0',
        brand: {
          50: '#E8F3EE',
          100: '#CFE7DC',
          200: '#A3D0BB',
          500: '#159267',
          600: '#0B6E4F',
          700: '#095B41',
          800: '#084C37',
          900: '#063A2A',
        },
        paid: { DEFAULT: '#1E9E5A', soft: '#E3F5EA' },
        due: { DEFAULT: '#D63B3B', soft: '#FBE8E8' },
        plate: { DEFAULT: '#F4B400', soft: '#FFF6D6', ink: '#3A2C00' },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"Figtree Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        lift: '0 1px 0 rgba(19,37,30,0.04), 0 8px 24px -12px rgba(19,37,30,0.18)',
        plate: 'inset 0 0 0 2px rgba(19,37,30,0.85)',
      },
      borderRadius: { xl2: '1.25rem' },
      keyframes: {
        plateIn: { '0%': { opacity: '0', transform: 'translateY(6px) scale(.9)' }, '100%': { opacity: '1', transform: 'none' } },
        bubbleIn: { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'none' } },
      },
    },
  },
  plugins: [],
};
export default config;
