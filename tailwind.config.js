/** @type {import('tailwindcss').Config} */
const colors = require("tailwindcss/colors");
const defaultTheme = require("tailwindcss/defaultTheme");

const config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx,css}",
    "./components/**/*.{js,ts,jsx,tsx,mdx,css}", 
    "./app/**/*.{js,ts,jsx,tsx,mdx,css}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: colors.gray[50],   // Lightest shade
          100: colors.gray[100],
          200: colors.gray[200],
          300: colors.gray[300],
          400: colors.gray[400],
          500: colors.gray[500],
          600: colors.gray[600],
          700: colors.gray[700],
          800: colors.gray[800],
          900: colors.gray[900], // Darkest shade
          DEFAULT: colors.gray[900], // Default primary color
          foreground: colors.white,
          hairline: colors.gray[100],
        },
        ring: colors.gray[500],
      },
      fontFamily: {
        sans: ["var(--font-sans)", ...defaultTheme.fontFamily.sans],
        mono: ["var(--font-mono)"],
      },
      container: {
        center: true,
        padding: {
          DEFAULT: "12px",
          md: "1rem",
        },
      },
      backgroundImage: {
        colorWash: "url('/color-wash-bg.png')",
        cardBorder: `linear-gradient(90deg, white, white), linear-gradient(0deg, ${colors.gray[300]}, ${colors.gray[200]})`,
        selectArrow:
          "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQgNkw4IDEwTDEyIDYiIHN0cm9rZT0iIzY0NzQ4QiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=')",
      },
      backgroundPosition: {
        selectArrow: "right 1rem center",
      },
      boxShadow: {
        short:
          "0px 7px 2px 0px rgba(0, 0, 0, 0), 0px 5px 2px 0px rgba(0, 0, 0, 0.01), 0px 3px 2px 0px rgba(0, 0, 0, 0.03), 0px 1px 1px 0px rgba(0, 0, 0, 0.04), 0px 0px 1px 0px rgba(0, 0, 0, 0.05)",
        mid: "0px 100px 28px 0px rgba(0, 0, 0, 0), 0px 64px 26px 0px rgba(0, 0, 0, 0.01), 0px 36px 22px 0px rgba(0, 0, 0, 0.03), 0px 16px 16px 0px rgba(0, 0, 0, 0.04), 0px 4px 9px 0px rgba(0, 0, 0, 0.05)",
        long: "0px 360px 101px 0px rgba(0, 0, 0, 0), 0px 231px 92px 0px rgba(0, 0, 0, 0), 0px 130px 78px 0px rgba(0, 0, 0, 0.02),0px 58px 58px 0px rgba(0, 0, 0, 0.03), 0px 14px 32px 0px rgba(0, 0, 0, 0.03)",
        stats: "0px -2px 15px 0px rgba(0, 0, 0, 0.07)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fadeInUp": {
          from: { opacity: "0", transform: "translateY(30px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scaleIn": {
          from: { transform: "scale(0)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        "checkmark": {
          "0%": { transform: "scale(0)" },
          "50%": { transform: "scale(1.2)" },
          "100%": { transform: "scale(1)" },
        },
      },
      transitionDelay: {
        "200": "200ms",
        "400": "400ms",
      },
      animation: {
        wiggle: "wiggle 0.2s 1",
        appear: "appear 0.5s ease-out forwards",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fadeInUp": "fadeInUp 0.6s ease-out",
        "scaleIn": "scaleIn 0.5s ease-out 0.2s both",
        "checkmark": "checkmark 0.6s ease-out 0.4s both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

module.exports = config;