/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FDF8F5',
        blush: '#F5E6E0',
        'rose-gold': '#B76E79',
        'rose-dark': '#9A5A64',
        'rose-light': '#E8C4C4',
        charcoal: '#2D2A32',
        gold: '#C9A962',
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'serif'],
        body: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 20px rgba(183, 110, 121, 0.12)',
        card: '0 8px 30px rgba(45, 42, 50, 0.08)',
      },
    },
  },
  plugins: [],
};
