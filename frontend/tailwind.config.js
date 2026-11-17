/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ares: {
          bg: "#0B1020",
          card: "#121A2D",
          cardHover: "#18223B",
          border: "#1E2A47",
          accent: "#3B82F6",
          accentHover: "#2563EB",
          secondary: "#8B5CF6",
          secondaryHover: "#7C3AED",
          cyan: "#06B6D4",
          emerald: "#10B981",
          rose: "#F43F5E",
          amber: "#F59E0B",
          text: "#F8FAFC",
          muted: "#94A3B8"
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      }
    },
  },
  plugins: [],
}
