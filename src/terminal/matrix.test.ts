import { describe, expect, it } from "vitest";
import { matrixFrame } from "./matrix";

describe("matrixFrame", () => {
  it("fills the given size", () => {
    const frame = matrixFrame(30, 12, 0);
    expect(frame).toHaveLength(12);
    for (const row of frame) {
      expect([...row]).toHaveLength(30);
    }
  });

  it("is the same for the same time and rains on over time", () => {
    expect(matrixFrame(30, 12, 1000)).toEqual(matrixFrame(30, 12, 1000));
    expect(matrixFrame(30, 12, 1000)).not.toEqual(matrixFrame(30, 12, 1300));
  });

  it("leaves gaps between the falling streams", () => {
    const cells = matrixFrame(30, 12, 2000).join("");
    expect(cells).toContain(" ");
    expect(cells.replace(/ /g, "").length).toBeGreaterThan(20);
  });
});
