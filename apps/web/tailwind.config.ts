import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: "var(--surface)",
        "surface-muted": "var(--surface-muted)",
        border: "var(--border)",
        "muted-foreground": "var(--muted-foreground)",
        "brand-lemon": "var(--brand-lemon)",
        "brand-mint": "var(--brand-mint)",
        focus: "var(--focus)",
      },
    },
  },
  plugins: [],
};
export default config;
