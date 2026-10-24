import { RACK_UNITS } from "../../content/projects";
import type { RackSlot } from "../../content/rack";
import { ROOM } from "../layout";

/** Size and placement of the server rack in the lab. */
export const RACK = {
  unitHeight: 0.13,
  width: 1.1,
  depth: 1,
  plinth: 0.08,
  floorY: ROOM.floor,
  x: 1.95,
  z: 1.6,
  rotationY: -0.55,
} as const;

/** Height of the rack frame from the floor to its top. */
export const RACK_HEIGHT = RACK.plinth + RACK_UNITS * RACK.unitHeight + 0.06;

/** Vertical centre of a slot, counted from the top of the rack. */
export function slotCenterY(slot: RackSlot): number {
  const top = RACK.floorY + RACK.plinth + RACK_UNITS * RACK.unitHeight;
  return top - (slot.unit + slot.units / 2) * RACK.unitHeight;
}

function noise(seed: number, step: number): number {
  const value = Math.sin(seed * 12.9898 + step * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

/**
 * Activity LED state (1 on, 0 off) for an LED with the given seed. The state
 * can change only every quarter second, so no LED flashes faster than four
 * times per second.
 */
export function blinkLevel(seed: number, seconds: number): 0 | 1 {
  return noise(seed, Math.floor(seconds * 4)) > 0.35 ? 1 : 0;
}
