import type { Config } from 'tailwindcss';

// All text/background pairs below are chosen for WCAG AA (≥ 4.5:1 for body text).
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#18241F', soft: '#36463F', mute: '#5B6B64' }, // on white: 15:1, 10:1, 5.7:1
        canvas: '#F7F9F8',
        line: '#E2E8E5',
        brand: {
          50: '#EFF8F4',
          100: '#DDF0E7',
          200: '#B9E0CE',
          500: '#1F9A70',
          600: '#147A59', // white text 5.2:1
          700: '#0F654A',
          800: '#0C4F3A',
          900: '#0A3D2D',
        },
        // Module colours — each part of the app has its own identity
        society: { DEFAULT: '#147A59', soft: '#EFF8F4', ink: '#0C4F3A' },
        service: { DEFAULT: '#2F5BD3', soft: '#EEF2FD', ink: '#1E3A8A' },
        property: { DEFAULT: '#7442C8', soft: '#F4EFFC', ink: '#4C1D95' },
        // Status colours (white text ≥ 4.5:1)
        paid: { DEFAULT: '#15803D', soft: '#DCF3E4', ink: '#14532D' },
        due: { DEFAULT: '#C62828', soft: '#FCE4E4', ink: '#7F1D1D' },
        part: { DEFAULT: '#C2410C', soft: '#FDEBDD', ink: '#7C2D12' },
        plate: { DEFAULT: '#F4B400', soft: '#FFF4CC', ink: '#2E2300' },
        wa: { DEFAULT: '#178A4A', hover: '#11703B' },
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Inter Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        urdu: ['"Noto Nastaliq Urdu Variable"', '"Jameel Noori Nastaleeq"', 'serif'],
      },
      boxShadow: {
        lift: '0 1px 2px rgba(24,36,31,0.04), 0 10px 30px -18px rgba(24,36,31,0.18)',
        soft: '0 1px 2px rgba(24,36,31,0.04), 0 4px 16px -8px rgba(24,36,31,0.10)',
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
