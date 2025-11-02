/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        surface: {
          light: '#f6f9f4',
          DEFAULT: '#ffffff',
          dark: '#0b1b13',
        },
      },
      fontFamily: {
        display: ['"Poppins"', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', '"Segoe UI"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 20px 45px -25px rgba(21, 128, 61, 0.45)',
      },
    },
  },
  plugins: [],
};
