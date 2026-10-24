import { describe, expect, it } from "vitest";
import css from "./index.css?raw";
import { contrastRatio } from "./test/contrast";

function token(name: string): string {
  const match = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})\\s*;`).exec(css);
  if (match === null) {
    throw new Error(`token --${name} is missing`);
  }
  return match[1].toLowerCase();
}

describe("design tokens", () => {
  it("define every colour of the design concept", () => {
    for (const name of [
      "void",
      "haze",
      "bezel",
      "glass",
      "line",
      "phosphor",
      "phosphor-dim",
      "text",
      "neon",
      "ceiling",
      "amber",
      "alert",
    ]) {
      expect(token(`color-${name}`)).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("keep body text at WCAG AA on the terminal glass", () => {
    for (const name of ["phosphor", "phosphor-dim", "text"]) {
      expect(
        contrastRatio(token(`color-${name}`), token("color-glass")),
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keep short labels at WCAG AA large-text contrast on the glass", () => {
    for (const name of ["amber", "alert"]) {
      expect(
        contrastRatio(token(`color-${name}`), token("color-glass")),
      ).toBeGreaterThanOrEqual(3);
    }
  });

  it("load no fonts from Google", () => {
    expect(css).not.toContain("fonts.googleapis.com");
  });
});
