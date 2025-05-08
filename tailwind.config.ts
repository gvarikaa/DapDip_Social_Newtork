import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        xsm: "500px",
        sm: "600px",
        md: "690px",
        lg: "988px",
        xl: "1078px",
        xxl: "1265px",
      },
      colors: {
        background: {
          DEFAULT: "#151b23",
          light: "#1a2330",
          dark: "#0c0e10",
          darkOpacity50: "rgba(21, 27, 35, 0.85)"
        },
        accent: {
          DEFAULT: "#ff0033",
          light: "#ff3355",
          dark: "#cc0033",
        },
        textGray: {
          DEFAULT: "#71767b",
          light: "#e7e9ea",
          dark: "#a1a1aa"
        },
        borderGray: {
          DEFAULT: "#2f3336",
          light: "#3f4346",
          dark: "#262626"
        },
        iconBlue: {
          DEFAULT: "#1d9bf0",
          light: "#38bdf8",
          dark: "#0284c7"
        },
        success: "#2ba640",
        secondary: {
          DEFAULT: "#272727",
          light: "#373737",
          dark: "#1d2633"
        },
        textGrayLight: "#e7e9ea",
        inputGray: "#202327",
        iconGreen: "#00ba7c",
        iconPink: "#f91880",
        backgroundBlack: "#000000",
        backgroundHover: {
          light: "#181818",
          "dark-dark": "#1a1a1a"
        },
        secondaryLight: {
          light: "#e7e9ea"
        }
      },
      fontFamily: {
        georgian: ["FiraGO", "Noto Sans Georgian", "sans-serif"],
      },
      animation: {
        fadeIn: "fadeIn 0.2s ease-in-out",
        slideUp: "slideUp 0.3s ease-out",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shine: "shine 1.5s ease infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        shine: {
          "0%": { left: "-100%" },
          "100%": { left: "100%" }
        },
      },
      boxShadow: {
        'menu': '0 4px 20px rgba(0, 0, 0, 0.3)',
        'card': '0 4px 15px rgba(5, 0, 44, 0.2), 0 2px 8px rgba(1, 3, 35, 0.15)',
        'button': '0 4px 10px rgba(255, 0, 51, 0.3)',
        'hover': '0 6px 20px rgba(5, 0, 44, 0.25), 0 4px 10px rgba(1, 3, 35, 0.2)',
      },
    },
  },
  plugins: [],
} satisfies Config;