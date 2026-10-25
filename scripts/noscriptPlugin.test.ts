import { describe, expect, it } from "vitest";
import { noscriptHtml } from "../src/content/noscript";
import { noscriptPlugin, noscriptTags } from "./noscriptPlugin";

describe("noscriptPlugin", () => {
  it("injects the project list as a noscript block into the page body", () => {
    expect(noscriptTags()).toEqual([
      { tag: "noscript", children: noscriptHtml(), injectTo: "body" },
    ]);
    expect(noscriptPlugin().transformIndexHtml).toBe(noscriptTags);
  });
});
