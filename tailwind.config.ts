import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "dark-bg": "rgb(var(--dark-bg) / <alpha-value>)",
        "bright-blue": "rgb(var(--bright-blue) / <alpha-value>)",
        "neon-pink": "rgb(var(--neon-pink) / <alpha-value>)",
        text: "rgb(var(--text) / <alpha-value>)",
      },
      fontFamily: {
        syne: ["var(--font-syne)", "sans-serif"],
        goldman: ["var(--font-goldman)", "cursive"],
      },
    },
  },
  plugins: [],
} satisfies Config;