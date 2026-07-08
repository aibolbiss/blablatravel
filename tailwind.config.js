/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#F3F6F4',
        ink: '#14231F',
        mut: '#5C6E67',
        line: '#DCE5E0',
        route: { DEFAULT: '#4D6EE3', dark: '#6a86ea', light: '#E3F0EB' },
        amber: { way: '#F5A524' },
        night: '#101B18',
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(20,35,31,.06), 0 8px 24px -12px rgba(20,35,31,.14)',
      },
    },
  },
  plugins: [],
};
