/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        '2xl': '1200px',
      },
    },
    extend: {
      colors: {
        background: '#020617',
        foreground: '#E5E7EB',

        primary: {
          DEFAULT: '#22C55E',
          foreground: '#0B1120',
        },

        secondary: {
          DEFAULT: '#0F172A',
          foreground: '#E5E7EB',
        },

        muted: {
          DEFAULT: '#020617',
          foreground: '#9CA3AF',
        },

        accent: {
          DEFAULT: '#F97316',
          foreground: '#0B1120',
        },

        border: '#1F2933',
        input: '#111827',
        ring: '#22C55E',

        destructive: {
          DEFAULT: '#EF4444',
          foreground: '#F9FAFB',
        },
        success: {
          DEFAULT: '#22C55E',
          foreground: '#052e16',
        },
        warning: {
          DEFAULT: '#F97316',
          foreground: '#7c2d12',
        },
      },

      fontFamily: {
        sans: ['system-ui', 'ui-sans-serif', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },

      borderRadius: {
        lg: '1rem',
        md: '0.75rem',
        sm: '0.5rem',
      },

      boxShadow: {
        soft: '0 10px 30px rgba(15, 23, 42, 0.45)',
        elevated: '0 18px 45px rgba(15, 23, 42, 0.65)',
      },

      spacing: {
        '18': '4.5rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('tailwindcss-animate'),
  ],
}
