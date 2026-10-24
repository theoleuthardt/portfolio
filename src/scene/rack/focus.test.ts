import { describe, expect, it } from "vitest";
import { rackSlots } from "../../content/rack";
import { approach, moduleFront } from "./focus";
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

describe("moduleFront of an ejected module", () => {
  it("lies further out by the slide-out distance", () => {
    const closed = moduleFront(flashi);
    const ejected = moduleFront(flashi, 0.32);
    expect(
      Math.hypot(ejected[0] - closed[0], ejected[2] - closed[2]),
    ).toBeCloseTo(0.32);
    expect(ejected[1]).toBeCloseTo(closed[1]);
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
