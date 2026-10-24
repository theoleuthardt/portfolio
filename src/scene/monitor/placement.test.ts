import { describe, expect, it } from "vitest";
import { screenPlacement } from "./placement";

const viewport = { width: 1600, height: 900 };
const fov = 38;
const distance = 1.2;
const visibleHeight = 2 * distance * Math.tan((fov / 2) * (Math.PI / 180));
const perPixel = visibleHeight / viewport.height;

describe("screenPlacement", () => {
  it("puts a centred rectangle on the view axis at the given distance", () => {
    const placement = screenPlacement(
      { left: 600, top: 300, width: 400, height: 300 },
      viewport,
      fov,
      distance,
    );
    expect(placement.position[0]).toBeCloseTo(0);
    expect(placement.position[1]).toBeCloseTo(0);
    expect(placement.position[2]).toBe(-distance);
    expect(placement.width).toBeCloseTo(400 * perPixel);
    expect(placement.height).toBeCloseTo(300 * perPixel);
  });

  it("maps a rectangle in the upper left to the upper left of the view", () => {
    const placement = screenPlacement(
      { left: 0, top: 0, width: 800, height: 450 },
      viewport,
      fov,
      distance,
    );
    expect(placement.position[0]).toBeCloseTo(-400 * perPixel);
    expect(placement.position[1]).toBeCloseTo(225 * perPixel);
  });

  it("fills the whole view with a rectangle the size of the viewport", () => {
    const placement = screenPlacement(
      { left: 0, top: 0, ...viewport },
      viewport,
      fov,
      distance,
    );
    expect(placement.height).toBeCloseTo(visibleHeight);
    expect(placement.width).toBeCloseTo((visibleHeight * 1600) / 900);
  });
});
