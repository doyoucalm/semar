import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink:      '#0f0a06',
        card:     '#1a1209',
        elevated: '#231a10',
        parchment: '#e8d9c0',
        muted:    '#9a8672',
        gold:     '#c9a84c',
        ember:    '#c44a30',
        sage:     '#3d6b54',
        border:   'rgba(201,168,76,0.2)',
      },
      fontFamily: {
        serif:   ['var(--font-serif)', 'Georgia', 'serif'],
        cn:      ['var(--font-cn)', 'serif'],
        mono:    ['var(--font-mono)', 'monospace'],
      },
      keyframes: {
        flipCoin: {
          '0%':   { transform: 'rotateX(0deg)' },
          '40%':  { transform: 'rotateX(900deg) scale(0.85)' },
          '100%': { transform: 'rotateX(1080deg) scale(1)' },
        },
        lineGrow: {
          '0%':   { width: '0%', opacity: '0' },
          '100%': { width: '100%', opacity: '1' },
        },
        cardFlip: {
          '0%':   { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(180deg)' },
        },
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulse_gold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(201,168,76,0)' },
          '50%':      { boxShadow: '0 0 0 6px rgba(201,168,76,0.15)' },
        },
      },
      animation: {
        'flip-coin':  'flipCoin 0.55s ease-in-out',
        'line-grow':  'lineGrow 0.35s ease-out forwards',
        'card-flip':  'cardFlip 0.5s ease-in-out forwards',
        'fade-up':    'fadeUp 0.4s ease-out forwards',
        'pulse-gold': 'pulse_gold 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
export default config;
