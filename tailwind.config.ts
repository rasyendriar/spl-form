import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dfe9ff',
          500: '#3358e8',
          600: '#2544c4',
          700: '#1e37a0',
        },
      },
    },
  },
  plugins: [],
};

export default config;
