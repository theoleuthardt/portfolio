import { describe, expect, it } from "vitest";
import { connectorPoints, toScreen } from "./connector";

describe("connectorPoints", () => {
  it("leaves the anchor horizontally, then runs to the module", () => {
    expect(connectorPoints({ x: 100, y: 400 }, { x: 900, y: 300 })).toBe(
      "100,400 140,400 870,300 900,300",
    );
  });

  it("rounds to whole pixels", () => {
    expect(connectorPoints({ x: 10.4, y: 20.6 }, { x: 99.5, y: 50.2 })).toBe(
      "10,21 50,21 70,50 100,50",
    );
  });
});

describe("toScreen", () => {
  const size = { width: 1000, height: 500 };

  it("maps the centre of normalised device coordinates to the middle", () => {
    expect(toScreen({ x: 0, y: 0, z: 0.5 }, size)).toEqual({ x: 500, y: 250 });
  });

  it("maps NDC corners to the screen corners with y pointing down", () => {
    expect(toScreen({ x: -1, y: 1, z: 0.5 }, size)).toEqual({ x: 0, y: 0 });
    expect(toScreen({ x: 1, y: -1, z: 0.5 }, size)).toEqual({
      x: 1000,
      y: 500,
    });
  });

  it("returns nothing for points behind the camera", () => {
    expect(toScreen({ x: 0, y: 0, z: 1.2 }, size)).toBeUndefined();
  });
});
