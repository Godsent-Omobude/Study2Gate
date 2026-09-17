/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#031B4E',
          blue: '#0A44A4',
          accent: '#1E64D6',
          light: '#F4F7FE'
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
