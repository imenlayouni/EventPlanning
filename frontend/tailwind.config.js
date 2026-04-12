/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#7c3aed",
        primaryDark: "#6d28d9",
      },
      boxShadow: {
        glow: "0 0 20px rgba(124, 58, 237, 0.35)",
      },
    },
  },
  plugins: [],
};
