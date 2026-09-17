/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: 'var(--ink)',
          secondary: 'var(--ink-secondary)',
          muted: 'var(--ink-muted)',
        },
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        border: {
          DEFAULT: 'var(--border)',
          strong: 'var(--border-strong)',
        },
        signal: {
          DEFAULT: 'var(--signal)',
          hover: 'var(--signal-hover)',
          active: 'var(--signal-active)',
          tint: 'var(--signal-tint)',
        },
        strong: {
          DEFAULT: 'var(--strong)',
          tint: 'var(--strong-tint)',
        },
        gap: {
          DEFAULT: 'var(--gap)',
          tint: 'var(--gap-tint)',
        },
        'neutral-score': 'var(--neutral-score)',
        danger: {
          DEFAULT: 'var(--danger)',
          tint: 'var(--danger-tint)',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        display: ['40px', { lineHeight: '48px', fontWeight: '600', letterSpacing: '-0.01em' }],
        h1: ['26px', { lineHeight: '32px', fontWeight: '600', letterSpacing: '-0.005em' }],
        h2: ['18px', { lineHeight: '26px', fontWeight: '600' }],
        h3: ['15px', { lineHeight: '22px', fontWeight: '600' }],
        body: ['14px', { lineHeight: '21px', fontWeight: '400' }],
        'body-sm': ['13px', { lineHeight: '18px', fontWeight: '400' }],
        caption: ['12px', { lineHeight: '16px', fontWeight: '500', letterSpacing: '0.01em' }],
        'data-lg': ['30px', { lineHeight: '1.1', fontWeight: '500' }],
        'data-inline': ['13px', { lineHeight: '1', fontWeight: '500' }],
      },
      borderRadius: {
        btn: '6px',
        panel: '8px',
        badge: '4px',
      },
      spacing: {
        '15': '60px',
      },
    },
  },
  plugins: [],
};
