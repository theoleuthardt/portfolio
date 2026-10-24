import { describe, expect, it } from "vitest";
import { ROOM } from "../layout";
import { catenary, flickerLevel, vacuumPose, VACUUM_ROUTE } from "./procedural";

describe("catenary", () => {
  it("hangs between its ends and sags most in the middle", () => {
    const points = catenary([0, 2, 0], [2, 2, 0], 0.5, 8);
    expect(points).toHaveLength(9);
    expect(points[0]).toEqual([0, 2, 0]);
    expect(points[8]).toEqual([2, 2, 0]);
    expect(points[4][1]).toBeCloseTo(1.5);
    expect(points[2][1]).toBeCloseTo(points[6][1]);
    expect(points[2][1]).toBeGreaterThan(points[4][1]);
  });

  it("follows a slope between ends at different heights", () => {
    const points = catenary([0, 0, 0], [0, 2, 4], 0, 4);
    expect(points[2]).toEqual([0, 1, 2]);
  });
});

describe("vacuumPose", () => {
  it("drives a closed round that stays on the floor inside the room", () => {
    for (let second = 0; second < 120; second += 0.7) {
      const { position } = vacuumPose(second);
      expect(position[0]).toBeGreaterThan(ROOM.left + 0.5);
      expect(position[0]).toBeLessThan(ROOM.right - 0.5);
      expect(position[2]).toBeGreaterThan(ROOM.back + 0.5);
      expect(position[2]).toBeLessThan(ROOM.front - 0.5);
    }
    const start = vacuumPose(0).position;
    const lap = vacuumPose(VACUUM_ROUTE.lapSeconds).position;
    expect(lap[0]).toBeCloseTo(start[0]);
    expect(lap[2]).toBeCloseTo(start[2]);
  });

  it("moves smoothly and faces where it drives", () => {
    const a = vacuumPose(10);
    const b = vacuumPose(10.05);
    const step = Math.hypot(
      b.position[0] - a.position[0],
      b.position[2] - a.position[2],
    );
    expect(step).toBeLessThan(0.05);
    const heading = Math.atan2(
      b.position[0] - a.position[0],
      b.position[2] - a.position[2],
    );
    expect(Math.cos(heading - a.heading)).toBeGreaterThan(0.95);
  });
});

describe("flickerLevel", () => {
  it("is mostly on, drops out now and then, and is the same for the same time", () => {
    const levels = Array.from({ length: 400 }, (_, step) =>
      flickerLevel(step * 0.05),
    );
    const on = levels.filter((level) => level === 1).length;
    expect(on / levels.length).toBeGreaterThan(0.75);
    expect(on).toBeLessThan(levels.length);
    expect(flickerLevel(12.34)).toBe(flickerLevel(12.34));
  });
});
