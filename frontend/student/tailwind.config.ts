/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        primary: "#1E40AF",
        secondary: "#9333EA",
        accent: "#FACC15",
        background: {
          DEFAULT: "#FFFFFF",
          dark: "#1A1A2E",
        },
        foreground: {
          DEFAULT: "#1A1A2E",
          dark: "#EAEAEA",
        },
      }
    },
  },
  plugins: [],
};
