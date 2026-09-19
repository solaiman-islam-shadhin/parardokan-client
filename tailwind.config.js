/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Kedebideri", "system-ui", "sans-serif"],
        display: ["Kedebideri", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
        },
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        light: {
          primary: "#fd7424",
          "primary-content": "#ffffff",
          secondary: "#ffb703",
          accent: "#10b981",
          neutral: "#29231f",
          "neutral-content": "#fffaf5",
          "base-100": "#ffffff",
          "base-200": "#f4f3fb",
          "base-300": "#e6e4f0",
          info: "#3b82f6",
          success: "#10b981",
          warning: "#f59e0b",
          error: "#ef5b73",
        },
        dark: {
          primary: "#ff8a4c",
          "primary-content": "#24150d",
          secondary: "#ffc857",
          accent: "#34d399",
          neutral: "#2a211c",
          "neutral-content": "#fff7f0",
          "base-100": "#171412",
          "base-200": "#211c19",
          "base-300": "#382d27",
          info: "#7da7ff",
          success: "#34d399",
          warning: "#f7c76b",
          error: "#ff8397",
        },
      },
    ],
  },
};
