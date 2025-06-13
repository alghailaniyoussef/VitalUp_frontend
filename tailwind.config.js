/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [
    function({ addUtilities, addVariant }) {
      // Add RTL/LTR direction utilities
      addUtilities({
        '.rtl': {
          direction: 'rtl',
        },
        '.ltr': {
          direction: 'ltr',
        },
      })
      
      // Add RTL variant
      addVariant('rtl', '[dir="rtl"] &')
      addVariant('ltr', '[dir="ltr"] &')
    }
  ],
}