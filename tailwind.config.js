/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0F172A',
          surface: '#1E293B',
          elevated: '#334155',
        },
        brand: {
          DEFAULT: '#10B981',
          hi: '#34D399',
          dim: '#059669',
        },
        ink: {
          DEFAULT: '#F1F5F9',
          dim: '#94A3B8',
          muted: '#64748B',
        },
        line: '#475569',
        danger: '#EF4444',
        warning: '#F59E0B',
        success: '#22C55E',
        info: '#3B82F6',
      },
      fontFamily: {
        sans: ['Inter_400Regular'],
        medium: ['Inter_500Medium'],
        semibold: ['Inter_600SemiBold'],
        bold: ['Inter_700Bold'],
        black: ['Inter_900Black'],
      },
    },
  },
  plugins: [],
};
