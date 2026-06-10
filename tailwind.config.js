/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        playfair: ['"Playfair Display"', 'Georgia', 'serif'],
        inter: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        cream: '#FAF7F2',
        rose: {
          50: '#FDF0F5',
          100: '#FBECF0',
          200: '#F5D0DE',
          300: '#EDB5C8',
          400: '#E296AF',
          500: '#D4789A',
          600: '#BB5C83',
        },
        bordeaux: {
          DEFAULT: '#8B2635',
          dark: '#6B1D2A',
          light: '#A8404F',
        },
        chocolat: {
          DEFAULT: '#4A2C17',
          dark: '#2E1A0A',
          light: '#7A4A2C',
        },
        beige: {
          DEFAULT: '#D4C4A8',
          light: '#EDE3D0',
          dark: '#B5A080',
        },
        warmgray: {
          400: '#9E8E8E',
          500: '#7A6B6B',
          600: '#5C4F4F',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        soft: '0 2px 16px rgba(139, 38, 53, 0.06)',
        card: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)',
      },
    },
  },
  plugins: [],
}
