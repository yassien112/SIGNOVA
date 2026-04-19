/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1E3A8A',
          hover:   '#1e40af',
        },
        bg: {
          main:      '#0F172A',
          secondary: '#1F2937',
        },
      },
      fontFamily: {
        sans:  ['Inter',  'sans-serif'],
        cairo: ['Cairo',  'sans-serif'],
      },
      animation: {
        'fade-in':   'fadeIn 0.3s ease both',
        'slide-up':  'slideUp 0.3s ease both',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 },                      to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'none' } },
      },
    },
  },
  plugins: [],
};
