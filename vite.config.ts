import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base: './', // Use relative paths for Electron compatibility
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 1420,
    watch: {
      ignored: ["**/src-electron/**", "**/node_modules/**"],
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    exclude: ["**/node_modules/**", "**/dist/**", "**/tests/e2e/**"],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json', 'lcov'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/tests/**',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/src/test/**',
        '**/src/types/**',
        '**/vite.config.ts',
        '**/tailwind.config.ts',
        '**/playwright.config.ts',
        '**/.eslintrc.cjs',
      ],
      thresholds: {
        // Starting conservative, will increase incrementally to 75%
        lines: 15,
        functions: 30,
        branches: 50,
        statements: 15,
      },
      all: true,
      include: ['src/**/*.{ts,tsx}'],
    },
  },
}));

