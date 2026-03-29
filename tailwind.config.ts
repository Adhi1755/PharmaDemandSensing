import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        blackBase: "#000000",
        shellGray: "#1A1A1A",
        borderLight: "rgba(255,255,255,0.12)",
        borderStrong: "rgba(255,255,255,0.18)",
        textPrimary: "#FFFFFF",
        textSecondary: "#BFBFBF",
        textMuted: "#808080",
        accentSoft: "#FF4D4D",
        accentCritical: "#FF0000",
      },
    },
  },
};

export default config;
