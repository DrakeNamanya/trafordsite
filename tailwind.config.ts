import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Reference design palette (matches trafordexport-site exactly)
        traford: {
          green: '#3aaa35',        // primary green (nav, hero, buttons)
          'green-dark': '#2d8a2e', // hover state
          red: '#dc3545',          // announcement bar, prices
          orange: '#f97316',       // hero CTA, accent
          'orange-dark': '#ea580c',// orange hover
          dark: '#222222',         // footer bg
          'text': '#333333',       // body text
          muted: '#888888',
          bg: '#f5f5f5',
          'bg-alt': '#eeeeee',     // category tabs section bg
          border: '#e5e5e5',
          // Legacy aliases (kept for any unmigrated references)
          mint: '#E8F3E8',
          mint2: '#EAF6E9',
          leaf: '#8CC63F',
          star: '#FFB800',
        },
      },
      fontFamily: {
        // Open Sans = body, Oswald = display (uppercase headings, nav, CTAs)
        sans: ['"Open Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Oswald', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
      },
      keyframes: {
        toastSlide: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        toastSlide: 'toastSlide 0.3s ease',
        slideInRight: 'slideInRight 0.3s ease',
      },
    },
  },
  plugins: [],
};

export default config;
