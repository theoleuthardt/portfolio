import { describe, expect, it } from "vitest";
import { RACK_UNITS } from "../../content/projects";
import { rackSlots } from "../../content/rack";
import { blinkLevel, RACK, slotCenterY } from "./geometry";

describe("slotCenterY", () => {
  it("puts the first slot right below the top of the rack", () => {
    const top = RACK.floorY + RACK_UNITS * RACK.unitHeight + RACK.plinth;
    expect(slotCenterY({ id: "contact", unit: 0, units: 1 })).toBeCloseTo(
      top - RACK.unitHeight / 2,
    );
  });

  it("stacks the slots downwards without overlap", () => {
    const slots = rackSlots();
    for (let i = 1; i < slots.length; i++) {
      const above =
        slotCenterY(slots[i - 1]) - (slots[i - 1].units * RACK.unitHeight) / 2;
      const below =
        slotCenterY(slots[i]) + (slots[i].units * RACK.unitHeight) / 2;
      expect(below).toBeCloseTo(above);
    }
  });

  it("keeps every slot above the floor", () => {
    for (const slot of rackSlots()) {
      expect(
        slotCenterY(slot) - (slot.units * RACK.unitHeight) / 2,
      ).toBeGreaterThan(RACK.floorY);
    }
  });
});

describe("blinkLevel", () => {
  it("is either on or off", () => {
    for (let t = 0; t < 10; t += 0.37) {
      expect([0, 1]).toContain(blinkLevel(7, t));
    }
  });

  it("is deterministic for a seed and time", () => {
    expect(blinkLevel(3, 4.2)).toBe(blinkLevel(3, 4.2));
  });

  it("lets different LEDs blink out of sync", () => {
    const pattern = (seed: number) =>
      Array.from({ length: 40 }, (_, i) => blinkLevel(seed, i * 0.25)).join("");
    expect(pattern(1)).not.toBe(pattern(2));
  });

  it("changes state at most four times per second", () => {
    let changes = 0;
    for (let i = 1; i <= 100; i++) {
      if (blinkLevel(5, i / 100) !== blinkLevel(5, (i - 1) / 100)) {
        changes++;
      }
    }
    expect(changes).toBeLessThanOrEqual(4);
  });
});
