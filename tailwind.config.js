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
          'custom-blue': '#2563EB',
          'custom-blue-hover': '#1D4ED8',
          'custom-blue-deep': '#1E40AF',
          'custom-blue-bg': '#EFF6FF',
          'custom-text': '#374151',
          'custom-text-subtle': '#4B5563',
          'custom-border': '#E5E7EB',
          'custom-input-bg': '#F9FAFB',
          'custom-success': '#10B981',
          'custom-warning': '#F59E0B',
          'custom-error': '#EF4444',
          'custom-info': '#0EA5E9',
        },
      },
    },
    plugins: [],
  }
  