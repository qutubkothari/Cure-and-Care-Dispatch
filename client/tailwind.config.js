/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Professional Healthcare Palette inspired by Cure & Care
        primary: {
          50: '#e6f7f5',
          100: '#b3e8e0',
          200: '#80d9cb',
          300: '#4dcab6',
          400: '#1abba1',
          500: '#00a896', // Main teal - professional healthcare
          600: '#008c7f',
          700: '#007068',
          800: '#005451',
          900: '#00383a',
        },
        accent: {
          50: '#e8f5e9',
          100: '#c8e6c9',
          200: '#a5d6a7',
          300: '#81c784',
          400: '#66bb6a',
          500: '#4caf50', // Fresh green - health & vitality
          600: '#43a047',
          700: '#388e3c',
          800: '#2e7d32',
          900: '#1b5e20',
        },
        medical: {
          light: '#f0f9ff', // Very light blue - clean medical feel
          blue: '#0891b2', // Medical blue
          green: '#10b981', // Success green
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 168, 150, 0.1), 0 10px 20px -2px rgba(76, 175, 80, 0.05)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
}

