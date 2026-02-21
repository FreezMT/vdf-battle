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
        surface: "#3d3d3d",
        border: "#545454",
        dark: "#545454",
        bg: "#2a2a2a",
        text: "#e5e5e5",
      },
    },
  },
  plugins: [],
};

export default config;
