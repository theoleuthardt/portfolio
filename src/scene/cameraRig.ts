import { SEAT } from "./monitor/seat";

/** A point in scene space. */
export type Vector3 = [number, number, number];

/** Pointer position in normalised device coordinates (-1 to 1). */
export interface Pointer {
  x: number;
  y: number;
}

/** How the camera drifts around its base position. */
export interface RigSettings {
  base: Vector3;
  /** Largest orbit angle around the vertical axis through the origin. */
  orbitRadians: number;
  orbitPeriodSeconds: number;
  /** Camera shift per unit of pointer movement. */
  parallax: number;
}

/**
 * Camera position at `seconds`: a slow back-and-forth orbit around the
 * vertical axis plus a parallax shift towards the pointer. With reduced
 * motion the camera stays at its base position.
 */
export function cameraPosition(
  settings: RigSettings,
  seconds: number,
  pointer: Pointer,
  reducedMotion: boolean,
): Vector3 {
  const [bx, by, bz] = settings.base;
  if (reducedMotion) {
    return [bx, by, bz];
  }
  const angle =
    Math.sin((2 * Math.PI * seconds) / settings.orbitPeriodSeconds) *
    settings.orbitRadians;
  const x = bx * Math.cos(angle) + bz * Math.sin(angle);
  const z = -bx * Math.sin(angle) + bz * Math.cos(angle);
  return [
    x + pointer.x * settings.parallax,
    by + pointer.y * settings.parallax * 0.5,
    z,
  ];
}

/** Camera rig of the lab scene: seated at the desk, barely drifting. */
export const LAB_RIG: RigSettings = {
  base: SEAT.position,
  orbitRadians: 0.004,
  orbitPeriodSeconds: 48,
  parallax: 0.05,
};

const BASE_FOV = 38;
const BASE_ASPECT = 1.6;

/**
 * Vertical field of view in degrees for a viewport of `aspect` (width /
 * height): the base 38° from 16:10 up, wider below, so the horizontal view
 * never gets narrower than at 16:10 and the terminal and the rack both stay
 * in sight.
 */
export function fieldOfView(aspect: number): number {
  if (aspect >= BASE_ASPECT) {
    return BASE_FOV;
  }
  const halfWidth = Math.tan((BASE_FOV * Math.PI) / 360) * BASE_ASPECT;
  return (2 * Math.atan(halfWidth / aspect) * 180) / Math.PI;
}

/**
 * How the canvas renders: every frame normally, only on changes with
 * reduced motion, and not at all while the tab is hidden.
 */
export function frameloopFor({
  hidden,
  reducedMotion,
}: {
  hidden: boolean;
  reducedMotion: boolean;
}): "always" | "demand" | "never" {
  if (hidden) {
    return "never";
  }
  return reducedMotion ? "demand" : "always";
}
