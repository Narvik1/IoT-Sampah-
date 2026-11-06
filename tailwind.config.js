/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        trash: {
          green: '#84cc16', // lime green
          red: '#ef4444',   // alert red
        }
      }
    },
  },
  plugins: [],
}

