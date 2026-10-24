import { Matrix4, Quaternion, Vector3 } from "three";
import { ROOM } from "../layout";
import {
  leanIn,
  type Pose,
  SCREEN,
  screenCorners,
  screenFrame,
  SEAT,
} from "./seat";

/** Where the terminal's screen is in the lab, in front of the seat. */
export const TERMINAL_FRAME = screenFrame(SEAT, SCREEN);

/** The screen's corners in scene space, clockwise from the top left. */
export const SCREEN_CORNERS = screenCorners(
  TERMINAL_FRAME,
  SCREEN.width,
  SCREEN.width * SCREEN.aspect,
);

/** The terminal model's rotation, facing the seat. */
export const TERMINAL_ORIENTATION = new Quaternion().setFromRotationMatrix(
  new Matrix4().makeBasis(
    new Vector3(...TERMINAL_FRAME.right),
    new Vector3(...TERMINAL_FRAME.up),
    new Vector3(...TERMINAL_FRAME.normal),
  ),
);

/** The floor below the screen centre, in model units (screen widths). */
export const TERMINAL_FLOOR =
  (ROOM.floor - TERMINAL_FRAME.centre[1]) / SCREEN.width;

/** The seated eyes and the screen centre, as Three.js vectors. */
export const SEAT_EYES = new Vector3(...SEAT.position);
export const SCREEN_CENTRE = new Vector3(...TERMINAL_FRAME.centre);

/** How far the screen is from the seated eyes along the view. */
export const SCREEN_DEPTH = SCREEN_CENTRE.clone()
  .sub(SEAT_EYES)
  .dot(new Vector3(...SEAT.target).sub(SEAT_EYES).normalize());

/** The pose of a close look at the terminal's screen. */
export function closePose(fovDegrees: number): Pose {
  return leanIn(TERMINAL_FRAME, SCREEN.width * SCREEN.aspect, fovDegrees);
}
