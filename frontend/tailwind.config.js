/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'primary-black': '#181818',
        'kenyan-red': '#DC2727',
        'kenyan-green': '#0F893A',
        'gold': '#FFD600',
        'electric-blue': '#0066FF',
        'glass-bg': 'rgba(255,255,255,0.75)',
      },
      borderRadius: {
        '2xl': '1.25rem',
      },
      boxShadow: {
        'lg': '0 4px 32px rgba(0,0,0,.25)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};