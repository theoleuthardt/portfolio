import type { HtmlTagDescriptor, Plugin } from "vite";
import { noscriptHtml } from "../src/content/noscript.ts";

/** The `noscript` block with the project list, for the end of the body. */
export function noscriptTags(): HtmlTagDescriptor[] {
  return [{ tag: "noscript", children: noscriptHtml(), injectTo: "body" }];
}

/** Puts the project list into a `noscript` block of the built page. */
export function noscriptPlugin(): Plugin {
  return { name: "noscript-projects", transformIndexHtml: noscriptTags };
}
