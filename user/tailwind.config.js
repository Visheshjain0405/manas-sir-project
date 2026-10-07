/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  darkMode: "media",
  theme: {
    extend: {
      fontFamily: {
        display: ["PublicSans"],
      },
      colors: {
        primary: "#0f1729",
        navy: "#0f1729",
        navyDark: "#0A0F1D",

        light: {
          background: "#f6f7f8",
          surface: "#ffffff",
          text: "#0f1729",
          muted: "#6b7280",
        },

        dark: {
          background: "#14171e",
          surface: "#1f2937",
          text: "#ffffff",
          muted: "#9ca3af",
        },
      },
    },
  },
  plugins: [],
};

