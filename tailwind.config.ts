import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0D1B3E",
          50: "#F1F4FA",
          100: "#DDE4F0",
          500: "#162A5A",
          600: "#0D1B3E",
          700: "#0A1530",
          900: "#050A18",
        },
        accent: {
          DEFAULT: "#D98E2B",
          50: "#FDF7EC",
          100: "#F9EAD0",
          500: "#D98E2B",
          600: "#B8771F",
          700: "#8F5C17",
        },
        success: {
          DEFAULT: "#5A9E3E",
          50: "#F0F7EB",
          500: "#5A9E3E",
          600: "#468030",
        },
        info: {
          DEFAULT: "#4FA8D5",
          50: "#ECF6FB",
          500: "#4FA8D5",
          600: "#3A8CB5",
        },
        danger: {
          DEFAULT: "#B91C1C",
          50: "#FEF2F2",
          500: "#B91C1C",
          600: "#991B1B",
        },
        surface: "#FFFFFF",
        background: "#F8FAFC",
        border: "#E2E8F0",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-playfair)", "Georgia", "serif"],
      },
      borderRadius: {
        lg: "0.5rem",
        xl: "0.75rem",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(13, 27, 62, 0.06), 0 1px 2px -1px rgba(13, 27, 62, 0.06)",
        elevated: "0 4px 12px -2px rgba(13, 27, 62, 0.08), 0 2px 6px -2px rgba(13, 27, 62, 0.05)",
      },
    },
  },
  plugins: [],
};

export default config;
