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
        // Kinetic Typography Design Tokens
        background: '#09090B',
        foreground: '#FAFAFA',
        muted: '#27272A',
        mutedFg: '#A1A1AA',
        accent: '#DFE104',
        accentFg: '#000000',
        zincBorder: '#3F3F46',

        // Theme Mappings
        bgDark: '#09090B',
        fgLight: '#FAFAFA',
        mutedDark: '#27272A',
        accentYellow: '#DFE104',
        borderZinc: '#3F3F46',

        // Legacy Mappings
        darkBg: '#09090B',
        darkCard: '#09090B',
        darkBorder: '#3F3F46',
        cyanGlow: '#DFE104',
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
