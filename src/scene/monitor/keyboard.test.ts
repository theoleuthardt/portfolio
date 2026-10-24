import { describe, expect, it } from "vitest";
import {
  KEYBOARD_UNITS,
  keyboardKeys,
  NUMPAD_UNITS,
  numpadKeys,
} from "./keyboard";

const keys = keyboardKeys();
const rows = [0, 1, 2, 3, 4].map((row) =>
  keys.filter((key) => key.row === row),
);

describe("keyboardKeys", () => {
  it("lays out five rows of a full-width main block", () => {
    expect(rows.map((row) => row.length)).toEqual([14, 14, 13, 12, 8]);
  });

  it("fills every row edge to edge without gaps or overlaps", () => {
    for (const row of rows) {
      let edge = 0;
      for (const key of row) {
        expect(key.x - key.width / 2).toBeCloseTo(edge);
        edge = key.x + key.width / 2;
      }
      expect(edge).toBeCloseTo(KEYBOARD_UNITS);
    }
  });

  it("makes the space bar the widest key", () => {
    const widest = Math.max(...keys.map((key) => key.width));
    expect(rows[4].find((key) => key.width === widest)).toBeDefined();
    expect(widest).toBe(6.25);
  });
});

describe("numpadKeys", () => {
  it("lays out a keypad of four columns and five rows", () => {
    const keys = numpadKeys();
    expect(keys).toHaveLength(20);
    for (const row of [0, 1, 2, 3, 4]) {
      const inRow = keys.filter((key) => key.row === row);
      expect(inRow.map((key) => key.x)).toEqual([0.5, 1.5, 2.5, 3.5]);
    }
    expect(NUMPAD_UNITS).toBe(4);
  });
});
