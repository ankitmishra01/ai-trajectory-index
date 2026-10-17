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
        ed: {
          bg:           "#F8F7F3",
          raised:       "#F1ECE1",
          border:       "#E0D8C6",
          borderStrong: "#BDB194",
          muted:        "#6E6653",
          text2:        "#575043",
          text1:        "#332E24",
          text0:        "#18160F",
        },
        dt: {
          bg: "#F8F7F3", surface: "#FFFFFF", raised: "#F1ECE1",
          border: "#E0D8C6", borderStrong: "#BDB194",
          text3: "#575043", text2: "#332E24", text1: "#332E24", text0: "#18160F",
        },
        signal:   "#C73E22",
        ink:      { DEFAULT: "#13203A", 2: "#1C2C4A", on: "#F3F0E8", muted: "#B7C0D2", accent: "#F2876A" },
        positive: "#3F7A4D",
        negative: "#A8513D",
        pillar: {
          infra:  "#3B5BA5",
          talent: "#7A4F8C",
          gov:    "#3F7A4D",
          invest: "#9C7522",
          econ:   "#8B4A3F",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans:    ["var(--font-sans)", "system-ui", "sans-serif"],
        mono:    ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: { sm: "2px", md: "6px", lg: "12px" },
      boxShadow: { research: "0 14px 36px rgba(19,32,58,.10)" },
    },
  },
  plugins: [],
};

export default config;
