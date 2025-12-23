import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      screens: {
        // Custom breakpoints matching design system
        narrow: "800px",   // Narrow: 800-1000px
        normal: "1000px",  // Normal: 1000-1400px
        wide: "1400px",    // Wide: 1400px+
        ultra: "1920px",   // Ultra wide displays
      },
      maxWidth: {
        // Fluid container widths
        "container-narrow": "clamp(800px, 90vw, 1000px)",
        "container-normal": "clamp(1000px, 90vw, 1400px)",
        "container-wide": "clamp(1400px, 90vw, 1920px)",
      },
      spacing: {
        // Fluid spacing scale
        "fluid-1": "clamp(0.25rem, 0.3vw, 0.5rem)",
        "fluid-2": "clamp(0.5rem, 0.6vw, 1rem)",
        "fluid-4": "clamp(1rem, 1.2vw, 2rem)",
        "fluid-6": "clamp(1.5rem, 2vw, 3rem)",
        "fluid-8": "clamp(2rem, 2.5vw, 4rem)",
      },
      fontSize: {
        // Fluid typography scale
        "fluid-xs": "clamp(0.6875rem, 0.8vw, 0.8125rem)",
        "fluid-sm": "clamp(0.8125rem, 0.9vw, 0.875rem)",
        "fluid-base": "clamp(0.875rem, 1vw, 1rem)",
        "fluid-lg": "clamp(1rem, 1.2vw, 1.25rem)",
        "fluid-xl": "clamp(1.25rem, 1.5vw, 1.5rem)",
        "fluid-2xl": "clamp(1.5rem, 2vw, 2.25rem)",
        "fluid-3xl": "clamp(2.25rem, 3vw, 3rem)",
        "fluid-4xl": "clamp(2.5rem, 4vw, 3.75rem)",
      },
    },
  },
  plugins: [],
} satisfies Config;


