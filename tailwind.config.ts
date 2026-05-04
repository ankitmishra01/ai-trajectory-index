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
          bg:           "#0B0F14",
          surface:      "#11161E",
          raised:       "#1A2230",
          border:       "#252F40",
          borderStrong: "#3A4658",
          text3:        "#5C6A80",
          text2:        "#8A98AD",
          text1:        "#C4CDD9",
          text0:        "#E8ECF1",
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
    },
  },
  plugins: [],
};

export default config;
