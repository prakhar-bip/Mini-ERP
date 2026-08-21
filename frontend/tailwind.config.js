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
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInScale: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInDown: {
          '0%': { opacity: '0', transform: 'translateY(-16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        dash: {
          to: { 'stroke-dashoffset': '-20' },
        },
        pulseSlow: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.65', transform: 'scale(1.05)' },
        },
        glow: {
          '0%, 100%': { filter: 'drop-shadow(0 0 6px rgba(250, 84, 28, 0.4))' },
          '50%': { filter: 'drop-shadow(0 0 16px rgba(250, 84, 28, 0.8))' },
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        fadeInScale: 'fadeInScale 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        slideInRight: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        slideInDown: 'slideInDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        float: 'float 3.5s ease-in-out infinite',
        shimmer: 'shimmer 1.8s infinite linear',
        dash: 'dash 1.5s linear infinite',
        pulseSlow: 'pulseSlow 2.5s ease-in-out infinite',
        glow: 'glow 3s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
