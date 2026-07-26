/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Map Tailwind's default grays to our Vanilla CSS theme variables for automatic dark mode
        gray: {
          50: 'var(--bg-main)',
          100: 'var(--surface-hover)',
          200: 'var(--border-main)',
          300: 'var(--border-main)',
          400: 'var(--text-muted)',
          500: 'var(--text-muted)',
          600: 'var(--text-muted)',
          700: 'var(--text-main)',
          800: 'var(--text-main)',
          900: 'var(--text-main)',
        },
        // Map Tailwind's blues to the primary brand colors
        blue: {
          50: 'var(--primary-glow)',
          100: 'var(--primary-glow)',
          500: 'var(--primary)',
          600: 'var(--primary)',
          700: 'var(--primary-hover)',
          800: 'var(--primary)',
          900: 'var(--primary)',
        }
      }
    },
  },
  corePlugins: {
    preflight: false, // Disable preflight so it doesn't conflict with Vanilla CSS
  },
  plugins: [],
}
