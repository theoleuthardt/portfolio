import type { Vector3 } from "../cameraRig";

/** A camera pose: where the eyes are and what they look at. */
export interface Pose {
  position: Vector3;
  target: Vector3;
}

/** A point on the page in CSS pixels. */
export type Point2 = [number, number];

/** Four page points, clockwise from the top left. */
export type Quad = [Point2, Point2, Point2, Point2];

/** Where the screen hangs in front of the seat and which way it faces. */
export interface ScreenFrame {
  centre: Vector3;
  right: Vector3;
  up: Vector3;
  /** Points out of the screen, towards the seat. */
  normal: Vector3;
}

const length = ([x, y, z]: Vector3) => Math.hypot(x, y, z);
const scale = ([x, y, z]: Vector3, factor: number): Vector3 => [
  x * factor + 0,
  y * factor + 0,
  z * factor + 0,
];
const add = (a: Vector3, b: Vector3): Vector3 => [
  a[0] + b[0],
  a[1] + b[1],
  a[2] + b[2],
];
const subtract = (a: Vector3, b: Vector3): Vector3 => [
  a[0] - b[0],
  a[1] - b[1],
  a[2] - b[2],
];
const normalize = (vector: Vector3): Vector3 =>
  scale(vector, 1 / length(vector));
const cross = (a: Vector3, b: Vector3): Vector3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

/**
 * The frame of an upright screen `distance` metres in front of the seat's
 * eyes (measured horizontally), shifted by `offset` (right, up), facing the
 * seat. It stays upright when the seat looks down, so seen from the seat it
 * is a slightly keystoned rectangle, like a real monitor on a desk.
 */
export function screenFrame(
  seat: Pose,
  { distance, offset }: { distance: number; offset: readonly [number, number] },
): ScreenFrame {
  const view = subtract(seat.target, seat.position);
  const forward = normalize([view[0], 0, view[2]]);
  const right = normalize(cross(forward, [0, 1, 0]));
  const up: Vector3 = [0, 1, 0];
  return {
    centre: add(
      add(seat.position, scale(forward, distance)),
      add(scale(right, offset[0]), scale(up, offset[1])),
    ),
    right,
    up,
    normal: scale(forward, -1),
  };
}

/** The corners of a `width` × `height` screen, clockwise from the top left. */
export function screenCorners(
  { centre, right, up }: ScreenFrame,
  width: number,
  height: number,
): [Vector3, Vector3, Vector3, Vector3] {
  const across = scale(right, width / 2);
  const down = scale(up, -height / 2);
  return [
    subtract(subtract(centre, across), down),
    subtract(add(centre, across), down),
    add(add(centre, across), down),
    add(subtract(centre, across), down),
  ];
}

/**
 * The CSS `matrix3d` (16 numbers, column-major) that maps an element of
 * `width` × `height` pixels with `transform-origin: 0 0` exactly onto
 * `quad`: the projective mapping of the unit square onto the quad, scaled
 * to the element.
 */
export function homography(
  width: number,
  height: number,
  quad: Quad,
): number[] {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = quad;
  const dx1 = x1 - x2;
  const dx2 = x3 - x2;
  const dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2;
  const dy2 = y3 - y2;
  const dy3 = y0 - y1 + y2 - y3;
  const denominator = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / denominator;
  const h = (dx1 * dy3 - dx3 * dy1) / denominator;
  const a = x1 - x0 + g * x1;
  const b = x3 - x0 + h * x3;
  const d = y1 - y0 + g * y1;
  const e = y3 - y0 + h * y3;
  return [
    a / width,
    d / width,
    0,
    g / width,
    b / height,
    e / height,
    0,
    h / height,
    0,
    0,
    1,
    0,
    x0,
    y0,
    0,
    1,
  ].map((value) => value + 0);
}

/**
 * The seated pose turned `share` of the way towards `point`, without moving
 * the eyes: a glance at a module that keeps the terminal in view.
 */
export function seatFocus(seat: Pose, point: Vector3, share = 0.45): Pose {
  const distance = length(subtract(seat.target, seat.position));
  const ahead = normalize(subtract(seat.target, seat.position));
  const towards = normalize(subtract(point, seat.position));
  const direction = normalize(
    add(scale(ahead, 1 - share), scale(towards, share)),
  );
  return {
    position: seat.position,
    target: add(seat.position, scale(direction, distance)),
  };
}

/**
 * The pose after standing up from the desk at `seat`: eyes higher and a
 * step back along the view, so the desk with the terminal stays in sight.
 */
export function standUp(seat: Pose): Pose {
  const forward = subtract(seat.target, seat.position);
  const back = normalize([-forward[0], 0, -forward[2]]);
  const position = add(add(seat.position, [0, 0.55, 0]), scale(back, 1.05));
  return { position, target: add(seat.target, [0, 0.2, 0]) };
}

/**
 * The chair at the desk beside rack-01: eyes about 1.2 m above the floor,
 * looking slightly down past the terminal towards the rack on the right.
 */
export const SEAT: Pose = {
  position: [-0.6, -0.4, 5],
  target: [0.52, -0.82, 2.22],
};

/** The terminal's screen: its size in metres and where it is in the view. */
export const SCREEN = {
  width: 0.44,
  aspect: 0.75,
  distance: 1.1,
  offset: [-0.16, -0.2] as [number, number],
} as const;

/**
 * The pose for a close look at the screen: straight in front of it, far
 * enough that a screen `height` metres tall fills `fill` of a view with a
 * vertical field of view of `fovDegrees`.
 */
export function leanIn(
  frame: ScreenFrame,
  height: number,
  fovDegrees: number,
  fill = 0.8,
): Pose {
  const distance = height / fill / (2 * Math.tan((fovDegrees * Math.PI) / 360));
  return {
    position: add(frame.centre, scale(frame.normal, distance)),
    target: frame.centre,
  };
}
