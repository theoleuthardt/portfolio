import { describe, expect, it } from "vitest";
import { BUDGETS, checkBudgets, type Manifest } from "./budget";

const manifest: Manifest = {
  "index.html": {
    file: "assets/index.js",
    css: ["assets/index.css"],
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
  ["assets/index.js", 83_000],
  ["assets/index.css", 7_000],
  ["assets/Scene.js", 38_000],
  ["assets/vendor.js", 240_000],
  ["assets/textures.js", 2_000],
  ["assets/PostEffects.js", 100_000],
  ["assets/post.js", 5_000],
]);

describe("checkBudgets", () => {
  it("counts a stylesheet shared by two chunks only once", () => {
    const shared: Manifest = {
      ...manifest,
      "src/scene/Scene.tsx": {
        ...manifest["src/scene/Scene.tsx"],
        css: ["assets/shared.css"],
      },
      "_textures.js": {
        file: "assets/textures.js",
        css: ["assets/shared.css"],
      },
    };
    const report = checkBudgets(
      shared,
      new Map([...sizes, ["assets/shared.css", 1_000]]),
      0,
      [{ name: "scene", entry: "src/scene/Scene.tsx", limit: 300_000 }],
    );
    expect(report.rows[0].size).toBe(281_000);
  });

  it("counts a chunk's stylesheets with it", () => {
    const report = checkBudgets(manifest, sizes, 0, [
      { name: "main", entry: "index.html", limit: 110_000 },
    ]);
    expect(report.rows[0].size).toBe(90_000);
  });

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

  it("fails loudly for a missing import or an unmeasured file", () => {
    const broken: Manifest = {
      ...manifest,
      "src/scene/Scene.tsx": { file: "assets/Scene.js", imports: ["_gone.js"] },
    };
    const scene = [
      { name: "scene", entry: "src/scene/Scene.tsx", limit: 300_000 },
    ];
    expect(() => checkBudgets(broken, sizes, 0, scene)).toThrow(
      '"_gone.js" is imported but not in the manifest',
    );
    expect(() => checkBudgets(manifest, new Map(), 0, scene)).toThrow(
      'no size for "assets/Scene.js"',
    );
  });

  it("covers the main bundle, scene, post-processing, props, lab and desk", () => {
    expect(BUDGETS.map((budget) => budget.name)).toEqual([
      "main",
      "scene",
      "post-processing",
      "props",
      "lab",
      "desk",
    ]);
  });
});
