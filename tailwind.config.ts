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
          bg:           "#FBF9F4",
          raised:       "#F5F1E8",
          border:       "#EBE5D5",
          borderStrong: "#D8CFB8",
          muted:        "#A89E84",
          text2:        "#6B6354",
          text1:        "#3D3829",
          text0:        "#1F1C14",
        },
        dt: {
          bg: "#FBF9F4", surface: "#FFFEFA", raised: "#F5F1E8",
          border: "#EBE5D5", borderStrong: "#D8CFB8",
          text3: "#6B6354", text2: "#3D3829", text1: "#3D3829", text0: "#1F1C14",
        },
        signal:   "#D64528",
        positive: "#3F7A4D",
        negative: "#A8513D",
        pillar: {
          infra:  "#3B5BA5",
          talent: "#7A4F8C",
          gov:    "#3F7A4D",
          invest: "#B58A2E",
          econ:   "#8B4A3F",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans:    ["var(--font-sans)", "system-ui", "sans-serif"],
        mono:    ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: { sm: "2px", md: "6px", lg: "12px" },
      boxShadow: { research: "0 14px 36px rgba(31,28,20,.08)" },
    },
  },
  plugins: [],
};

export default config;
