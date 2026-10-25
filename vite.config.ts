import { defineConfig } from "vitest/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { noscriptPlugin } from "./scripts/noscriptPlugin";

export default defineConfig({
  plugins: [react(), tailwindcss(), noscriptPlugin()],
  build: { manifest: true },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: { include: [/index\.css/] },
  },
});
