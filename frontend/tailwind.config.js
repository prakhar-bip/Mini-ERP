/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0B1941',
          800: '#0F2356',
          700: '#163375',
          600: '#1E429F',
        },
        brand: {
          orange: '#FA541C',
          hover: '#E04816',
          light: '#FFF2E8',
          subtle: '#FFF7E6',
        },
        surface: {
          canvas: '#F4F5F7',
          card: '#FFFFFF',
          border: '#E5E7EB',
          muted: '#F9FAFB',
        }
      }
    },
  },
  plugins: [],
}
