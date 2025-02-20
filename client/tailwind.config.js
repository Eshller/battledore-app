/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      screens: {
        xs: "440px",
      },
      backgroundImage: {
        "back-drop": "url(./badminton.jpg)",
        "badminton-court": "url('./badminton_court.jpg')",
      },
      fontFamily: {
        inter: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
