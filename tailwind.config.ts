import type { Config } from 'tailwindcss';

// All text/background pairs below are chosen for WCAG AA (≥ 4.5:1 for body text).
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#0F1F19', soft: '#2B3D35', mute: '#4A5C54' }, // on white: 17:1, 11:1, 7:1
        canvas: '#F4F7F5',
        line: '#D2DCD7',
        brand: {
          50: '#E7F4EE',
          100: '#CBE8DA',
          200: '#9DD3BA',
          500: '#13895F',
          600: '#0B6E4F', // white text 6.1:1
          700: '#095A41',
          800: '#074633',
          900: '#053527',
        },
        // Module colours — each part of the app has its own identity
        society: { DEFAULT: '#0B6E4F', soft: '#E7F4EE', ink: '#074633' },
        service: { DEFAULT: '#1D4ED8', soft: '#E8EEFD', ink: '#1E3A8A' },
        property: { DEFAULT: '#6D28D9', soft: '#F1EBFD', ink: '#4C1D95' },
        // Status colours (white text ≥ 4.5:1)
        paid: { DEFAULT: '#15803D', soft: '#DCF3E4', ink: '#14532D' },
        due: { DEFAULT: '#C62828', soft: '#FCE4E4', ink: '#7F1D1D' },
        part: { DEFAULT: '#C2410C', soft: '#FDEBDD', ink: '#7C2D12' },
        plate: { DEFAULT: '#F4B400', soft: '#FFF4CC', ink: '#2E2300' },
        wa: { DEFAULT: '#0F7A3D', hover: '#0B5F2F' },
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Inter Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        urdu: ['"Noto Nastaliq Urdu Variable"', '"Jameel Noori Nastaleeq"', 'serif'],
      },
      boxShadow: {
        lift: '0 1px 2px rgba(15,31,25,0.06), 0 12px 32px -16px rgba(15,31,25,0.22)',
        plate: 'inset 0 0 0 1.5px rgba(15,31,25,0.85)',
      },
      keyframes: {
        plateIn: { '0%': { opacity: '0', transform: 'translateY(6px) scale(.9)' }, '100%': { opacity: '1', transform: 'none' } },
        bubbleIn: { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'none' } },
        ticker: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(50%)' } },
        drawerIn: { '0%': { transform: 'translateX(100%)' }, '100%': { transform: 'none' } },
      },
    },
  },
  plugins: [],
};
export default config;
