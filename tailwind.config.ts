import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      screens: {
        xs: '420px',
      },
      colors: {
        brand: {
          50: '#e8f2fd',
          100: '#cde2fb',
          500: '#0071e3',
          600: '#0068d1',
          700: '#0058b3',
        },
      },
    },
  },
  plugins: [],
};

export default config;
