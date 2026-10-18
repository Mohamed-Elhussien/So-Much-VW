/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    screens: {
      xs: '420px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        cream: '#FBF3F0',
        surface: '#FFFDFB',
        ink: '#2B1B24',
        gold: {
          DEFAULT: '#C9A15B',
          light: '#E3C58A',
          dark: '#A67F3E',
        },
        rose: {
          DEFAULT: '#E8B4B8',
          light: '#F3D6D8',
        },
        berry: '#8C2F39',
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'serif'],
        body: ['var(--font-manrope)', 'sans-serif'],
      },
      borderRadius: {
        swatch: '999px 999px 24px 24px',
      },
      keyframes: {
        'swatch-in': {
          '0%': { opacity: '0', transform: 'translateY(16px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 1px rgba(201,161,91,0.3), 0 0 20px -4px rgba(201,161,91,0.35)' },
          '50%': { boxShadow: '0 0 0 1px rgba(201,161,91,0.55), 0 0 34px -2px rgba(201,161,91,0.6)' },
        },
        'blob-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.7' },
          '50%': { transform: 'scale(1.15)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
        'dust-float': {
          '0%': { transform: 'translateY(0) translateX(0)', opacity: '0' },
          '10%': { opacity: 'var(--dust-opacity, 0.5)' },
          '90%': { opacity: 'var(--dust-opacity, 0.5)' },
          '100%': { transform: 'translateY(-140px) translateX(var(--dust-drift, 10px))', opacity: '0' },
        },
      },
      animation: {
        'swatch-in': 'swatch-in 0.6s cubic-bezier(0.16,1,0.3,1) forwards',
        'pulse-glow': 'pulse-glow 2.6s ease-in-out infinite',
        'blob-pulse': 'blob-pulse 8s ease-in-out infinite',
        shimmer: 'shimmer 3s linear infinite',
        'dust-float': 'dust-float linear infinite',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(201,161,91,0.25), 0 12px 32px -12px rgba(43,27,36,0.28)',
        'glow-lg': '0 0 0 1px rgba(201,161,91,0.4), 0 24px 60px -16px rgba(43,27,36,0.35), 0 0 40px -8px rgba(201,161,91,0.35)',
        'glow-dark': '0 0 0 1px rgba(255,255,255,0.08), 0 20px 50px -14px rgba(0,0,0,0.55), 0 0 30px -6px rgba(201,161,91,0.25)',
      },
    },
  },
  plugins: [],
}
