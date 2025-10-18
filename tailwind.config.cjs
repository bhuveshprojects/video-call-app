/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Manrope", "system-ui", "sans-serif"],
      },
      colors: {
        blackBase: "#0e0e0e",       // main background
        darkGray: "#1b1b1b",        // card/section bg
        redAccent: "#d7263d",       // primary accent (buttons, highlights)
        redSoft: "#e5383b",         // hover/secondary accent
        lightText: "#f5f5f5",       // main text
        dimText: "#9f9f9f",         // subtext
      },
      boxShadow: {
        soft: "0 4px 20px rgba(0, 0, 0, 0.6)",
      },
    },
  },
  plugins: [],
};
