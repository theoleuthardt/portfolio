import { describe, expect, it } from "vitest";
import { cameraPosition, standUp, type RigSettings } from "./cameraRig";

const settings: RigSettings = {
  base: [0, 1, 10],
  orbitRadians: 0.05,
  orbitPeriodSeconds: 40,
  parallax: 0.6,
};

describe("cameraPosition", () => {
  it("rests at the base position at time zero with a centred pointer", () => {
    const [x, y, z] = cameraPosition(settings, 0, { x: 0, y: 0 }, false);
    expect(x).toBeCloseTo(0);
    expect(y).toBeCloseTo(1);
    expect(z).toBeCloseTo(10);
  });

  it("orbits around the target over time without changing the distance", () => {
    const quarter = settings.orbitPeriodSeconds / 4;
    const [x, , z] = cameraPosition(settings, quarter, { x: 0, y: 0 }, false);
    expect(x).toBeGreaterThan(0);
    expect(Math.hypot(x, z)).toBeCloseTo(10);
  });

  it("shifts with the pointer", () => {
    const [x, y] = cameraPosition(settings, 0, { x: 1, y: 1 }, false);
    expect(x).toBeCloseTo(0.6);
    expect(y).toBeCloseTo(1 + 0.6 * 0.5);
  });

  it("stays at the base position with reduced motion", () => {
    expect(cameraPosition(settings, 13, { x: 1, y: -1 }, true)).toEqual([
      0, 1, 10,
    ]);
  });
});

describe("standUp", () => {
  it("raises the eyes and steps back from the desk", () => {
    const [x, y, z] = standUp([0.6, 1.4, 9]);
    expect(x).toBe(0.6);
    expect(y).toBeGreaterThan(1.4);
    expect(z).toBeGreaterThan(9);
  });
});
