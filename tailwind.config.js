import animations from "@midudev/tailwind-animations";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        'dsm': '320px',
      },
      colors: {
        // Custom color palette
        steel: {
          DEFAULT: '#4a5568',
          light: '#718096',
          dark: '#2d3748',
          darker: '#1a202c',
        },
        accent: {
          DEFAULT: '#ecc94b',
          dark: '#d69e2e',
          darker: '#b7791f',
        },
        // Keep existing colors for backward compatibility
        normal: "rgba(221, 213, 184,.8)",
        primary: "rgba(213, 185, 84,.8)",
        enphasis: "rgba(58, 41, 43, .8)",
        secondary: "rgba(0, 0, 0, .8)",
        txtbg: "rgba(0,170,250,.8)",
        txtbg1: "rgba(0,0,0,.6)",
      },
      boxShadow: {
        "3xl": [
          "0 0px 2px rgba(58,41,43,.8)",
          "0 0px 2px rgba(0,170,250,.8)",
        ],
      },
      dropShadow: {
        "4xl": [
          "0 0px 2px rgba(0,170,250,.8)",
          "0 0px 2px rgba(58, 41, 43,.8)",
        ],
      },
      backgroundImage: {
        'custom-gradient': 'linear-gradient(to bottom, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.9))',
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
      },
      // Add custom utilities
      textColor: {
        'text': 'var(--color-text, #e2e8f0)',
        'text-muted': 'var(--color-text-muted, #a0aec0)',
      },
      backgroundColor: {
        'steel': 'var(--color-steel, #4a5568)',
        'steel-dark': 'var(--color-steel-dark, #2d3748)',
        'steel-darker': 'var(--color-steel-darker, #1a202c)',
        'steel-light': 'var(--color-steel-light, #718096)',
        'accent': 'var(--color-accent, #ecc94b)',
        'accent-dark': 'var(--color-accent-dark, #d69e2e)',
        'accent-darker': 'var(--color-accent-darker, #b7791f)',
      },
      borderColor: {
        'steel': 'var(--color-steel, #4a5568)',
        'steel-light': 'var(--color-steel-light, #718096)',
        'accent': 'var(--color-accent, #ecc94b)',
      },
    },
  },
  plugins: [
    animations,
    function({ addUtilities }) {
      const newUtilities = {
        '.text-text': {
          color: 'var(--color-text, #e2e8f0)',
        },
        '.text-text-muted': {
          color: 'var(--color-text-muted, #a0aec0)',
        },
      };
      addUtilities(newUtilities, ['responsive', 'hover']);
    },
  ],
};
