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

/** Camera rig of the lab scene. */
export const LAB_RIG: RigSettings = {
  base: [0.6, 1.4, 9],
  orbitRadians: 0.06,
  orbitPeriodSeconds: 48,
  parallax: 0.35,
};
