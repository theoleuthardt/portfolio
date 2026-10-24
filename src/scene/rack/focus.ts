import type { RackSlot } from "../../content/rack";
import type { Vector3 } from "../cameraRig";
import { RACK, slotCenterY } from "./geometry";

/** Where the camera sits and what it looks at while a module is in focus. */
export interface FocusPose {
  position: Vector3;
  target: Vector3;
}

/**
 * Where the terminal sits: docked on the left (wide screens) or as a sheet
 * over the lower part of the screen (narrow desktop windows).
 */
export type FocusLayout = "docked" | "sheet";

/** How far in front of a focused module the camera stops. */
export const FOCUS_DISTANCE = 3.1;
const FOCUS_RISE = 0.3;
const SIDE_SHIFT = 1.05;
const TARGET_RISE = 0.45;
const SHEET_TARGET_DROP = -0.55;

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
 * Camera pose for a focused module: in front of it at a fixed distance,
 * slightly above, looking a bit to the left of and above it, so the module
 * lands right of the docked terminal and below the project panel. With the
 * terminal as a bottom sheet the camera looks below the module instead, so
 * the module sits in the visible upper part of the screen.
 */
export function focusPose(
  slot: RackSlot,
  layout: FocusLayout = "docked",
): FocusPose {
  const side = layout === "docked" ? SIDE_SHIFT : 0;
  const rise = layout === "docked" ? TARGET_RISE : SHEET_TARGET_DROP;
  const [fx, fz] = facing();
  const [mx, my, mz] = moduleFront(slot);
  const position: Vector3 = [
    mx + fx * FOCUS_DISTANCE,
    my + FOCUS_RISE,
    mz + fz * FOCUS_DISTANCE,
  ];
  const right: [number, number] = [fz, -fx];
  return {
    position,
    target: [mx - right[0] * side, my + rise, mz - right[1] * side],
  };
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
