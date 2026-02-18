import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        void: "#080b10",
        surface: "#0d1117",
        card: "#111820",
        hover: "#161e28",
        border: "#1e2d3d",
        "border-glow": "#2a4060",
        accent: "#f0b90b",
        "accent-dim": "#b8890a",
        success: "#0ecb81",
        failed: "#f6465d",
      },
      fontFamily: {
        display: ["Syne", "sans-serif"],
        mono: ["Space Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
