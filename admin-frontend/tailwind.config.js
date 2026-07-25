/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-grotesk)', 'var(--font-inter)', 'sans-serif'],
        heading: ['var(--font-grotesk)', 'sans-serif'],
        display: ['var(--font-grotesk)', 'sans-serif'],
        body: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        background: '#09090B',
        foreground: '#FAFAFA',
        muted: '#27272A',
        mutedFg: '#A1A1AA',
        accent: '#DFE104',
        accentFg: '#000000',
        zincBorder: '#3F3F46',
        adminBg: '#09090B',
        adminCard: '#09090B',
        adminBorder: '#3F3F46',
        adminAccent: '#DFE104',
        btcOrange: '#DFE104',
        digitalGold: '#DFE104',
      },
      borderRadius: {
        DEFAULT: '0px',
        none: '0px',
      },
    },
  },
  plugins: [],
};
