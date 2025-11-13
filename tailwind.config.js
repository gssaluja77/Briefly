/** @type {import('tailwindcss').Config} */
export default {
  content: ["src/components/Summarizer.jsx", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        "fade-in": {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
      },
      width: {
        128: "32rem",
      },
      height: {
        128: "32rem",
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out",
      },
    },
  },
  plugins: [],
};
