/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#E7A242',
        secondary: '#4BA6AE',
      },
      fontFamily: {
        sans:["Poppins","sans"],
      }
    },
  },

  plugins: [],
}


