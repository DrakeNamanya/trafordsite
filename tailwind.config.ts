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
        traford: {
          orange: '#F15A24',
          green: '#22B14C',
          leaf: '#8CC63F',
          mint: '#E8F3E8',
          mint2: '#EAF6E9',
          bg: '#F7F7F7',
          border: '#E5E7EB',
          dark: '#1F2937',
          muted: '#6B7280',
          star: '#FFB800',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
      },
    },
  },
  plugins: [],
};

export default config;
