import type { RackSlot } from "../../content/rack";
import type { Vector3 } from "../cameraRig";
import { RACK, slotCenterY } from "./geometry";

/** Where the camera sits and what it looks at while a module is in focus. */
export interface FocusPose {
  position: Vector3;
  target: Vector3;
}

/** How far in front of a focused module the camera stops. */
export const FOCUS_DISTANCE = 3.1;
const FOCUS_RISE = 0.3;
const SIDE_SHIFT = 1.05;
const TARGET_RISE = 0.45;

function facing(): [number, number] {
  return [Math.sin(RACK.rotationY), Math.cos(RACK.rotationY)];
}

/** Centre of a module's front plate in scene space. */
export function moduleFront(slot: RackSlot): Vector3 {
  const [fx, fz] = facing();
  return [
    RACK.x + (RACK.depth / 2) * fx,
    slotCenterY(slot),
    RACK.z + (RACK.depth / 2) * fz,
  ];
}

/**
 * Camera pose for a focused module: in front of it at a fixed distance,
 * slightly above, looking a bit to the left of and above it, so the module
 * lands right of the docked terminal and below the project panel.
 */
export function focusPose(slot: RackSlot): FocusPose {
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
    target: [
      mx - right[0] * SIDE_SHIFT,
      my + TARGET_RISE,
      mz - right[1] * SIDE_SHIFT,
    ],
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
