import { describe, expect, it } from "vitest";
import { ICONS, iconRuns } from "./icons";

describe("ICONS", () => {
  it("are 16 by 16 pixels of on and off", () => {
    for (const [name, rows] of Object.entries(ICONS)) {
      expect(rows, name).toHaveLength(16);
      for (const row of rows) {
        expect(row, name).toMatch(/^[#.]{16}$/);
      }
    }
  });
});

describe("iconRuns", () => {
  it("merges neighbouring pixels of a row into one rectangle", () => {
    expect(iconRuns(["##.#", "...."])).toEqual([
      { x: 0, y: 0, width: 2 },
      { x: 3, y: 0, width: 1 },
    ]);
  });
});
