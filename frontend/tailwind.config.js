/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          marble: 'var(--color-canvas-marble)',
          parchment: 'var(--color-canvas-parchment)',
        },
        sky: {
          light: 'var(--color-sky-light)',
          blue: 'var(--color-sky-blue)',
        },
        gold: {
          deep: 'var(--color-gold-deep)',
          light: 'var(--color-gold-light)',
        },
        ink: {
          900: 'var(--color-ink-900)',
          800: 'var(--color-ink-800)',
          600: 'var(--color-ink-600)',
          400: 'var(--color-ink-400)',
        },
        bench: {
          og: 'var(--color-bench-og)',
          'og-bg': 'var(--color-bench-og-bg)',
          oo: 'var(--color-bench-oo)',
          'oo-bg': 'var(--color-bench-oo-bg)',
          cg: 'var(--color-bench-cg)',
          'cg-bg': 'var(--color-bench-cg-bg)',
          co: 'var(--color-bench-co)',
          'co-bg': 'var(--color-bench-co-bg)',
        },
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'serif'],
        roman: ['var(--font-roman)', 'serif'],
        sans: ['var(--font-sans)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
