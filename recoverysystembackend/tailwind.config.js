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
          DEFAULT: '#0ea5e9',
          dark: '#0284c7',
        },
        secondary: {
          DEFAULT: '#6366f1',
          dark: '#4f46e5',
        },
      },
    },
  },
  plugins: [],
} 