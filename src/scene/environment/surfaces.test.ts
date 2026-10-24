import { describe, expect, it } from "vitest";
import { surfaceUrls } from "./surfaces";

describe("surfaceUrls", () => {
  it("points to the colour, normal and roughness/metalness maps", () => {
    expect(surfaceUrls("floor", "/")).toEqual([
      "/textures/floor_color.webp",
      "/textures/floor_normal.webp",
      "/textures/floor_rm.webp",
    ]);
  });

  it("respects a base path", () => {
    expect(surfaceUrls("wall", "/portfolio/")[0]).toBe(
      "/portfolio/textures/wall_color.webp",
    );
  });
});
