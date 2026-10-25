import { describe, expect, it } from "vitest";
import { BUDGETS, checkBudgets, type Manifest } from "./budget";

const manifest: Manifest = {
  "index.html": {
    file: "assets/index.js",
    isEntry: true,
    dynamicImports: ["src/scene/Scene.tsx"],
  },
  "src/scene/Scene.tsx": {
    file: "assets/Scene.js",
    imports: ["_vendor.js", "_textures.js"],
    dynamicImports: ["src/scene/PostEffects.tsx"],
  },
  "_vendor.js": { file: "assets/vendor.js" },
  "_textures.js": { file: "assets/textures.js" },
  "src/scene/PostEffects.tsx": {
    file: "assets/PostEffects.js",
    imports: ["_vendor.js", "_post.js"],
  },
  "_post.js": { file: "assets/post.js" },
};
const sizes = new Map([
  ["assets/index.js", 90_000],
  ["assets/Scene.js", 38_000],
  ["assets/vendor.js", 240_000],
  ["assets/textures.js", 2_000],
  ["assets/PostEffects.js", 100_000],
  ["assets/post.js", 5_000],
]);

describe("checkBudgets", () => {
  it("adds a lazy chunk's own static imports that are not loaded yet", () => {
    const report = checkBudgets(manifest, sizes, 2_000_000, [
      { name: "main", entry: "index.html", limit: 110_000 },
      { name: "scene", entry: "src/scene/Scene.tsx", limit: 280_000 },
      { name: "post", entry: "src/scene/PostEffects.tsx", limit: 120_000 },
    ]);
    expect(report.rows).toEqual([
      { name: "main", size: 90_000, limit: 110_000, ok: true },
      { name: "scene", size: 280_000, limit: 280_000, ok: true },
      { name: "post", size: 105_000, limit: 120_000, ok: true },
      { name: "assets", size: 2_000_000, limit: 3_000_000, ok: true },
    ]);
    expect(report.ok).toBe(true);
  });

  it("fails when a path or the assets exceed their limit", () => {
    const report = checkBudgets(manifest, sizes, 3_100_000, [
      { name: "scene", entry: "src/scene/Scene.tsx", limit: 270_000 },
    ]);
    expect(report.rows.map((row) => row.ok)).toEqual([false, false]);
    expect(report.ok).toBe(false);
  });

  it("fails loudly for an entry that is not in the manifest", () => {
    expect(() =>
      checkBudgets(manifest, sizes, 0, [
        { name: "moved", entry: "src/scene/Moved.tsx", limit: 1 },
      ]),
    ).toThrow('budget "moved": "src/scene/Moved.tsx" is not in the manifest');
  });

  it("covers the main bundle, scene, post-processing, props and lab", () => {
    expect(BUDGETS.map((budget) => budget.name)).toEqual([
      "main",
      "scene",
      "post-processing",
      "props",
      "lab",
    ]);
  });
});
