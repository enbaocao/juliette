import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "juliette-pink": {
          DEFAULT: "#ffc2d1",
          light: "#ffe5ec",
          medium: "#ffc8dd",
          dark: "#f5b8c8",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
