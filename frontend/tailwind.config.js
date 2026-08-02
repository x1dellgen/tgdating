/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'scale-in': 'scale-in 0.25s ease-out',
      },
      colors: {
        premium: {
          bg: '#0b0e17',
          surface: 'rgba(255,255,255,0.05)',
          border: 'rgba(255,255,255,0.1)',
          pink: '#ec4899',
          'pink-glow': 'rgba(236,72,153,0.4)',
          blue: '#3b82f6',
          'blue-glow': 'rgba(59,130,246,0.4)',
          purple: '#8b5cf6',
        },
      },
      backgroundImage: {
        'premium-gradient': 'radial-gradient(ellipse at 50% 0%, #1a1f35 0%, #0b0e17 65%)',
        'title-gradient': 'linear-gradient(135deg, #c084fc 0%, #a78bfa 25%, #818cf8 50%, #3b82f6 100%)',
      },
    },
  },
  plugins: [],
};
