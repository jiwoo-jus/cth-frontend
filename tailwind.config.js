/* eslint-env node */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        // 🎯 Primary (Brand)
        'custom-blue': '#2563EB',
        'custom-blue-hover': '#1D4ED8',
        'custom-blue-deep': '#1E40AF',
        'custom-blue-bg': '#EFF6FF',

        // Custom Green Colors
        'custom-green': '#059669',
        'custom-green-hover': '#047857',
        'custom-green-deep': '#0B815A',

        // ⚫ Grayscale
        'custom-text': '#1F2937',
        'custom-text-subtle': '#6B7280',
        'custom-border': '#E5E7EB',
        'custom-input-bg': '#F9FAFC',

        // 🟢 Semantic Colors
        'custom-disabled': '#9CA3AF',
        'custom-success': '#10B981',
        'custom-warning': '#F59E0B',
        'custom-error': '#EF4444',
        'custom-info': '#0EA5E9',

        // 🪄 Secondary Accents (New)
        'custom-accent-teal': '#0D9488',
        'custom-accent-indigo': '#6366F1',
        'custom-bg-soft': '#F8FAFC',
      },
      keyframes: {
        // 예시 placeholder 애니메이션
        placeholderCycle: {
          '0%': { opacity: '1', transform: 'translateY(0)' },
          '10%': { opacity: '1', transform: 'translateY(-100%)' },
          '20%': { opacity: '1', transform: 'translateY(-200%)' },
          '30%': { opacity: '1', transform: 'translateY(-300%)' },
          '40%': { opacity: '1', transform: 'translateY(-400%)' },
          // 필요한 문구 개수만큼 % 구간을 쪼개주세요
          '100%': { opacity: '1', transform: 'translateY(-400%)' },
        },
      },
      animation: {
        // 10초 동안 placeholderCycle 반복
        'placeholder-cycle': 'placeholderCycle 10s infinite ease-in-out',
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar'),
    // 필요하다면 추가:
    // require('@tailwindcss/forms'),
    // require('@tailwindcss/container-queries'),
  ],
};
