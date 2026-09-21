/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F5F6FA',
        surface: '#FFFFFF',
        ink: '#181B2E',
        'ink-soft': '#6B7280',
        primary: {
          DEFAULT: '#3B5FE0',
          dark: '#2C48B8',
          light: '#EAF0FD'
        },
        banner: {
          from: '#2E4FDB',
          to: '#22B8A0'
        },
        accent: {
          DEFAULT: '#22B8A0',
          dark: '#189D89',
          light: '#E2F7F2'
        },
        ai: {
          DEFAULT: '#8B5CF6',
          dark: '#7C3AED',
          light: '#F1EAFE'
        },
        streak: {
          DEFAULT: '#F5A623',
          light: '#FDECC8'
        },
        danger: '#E8564C',
        border: '#E7E8F0'
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif']
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem'
      },
      boxShadow: {
        card: '0 1px 2px rgba(24, 27, 46, 0.04), 0 6px 18px -8px rgba(24, 27, 46, 0.12)'
      },
      backgroundImage: {
        'banner-gradient': 'linear-gradient(120deg, #2E4FDB 0%, #22B8A0 130%)'
      }
    }
  },
  plugins: []
}
