/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--color-bg) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        mut: 'rgb(var(--color-mut) / <alpha-value>)',
        line: 'rgb(var(--color-line) / <alpha-value>)',
        night: 'rgb(var(--color-night) / <alpha-value>)',
        route: {
          DEFAULT: 'rgb(var(--color-route) / <alpha-value>)',
          dark: 'rgb(var(--color-route-dark) / <alpha-value>)',
          light: 'rgb(var(--color-route-light) / <alpha-value>)',
        },
        amber: { way: '#F5A524' },
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
