/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#C8102E',
          hover: '#A50D26',
          soft: '#FDECEF',
        },
        ink: '#1F2937',
        muted: '#6B7280',
        surface: '#F3F4F6',
      },
      fontFamily: {
        heading: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(15, 23, 42, 0.06), 0 6px 20px rgba(15, 23, 42, 0.05)',
        'card-hover': '0 4px 10px rgba(15, 23, 42, 0.08), 0 12px 30px rgba(200, 16, 46, 0.12)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.35s ease-out',
      },
    },
  },
  plugins: [],
};
