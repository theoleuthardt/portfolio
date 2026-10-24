import { describe, expect, it } from "vitest";
import { rackSlots } from "../../content/rack";
import { approach, FOCUS_DISTANCE, focusPose, moduleFront } from "./focus";
import { RACK, slotCenterY } from "./geometry";

const flashi = rackSlots().find((slot) => slot.id === "flashi");
if (flashi === undefined) {
  throw new Error("flashi slot missing");
}

describe("moduleFront", () => {
  it("lies at the module's height in front of the rack", () => {
    const [, y] = moduleFront(flashi);
    expect(y).toBeCloseTo(slotCenterY(flashi));
  });

  it("is about half a rack depth away from the rack centre", () => {
    const [x, , z] = moduleFront(flashi);
    expect(Math.hypot(x - RACK.x, z - RACK.z)).toBeCloseTo(RACK.depth / 2, 1);
  });
});

describe("focusPose", () => {
  const pose = focusPose(flashi);

  it("puts the camera at the focus distance in front of the module", () => {
    const front = moduleFront(flashi);
    const distance = Math.hypot(
      pose.position[0] - front[0],
      pose.position[2] - front[2],
    );
    expect(distance).toBeCloseTo(FOCUS_DISTANCE, 5);
  });

  it("looks slightly to the side so the module appears right of the terminal", () => {
    const front = moduleFront(flashi);
    const dx = pose.target[0] - pose.position[0];
    const dz = pose.target[2] - pose.position[2];
    const right = [-dz, dx];
    const toModule = [front[0] - pose.target[0], front[2] - pose.target[2]];
    expect(toModule[0] * right[0] + toModule[1] * right[1]).toBeGreaterThan(0);
  });
});

describe("approach", () => {
  it("moves part of the way towards the target", () => {
    const next = approach(0, 10, 0.1, 5);
    expect(next).toBeGreaterThan(0);
    expect(next).toBeLessThan(10);
  });

  it("gets there after enough time", () => {
    expect(approach(0, 10, 5, 5)).toBeCloseTo(10, 3);
  });

  it("jumps straight to the target when instant", () => {
    expect(approach(0, 10, 0.01, Infinity)).toBe(10);
  });
});
