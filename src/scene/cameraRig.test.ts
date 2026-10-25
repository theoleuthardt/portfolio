import { describe, expect, it } from "vitest";
import {
  cameraPosition,
  fieldOfView,
  frameloopFor,
  type RigSettings,
} from "./cameraRig";

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

describe("fieldOfView", () => {
  it("keeps the base field of view on wide screens", () => {
    expect(fieldOfView(16 / 9)).toBe(38);
    expect(fieldOfView(1.6)).toBeCloseTo(38, 0);
  });

  it("widens on narrower screens so the sides stay in view", () => {
    const narrow = fieldOfView(0.8);
    expect(narrow).toBeGreaterThan(38);
    const horizontal = (fov: number, aspect: number) =>
      2 * Math.atan(Math.tan((fov * Math.PI) / 360) * aspect);
    expect(horizontal(narrow, 0.8)).toBeCloseTo(horizontal(38, 1.6), 5);
  });
});

describe("frameloopFor", () => {
  it("renders always, on demand with reduced motion, and never in a hidden tab", () => {
    expect(frameloopFor({ hidden: false, reducedMotion: false })).toBe(
      "always",
    );
    expect(frameloopFor({ hidden: false, reducedMotion: true })).toBe("demand");
    expect(frameloopFor({ hidden: true, reducedMotion: false })).toBe("never");
    expect(frameloopFor({ hidden: true, reducedMotion: true })).toBe("never");
  });
});
