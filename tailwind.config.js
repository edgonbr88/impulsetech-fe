/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          slate: "#0F172A",
          card: "#1E293B",
          primary: "#0284C7",
          neutral: "#475569",
          success: "#10B981",
          warning: "#F59E0B",
          danger: "#EF4444",
          tech: "#8B5CF6",
        }
      }
    },
  },
  plugins: [],
}
