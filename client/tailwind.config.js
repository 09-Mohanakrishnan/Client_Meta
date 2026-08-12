/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        adflow: {
          blue: '#1877F2',
          hoverBlue: '#166FE5',
          lightBlue: '#E7F3FF',
          border: '#DADDE1',
          bgLight: '#F0F2F5',
          textDark: '#1C1E21',
          textSecondary: '#606770',
        },
      },
    },
  },
  plugins: [],
}
