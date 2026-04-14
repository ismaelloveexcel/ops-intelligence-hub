import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#07111f',
          800: '#0d1e32',
          700: '#112240',
          600: '#1a3356',
        },
        teal: {
          DEFAULT: '#00d4c8',
          dim: 'rgba(0,212,200,0.12)',
        },
        gold: '#c9a84c',
        danger: '#f87171',
        success: '#4ade80',
      },
      backdropBlur: {
        glass: '20px',
      },
      boxShadow: {
        glass: 'inset 0 1px 0 rgba(0,212,200,0.1), 0 8px 32px rgba(0,0,0,0.4)',
        'teal-glow': '0 0 0 2px #00d4c8, 0 0 20px rgba(0,212,200,0.4)',
        'dot-glow': '0 0 8px #00d4c8',
        'card-highlighted': 'inset 0 1px 0 rgba(0,212,200,0.15), 0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(0,212,200,0.08)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'DM Mono', 'monospace'],
      },
      letterSpacing: {
        label: '0.15em',
        wide: '0.2em',
      },
    },
  },
  plugins: [],
}
export default config
