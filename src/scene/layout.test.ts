import { describe, expect, it } from "vitest";
import { cameraPosition, LAB_RIG } from "./cameraRig";
import { ROOM, centeredGrid, evenlySpaced } from "./layout";

describe("centeredGrid", () => {
  it("centres a grid of columns and rows on the given point", () => {
    expect(centeredGrid(2, 2, 2, 4, [0, -5])).toEqual([
      [-1, -7],
      [1, -7],
      [-1, -3],
      [1, -3],
    ]);
  });

  it("returns a single point for a 1 by 1 grid", () => {
    expect(centeredGrid(1, 1, 3, 3, [5, 5])).toEqual([[5, 5]]);
  });
});

describe("evenlySpaced", () => {
  it("spreads values from start to end inclusive", () => {
    expect(evenlySpaced(0, 10, 3)).toEqual([0, 5, 10]);
  });

  it("returns the start for a single value", () => {
    expect(evenlySpaced(2, 8, 1)).toEqual([2]);
  });
});

describe("ROOM", () => {
  it("keeps the camera inside the room over a full orbit and any pointer", () => {
    const corners = [-1, 1].flatMap((x) => [-1, 1].map((y) => ({ x, y })));
    for (let step = 0; step <= 48; step++) {
      const seconds = (LAB_RIG.orbitPeriodSeconds * step) / 48;
      for (const pointer of corners) {
        const [x, y, z] = cameraPosition(LAB_RIG, seconds, pointer, false);
        expect(x).toBeGreaterThan(ROOM.left);
        expect(x).toBeLessThan(ROOM.right);
        expect(z).toBeLessThan(ROOM.front);
        expect(z).toBeGreaterThan(ROOM.back);
        expect(y).toBeGreaterThan(ROOM.floor);
        expect(y).toBeLessThan(ROOM.ceiling);
      }
    }
  });
});
