import type { Vector3 } from "../cameraRig";

/**
 * `segments + 1` points of a cable hanging from `from` to `to`, sagging by
 * `sag` metres in the middle (a parabola, close enough to a catenary for
 * cables).
 */
export function catenary(
  from: Vector3,
  to: Vector3,
  sag: number,
  segments: number,
): Vector3[] {
  return Array.from({ length: segments + 1 }, (_, index) => {
    const t = index / segments;
    return [
      from[0] + (to[0] - from[0]) * t,
      from[1] + (to[1] - from[1]) * t - 4 * sag * t * (1 - t),
      from[2] + (to[2] - from[2]) * t,
    ];
  });
}

/** The robot vacuum's round: an ellipse on the floor behind the rack. */
export const VACUUM_ROUTE = {
  centre: [0, -3] as const,
  radiusX: 1.6,
  radiusZ: 1,
  lapSeconds: 40,
};

/**
 * Where the robot vacuum is after `seconds` (on the floor plane, y = 0) and
 * its heading around the vertical axis, facing the way it drives.
 */
export function vacuumPose(seconds: number): {
  position: Vector3;
  heading: number;
} {
  const { centre, radiusX, radiusZ, lapSeconds } = VACUUM_ROUTE;
  const angle = (2 * Math.PI * seconds) / lapSeconds;
  return {
    position: [
      centre[0] + radiusX * Math.cos(angle),
      0,
      centre[1] + radiusZ * Math.sin(angle),
    ],
    heading: Math.atan2(-radiusX * Math.sin(angle), radiusZ * Math.cos(angle)),
  };
}

/**
 * Brightness of a failing fluorescent tube at `seconds`: on (1) most of the
 * time, with short dips (0.15) in bursts; the state changes at most twelve
 * times per second.
 */
export function flickerLevel(seconds: number): 0.15 | 1 {
  const step = Math.floor(seconds * 12);
  const burst = Math.sin(Math.floor(seconds / 3) * 91.7) * 43758.5453;
  const flicker = Math.sin(step * 12.9898) * 43758.5453;
  const inBurst = burst - Math.floor(burst) > 0.65 && seconds % 3 < 0.8;
  return inBurst && flicker - Math.floor(flicker) > 0.45 ? 0.15 : 1;
}
