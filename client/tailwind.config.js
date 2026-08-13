/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        green: {
          50: '#e6f2ee',
          100: '#ccdfd7',
          200: '#99c0b0',
          300: '#66a089',
          400: '#338162',
          500: '#006b4c',
          600: '#006b4c',
          700: '#00593f',
          800: '#004732',
          900: '#003626',
        },
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
      fontFamily: {
        sans: ['"Optimistic 95"', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
