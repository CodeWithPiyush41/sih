/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#F8FAFC',
        surface: '#FFFFFF',
        primary: {
          DEFAULT: '#044B39',
          light: '#1EA97B',
          dark: '#053438',
        },
        secondary: {
          DEFAULT: '#72C613',
          light: '#CBF39D',
          dark: '#264B04',
        },
        info: {
          DEFAULT: '#2180E6',
          light: '#BDF0EC',
        },
        accent: {
          DEFAULT: '#C8EFC1',
        },
        text: {
          DEFAULT: '#0F172A',
          secondary: '#64748B',
        },
        border: {
          DEFAULT: '#E2E8F0',
        },
        success: '#16A34A',
        warning: '#F59E0B',
        danger: '#DC2626',
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        display: ['40px', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.02em' }],
        h1: ['32px', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.01em' }],
        h2: ['26px', { lineHeight: '1.3', fontWeight: '600' }],
        h3: ['18px', { lineHeight: '1.4', fontWeight: '600' }],
        h4: ['16px', { lineHeight: '1.5', fontWeight: '600' }],
        body: ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        caption: ['13px', { lineHeight: '1.5', fontWeight: '400' }],
      },
      borderRadius: {
        xl: '12px',
        lg: '8px',
        md: '6px',
        sm: '4px',
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'floating': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
};
