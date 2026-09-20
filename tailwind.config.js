/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f5fa',
          100: '#dce7f3',
          200: '#bed4ea',
          300: '#91b8dc',
          400: '#5e96cb',
          500: '#3c79b9',
          600: '#2b5f9a',
          700: '#244d7d',
          800: '#1b3c63',
          900: '#0f243d',
          950: '#0a1626',
        },
        ship: {
          gold: '#e6a117',
          accent: '#00a3e0',
          dark: '#0e1726',
          card: '#162236',
          cardLight: '#ffffff',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
