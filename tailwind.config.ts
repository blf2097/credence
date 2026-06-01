import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Credence palette — gambling/crypto vibe, dark first
        bg: {
          DEFAULT: '#0a0a0b',
          elevated: '#141416',
          card: '#1a1a1d',
        },
        accent: {
          DEFAULT: '#22c55e', // yes/up
          danger: '#ef4444',  // no/down
          gold: '#f59e0b',
        },
        fg: {
          DEFAULT: '#fafafa',
          muted: '#a1a1aa',
          subtle: '#71717a',
        },
        border: {
          DEFAULT: '#27272a',
          strong: '#3f3f46',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
