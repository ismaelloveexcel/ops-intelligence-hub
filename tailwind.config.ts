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
          900: '#0B1C2C',
          800: '#0f2438',
          700: '#142d45',
          600: '#1a3856',
        },
        gold: {
          DEFAULT: '#C9A646',
          dim: 'rgba(201,166,70,0.12)',
        },
        accent: '#C9A646',
        danger: '#f87171',
        success: '#4ade80',
        'blue-teal': '#0099cc',
      },
      backdropBlur: {
        glass: '20px',
      },
      boxShadow: {
        glass: 'inset 0 1px 0 rgba(201,166,70,0.08), 0 8px 32px rgba(0,0,0,0.4)',
        'gold-glow': '0 0 0 2px #C9A646, 0 0 20px rgba(201,166,70,0.3)',
        'dot-glow': '0 0 8px #C9A646',
        'card-highlighted': 'inset 0 1px 0 rgba(201,166,70,0.12), 0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(201,166,70,0.06)',
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
