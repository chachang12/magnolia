/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f4ff',
          100: '#e0e7ff',
          500: '#667eea',
          600: '#5a67d8',
          700: '#4c51bf',
        },
        secondary: {
          50: '#fdf2f8',
          100: '#fce7f3',
          500: '#f093fb',
          600: '#e879f9',
          700: '#d946ef',
        }
      }
    },
  },
  plugins: [],
}
