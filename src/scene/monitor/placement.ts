import type { Vector3 } from "../cameraRig";

/** A rectangle on the page in CSS pixels, like a `DOMRect`. */
export interface ScreenRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Where a camera-attached plane has to be to cover a page rectangle. */
export interface ScreenPlacement {
  /** Centre of the plane in camera space (the camera looks down -z). */
  position: Vector3;
  width: number;
  height: number;
}

/**
 * Places a plane facing the camera at `distance` so that it projects exactly
 * onto `rect` of a page of size `viewport`, for a perspective camera with a
 * vertical field of view of `fovDegrees`.
 */
export function screenPlacement(
  rect: ScreenRect,
  viewport: { width: number; height: number },
  fovDegrees: number,
  distance: number,
): ScreenPlacement {
  const visibleHeight =
    2 * distance * Math.tan(((fovDegrees / 2) * Math.PI) / 180);
  const perPixel = visibleHeight / viewport.height;
  const centreX = rect.left + rect.width / 2 - viewport.width / 2;
  const centreY = viewport.height / 2 - (rect.top + rect.height / 2);
  return {
    position: [centreX * perPixel, centreY * perPixel, -distance],
    width: rect.width * perPixel,
    height: rect.height * perPixel,
  };
}
