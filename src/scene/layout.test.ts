import { describe, expect, it } from "vitest";
import { LAB_RIG } from "./cameraRig";
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
  it("keeps the camera, including its orbit and parallax, inside the room", () => {
    const [x, y, z] = LAB_RIG.base;
    const reach =
      Math.hypot(x, z) * Math.sin(LAB_RIG.orbitRadians) + LAB_RIG.parallax;
    expect(x - reach).toBeGreaterThan(ROOM.left);
    expect(x + reach).toBeLessThan(ROOM.right);
    expect(z + reach).toBeLessThan(ROOM.front);
    expect(y - LAB_RIG.parallax).toBeGreaterThan(ROOM.floor);
    expect(y + LAB_RIG.parallax).toBeLessThan(ROOM.ceiling);
  });
});
