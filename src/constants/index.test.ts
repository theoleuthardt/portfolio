import { describe, expect, it } from "vitest";
import { navLinks, projects } from "./index";

describe("navLinks", () => {
  it("has unique ids", () => {
    const ids = navLinks.map((link) => link.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every external link an https href", () => {
    const external = navLinks.filter((link) => link.type === "external_link");
    expect(external.length).toBeGreaterThan(0);
    for (const link of external) {
      expect(link.href).toMatch(/^https:\/\//);
    }
  });
});

describe("projects", () => {
  it("has unique ids", () => {
    const ids = projects.map((project) => project.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every project a title, an https link and an icon", () => {
    for (const project of projects) {
      expect(project.title).not.toBe("");
      expect(project.link).toMatch(/^https:\/\//);
      expect(project.icon).toBeTruthy();
    }
  });
});
