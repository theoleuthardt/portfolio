import type { RackSlot } from "../../content/rack";
import type { Vector3 } from "../cameraRig";
import { RACK, slotCenterY } from "./geometry";

function facing(): [number, number] {
  return [Math.sin(RACK.rotationY), Math.cos(RACK.rotationY)];
}

/** How far an open module slides out of the rack. */
export const SLIDE_OUT = 0.32;

/**
 * Centre of a module's front plate in scene space, `slidOut` metres in front
 * of its closed position.
 */
export function moduleFront(slot: RackSlot, slidOut = 0): Vector3 {
  const [fx, fz] = facing();
  const reach = RACK.depth / 2 + slidOut;
  return [RACK.x + reach * fx, slotCenterY(slot), RACK.z + reach * fz];
}

/**
 * Frame-rate independent exponential approach of `current` to `target`;
 * `speed` is the rate per second, `Infinity` jumps straight there.
 */
export function approach(
  current: number,
  target: number,
  seconds: number,
  speed: number,
): number {
  if (speed === Infinity) {
    return target;
  }
  return target + (current - target) * Math.exp(-speed * seconds);
}
