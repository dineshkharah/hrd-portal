import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        lime: '#AAFF47',
        ink: '#0D0D0B',
        cream: '#F0EDE5',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['Geist', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
