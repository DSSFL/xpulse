import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // X's actual color palette
        'x-black': '#000000',
        'x-dark': '#0F1419',
        'x-gray-dark': '#16181C',
        'x-gray': '#1D1F23',
        'x-gray-light': '#2F3336',
        'x-gray-border': '#3E4144',
        'x-white': '#E7E9EA',
        'x-gray-text': '#71767B',
        'x-blue': '#1D9BF0',

        // XPulse medical vitals colors
        'pulse-blue': '#1D9BF0',
        'pulse-teal': '#00FFC8',
        'pulse-green': '#00FF88',
        'pulse-yellow': '#FFD700',
        'pulse-orange': '#FF8C00',
        'pulse-red': '#FF3B3B',
        'pulse-purple': '#A855F7',

        // Semantic vitals
        'vital-healthy': '#00FF88',
        'vital-warning': '#FFD700',
        'vital-critical': '#FF3B3B',
        'vital-neutral': '#1D9BF0',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['SF Mono', 'Monaco', 'Consolas', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'ekg-line': 'ekgLine 2s linear infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
        ekgLine: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(29, 155, 240, 0.3)',
        'glow-green': '0 0 20px rgba(0, 255, 136, 0.3)',
        'glow-red': '0 0 20px rgba(255, 59, 59, 0.3)',
      },
    },
  },
  plugins: [],
};
export default config;
