/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        charcoal: '#14191D',
        module: '#1C2329',
        moduleBorder: '#2A343D',
        sage: '#8DBA99',
        sageDark: '#6B9A78',
        sand: '#D9C5B2',
        sandDark: '#B8A594',
        slate: '#E2E8F0',
        slateMuted: '#94A3B8',
        danger: '#EF4444',
        amber: '#F59E0B',
        emerald: '#10B981',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
