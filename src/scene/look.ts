import type { Vector3 } from "./cameraRig";
import { ROOM } from "./layout";

/** How far the visitor has turned, tilted and walked away from the rig. */
export interface Look {
  /** Turn around the vertical axis in radians; positive turns left. */
  yaw: number;
  /** Tilt in radians; positive looks up. */
  pitch: number;
  /** Metres along the view; positive walks forward. */
  zoom: number;
}

/** No look at all: the camera rig's own view. */
export const IDLE_LOOK: Look = { yaw: 0, pitch: 0, zoom: 0 };

/** How far the look may go from the rig's view. */
export const LOOK_LIMITS = {
  yaw: 1.7,
  pitchUp: 0.35,
  pitchDown: 0.3,
  zoomIn: 4,
  zoomOut: 1.5,
} as const;

const RADIANS_PER_VIEWPORT = 1.4;
const METRES_PER_WHEEL_PIXEL = 0.004;
const RETURN_RATE = 2.5;
const WALL_MARGIN = 0.5;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/**
 * The look after dragging by `dx`/`dy` pixels on a viewport `height` pixels
 * tall: the view turns against the drag, as if grabbing the room.
 */
export function drag(look: Look, dx: number, dy: number, height: number): Look {
  return {
    ...look,
    yaw: clamp(
      look.yaw + (dx / height) * RADIANS_PER_VIEWPORT,
      -LOOK_LIMITS.yaw,
      LOOK_LIMITS.yaw,
    ),
    pitch: clamp(
      look.pitch + (dy / height) * RADIANS_PER_VIEWPORT,
      -LOOK_LIMITS.pitchDown,
      LOOK_LIMITS.pitchUp,
    ),
  };
}

/** The look after a wheel turn of `deltaY` pixels; wheel up walks forward. */
export function wheel(look: Look, deltaY: number): Look {
  return {
    ...look,
    zoom: clamp(
      look.zoom - deltaY * METRES_PER_WHEEL_PIXEL,
      -LOOK_LIMITS.zoomOut,
      LOOK_LIMITS.zoomIn,
    ),
  };
}

/**
 * The look `delta` seconds later while nobody touches it: it eases back to
 * the rig's view, or jumps there with reduced motion.
 */
export function relax(look: Look, delta: number, reducedMotion: boolean): Look {
  if (reducedMotion) {
    return IDLE_LOOK;
  }
  const keep = Math.exp(-delta * RETURN_RATE);
  const settle = (value: number) =>
    Math.abs(value * keep) < 1e-4 ? 0 : value * keep;
  return {
    yaw: settle(look.yaw),
    pitch: settle(look.pitch),
    zoom: settle(look.zoom),
  };
}

/**
 * Camera position and target for the rig's `position` and `target` with the
 * look applied: the view direction turned by yaw and tilted by pitch, the
 * eyes moved along it by zoom, and never closer than half a metre to the
 * walls, floor or ceiling.
 */
export function lookPose(
  position: Vector3,
  target: Vector3,
  look: Look,
): { position: Vector3; target: Vector3 } {
  if (look.yaw === 0 && look.pitch === 0 && look.zoom === 0) {
    return { position, target };
  }
  const [dx, dy, dz] = [
    target[0] - position[0],
    target[1] - position[1],
    target[2] - position[2],
  ];
  const turnedX = dx * Math.cos(look.yaw) + dz * Math.sin(look.yaw);
  const turnedZ = -dx * Math.sin(look.yaw) + dz * Math.cos(look.yaw);
  const flat = Math.hypot(turnedX, turnedZ);
  const length = Math.hypot(flat, dy);
  const elevation = Math.atan2(dy, flat) + look.pitch;
  const scale = flat === 0 ? 0 : (length * Math.cos(elevation)) / flat;
  const direction: Vector3 = [
    turnedX * scale,
    length * Math.sin(elevation),
    turnedZ * scale,
  ];
  const step = look.zoom / length;
  const eyes: Vector3 = [
    clamp(
      position[0] + direction[0] * step,
      ROOM.left + WALL_MARGIN,
      ROOM.right - WALL_MARGIN,
    ),
    clamp(
      position[1] + direction[1] * step,
      ROOM.floor + WALL_MARGIN,
      ROOM.ceiling - WALL_MARGIN,
    ),
    clamp(
      position[2] + direction[2] * step,
      ROOM.back + WALL_MARGIN,
      ROOM.front - WALL_MARGIN,
    ),
  ];
  return {
    position: eyes,
    target: [
      eyes[0] + direction[0],
      eyes[1] + direction[1],
      eyes[2] + direction[2],
    ],
  };
}
