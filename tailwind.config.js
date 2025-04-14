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
        'custom-blue': '#2563EB',             // base
        'custom-blue-hover': '#1D4ED8',       // hover
        'custom-blue-deep': '#1E40AF',        // deep title/accent
        'custom-blue-bg': '#EFF6FF',          // light bg (card, tab)

        // ⚫ Grayscale
        'custom-text': '#1F2937',             // main text
        'custom-text-subtle': '#6B7280',      // secondary text
        'custom-border': '#E5E7EB',           // border color
        'custom-input-bg': '#F9FAFC',         // input bg / hover bg

        // 🟢 Semantic Colors
        'custom-disabled': '#9CA3AF',          // disabled
        'custom-success': '#10B981',          // success
        'custom-warning': '#F59E0B',          // warning
        'custom-error': '#EF4444',            // error
        'custom-info': '#0EA5E9',             // info

        // 🪄 Secondary Accents (New)
        'custom-accent-teal': '#0D9488',      // tabs / soft highlight
        'custom-accent-indigo': '#6366F1',    // structured info, headings
        'custom-bg-soft': '#F8FAFC',          // card section bg (very light)
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar') 
  ],
};
