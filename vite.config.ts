import { defineConfig } from "vitest/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { noscriptHtml } from "./src/content/noscript";

/** Puts the project list into a `noscript` block of the built page. */
const noscript = (): Plugin => ({
  name: "noscript-projects",
  transformIndexHtml: () => [
    { tag: "noscript", children: noscriptHtml(), injectTo: "body" },
  ],
});

export default defineConfig({
  plugins: [react(), tailwindcss(), noscript()],
  build: { manifest: true },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: { include: [/index\.css/] },
  },
});
