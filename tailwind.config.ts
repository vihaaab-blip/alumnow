import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "xs": "420px", "2xl": "1400px" },
    },
    extend: {
      colors: {
        landing: {
          surface: "rgba(255, 255, 255, 0.06)",
          "surface-hover": "rgba(255, 255, 255, 0.10)",
          border: "rgba(255, 255, 255, 0.08)",
          "border-strong": "rgba(255, 255, 255, 0.15)",
          text: "rgba(255, 255, 255, 0.80)",
          "text-muted": "rgba(255, 255, 255, 0.50)",
        },
        primary: {
          DEFAULT: "#FFFFFF",
          light: "#FFFFFF",
          dark: "#0A0A0A",
          50: "#FFFFFF", 100: "#F5F5F6", 200: "#E5E5E7",
          300: "#D4D4D8", 400: "#A1A1AA", 500: "#FFFFFF",
          600: "#E5E5E7", 700: "#D4D4D8", 800: "#A1A1AA", 900: "#71717A",
        },
        accent: {
          DEFAULT: "#5B4FE9",
          light: "#6C63FF",
          dark: "#4A3FD6",
          50: "#EDEDFF", 100: "#DADAFF", 200: "#B8B4FF",
          300: "#9590FF", 400: "#7C75FF", 500: "#5B4FE9",
          600: "#4A3FD6", 700: "#3A30B3", 800: "#2A2290", 900: "#1A156D",
        },
        background: "#000000",
        foreground: "#F5F5F6",
        border: "#1C1C1F",
        input: "#1C1C1F",
        ring: "#5B4FE9",
      },
      fontFamily: {
        sans: ["Inter", "var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "SF Mono", "Fira Code", "monospace"],
      },
      borderRadius: { sm: "6px", md: "10px", lg: "16px", xl: "20px" },
      boxShadow: {
        sm: "0 1px 3px rgba(0, 0, 0, 0.3)",
        md: "0 4px 12px rgba(0, 0, 0, 0.4)",
        lg: "0 8px 24px rgba(0, 0, 0, 0.5)",
        xl: "0 16px 48px rgba(0, 0, 0, 0.6)",
      },
      keyframes: {
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
        "pulse-dot": { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0.3" } },
        "check-draw": { "0%": { strokeDashoffset: "50" }, "100%": { strokeDashoffset: "0" } },
        "slide-up": { "0%": { transform: "translateY(10px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
      },
      animation: {
        shimmer: "shimmer 1.5s infinite",
        "pulse-dot": "pulse-dot 1.5s ease-in-out infinite",
        "check-draw": "check-draw 0.4s ease-out forwards",
        "slide-up": "slide-up 0.3s ease-out",
      },
    },
  },
  plugins: [animate],
};
export default config;
