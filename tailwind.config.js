/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Figtree', 'Avenir Next', 'Segoe UI', 'system-ui', 'sans-serif'],
        display: ['"Bricolage Grotesque"', 'Avenir Next', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Study2Gate palette, taken from the S2G logo and the home page.
        brand: {
          dark: '#0A2F33',    // deep teal ink
          blue: '#2F8A66',    // "2Gate" green in the wordmark (name kept for existing classes)
          accent: '#0B4A50',  // logo teal
          light: '#F2F8F5'    // mint page background
        },
        // Teal-tinted neutral scale. Replaces Tailwind's cold blue-grey, so every
        // existing slate-* class (text, borders, surfaces) picks up the new look.
        slate: {
          50:  '#F2F8F5',
          100: '#E7F1EC',
          200: '#D0E3D9',
          300: '#B7D5C8',
          400: '#8AA9A1',
          500: '#587573',
          600: '#4A6866',
          700: '#345250',
          800: '#16393D',
          900: '#0A2F33',
          950: '#061F22',
        },
        // Backed by CSS variables in index.css (--accent-rgb etc.), set
        // per html[data-accent="..."]. The rgb(var(...) / <alpha-value>)
        // form is what lets Tailwind's opacity modifiers (bg-accent/40)
        // work natively — a plain var(--accent) string can't be given an
        // alpha channel by Tailwind, but a space-separated RGB triplet can.
        // This is pure CSS custom-property resolution: no JavaScript
        // recolors anything, so changing the accent is exactly as cheap as
        // any other CSS cascade recalculation the browser already does.
        accent: {
          DEFAULT: 'rgb(var(--accent-rgb) / <alpha-value>)',
          soft: 'rgb(var(--accent-soft-rgb) / <alpha-value>)',
          hover: 'rgb(var(--accent-hover-rgb) / <alpha-value>)',
        },
      }
    },
  },
  plugins: [],
}
