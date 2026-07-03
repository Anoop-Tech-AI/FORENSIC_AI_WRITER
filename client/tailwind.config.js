/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Existing colors (gradient theme)
        background: '#0B1220',
        card: '#111827',
        accent: '#3B82F6',
        'accent-secondary': '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        text: '#E5E7EB',
        
        // Theme-specific colors
        gradient: {
          primary: '#3B82F6',
          secondary: '#8B5CF6',
          background: '#0B1220',
          card: '#111827',
          text: '#E5E7EB',
          border: '#374151',
        },
        
        light: {
          primary: '#3B82F6',
          secondary: '#8B5CF6',
          background: '#FFFFFF',
          card: '#F9FAFB',
          text: '#111827',
          border: '#E5E7EB',
          muted: '#6B7280',
        },
        
        dark: {
          primary: '#60A5FA',
          secondary: '#A78BFA',
          background: '#0B0F19',
          card: '#1F2937',
          text: '#F9FAFB',
          border: '#374151',
          muted: '#9CA3AF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'theme-transition': 'themeTransition 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        themeTransition: {
          '0%': { opacity: '0.8' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
