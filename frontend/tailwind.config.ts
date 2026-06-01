/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0B0F19',
          surface: '#111827',
          card: '#151D2E',
          hover: '#1A2236',
          border: '#1E2D45',
        },
        neon: {
          cyan: '#06B6D4',
          'cyan-dim': '#0891B2',
          'cyan-glow': 'rgba(6, 182, 212, 0.15)',
        },
        emerald: {
          DEFAULT: '#10B981',
          dim: '#059669',
          glow: 'rgba(16, 185, 129, 0.15)',
        },
        amber: {
          DEFAULT: '#F59E0B',
          dim: '#D97706',
          glow: 'rgba(245, 158, 11, 0.15)',
        },
        danger: {
          DEFAULT: '#EF4444',
          dim: '#DC2626',
          glow: 'rgba(239, 68, 68, 0.15)',
        },
        purple: {
          DEFAULT: '#8B5CF6',
          dim: '#7C3AED',
          glow: 'rgba(139, 92, 246, 0.15)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'cyber-grid': "linear-gradient(rgba(6,182,212,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.03) 1px, transparent 1px)",
        'hero-glow': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(6,182,212,0.15), transparent)',
      },
      boxShadow: {
        'neon-cyan': '0 0 20px rgba(6,182,212,0.3), 0 0 40px rgba(6,182,212,0.1)',
        'neon-emerald': '0 0 20px rgba(16,185,129,0.3)',
        'neon-amber': '0 0 20px rgba(245,158,11,0.3)',
        'card': '0 4px 24px rgba(0,0,0,0.4)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(6,182,212,0.1)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'scan': 'scan 2s linear infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(6,182,212,0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(6,182,212,0.6), 0 0 40px rgba(6,182,212,0.3)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      },
    },
  },
  plugins: [],
}
