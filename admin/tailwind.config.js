/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        parchment: {
          50: '#fcfbf9',
          100: '#faf7f0',
          200: '#f4efe4',
          300: '#eae2d1',
          400: '#d7cbb4',
        },
        ink: {
          900: '#1a1917',
          800: '#2c2925',
          700: '#433e38',
          600: '#635d54',
          500: '#8c8477',
          400: '#aba497',
          300: '#cac4b9',
        },
        terracotta: {
          50: '#faf2f0',
          100: '#f4e2de',
          500: '#9d4233',
          600: '#853528',
          700: '#6c281d',
        }
      },
      fontFamily: {
        serif: ['Newsreader', 'Lora', 'Georgia', 'serif'],
        display: ['Playfair Display', 'Cinzel', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
