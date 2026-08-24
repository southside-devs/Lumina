/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        sans: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          orange: '#E85002', black: '#000000', white: '#F9F9F9',
          lightgray: '#A7A7A7', gray: '#646464', darkgray: '#333333',
        },
        gradient: { stop1: '#000000', stop2: '#C10801', stop3: '#F16001', stop4: '#D9C3AB' }
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #000000 0%, #C10801 33%, #F16001 66%, #D9C3AB 100%)',
      },
      boxShadow: {
        'brand-glow': '0 0 20px rgba(232, 80, 2, 0.4)',
        'card-glow': '0 10px 30px -10px rgba(232, 80, 2, 0.15)',
      }
    },
  },
  plugins: [],
};
