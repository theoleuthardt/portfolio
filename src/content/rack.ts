import { projects } from "./projects";

/** One occupied position in the rack, counted in units from the top. */
export interface RackSlot {
  /** Project id, or `contact` / `about` for the non-project modules. */
  id: string;
  /** First unit from the top, starting at 0. */
  unit: number;
  units: number;
}

/**
 * The rack layout from top to bottom: the contact patch panel (1U), the
 * projects in their order, the about server (2U).
 */
export function rackSlots(): RackSlot[] {
  const modules = [
    { id: "contact", units: 1 },
    ...projects.map((project) => ({ id: project.id, units: project.units })),
    { id: "about", units: 2 },
  ];
  return modules.map((module, index) => ({
    ...module,
    unit: modules.slice(0, index).reduce((sum, m) => sum + m.units, 0),
  }));
}
