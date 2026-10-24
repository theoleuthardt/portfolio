import { describe, expect, it } from "vitest";
import { projects, RACK_UNITS } from "./projects";
import { rackSlots } from "./rack";

describe("rackSlots", () => {
  const slots = rackSlots();

  it("starts with the contact patch panel and ends with the about server", () => {
    expect(slots[0]).toEqual({ id: "contact", unit: 0, units: 1 });
    expect(slots[slots.length - 1].id).toBe("about");
  });

  it("places the projects in rack order between them", () => {
    expect(slots.slice(1, -1).map((slot) => slot.id)).toEqual(
      projects.map((project) => project.id),
    );
  });

  it("stacks the slots without gaps or overlaps", () => {
    for (let i = 1; i < slots.length; i++) {
      expect(slots[i].unit).toBe(slots[i - 1].unit + slots[i - 1].units);
    }
  });

  it("fits into the rack", () => {
    const last = slots[slots.length - 1];
    expect(last.unit + last.units).toBeLessThanOrEqual(RACK_UNITS);
  });
});
