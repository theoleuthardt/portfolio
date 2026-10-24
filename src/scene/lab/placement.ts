import type { Vector3 } from "../cameraRig";
import { ROOM } from "../layout";

/** Where a lab object stands and which way its front faces. */
export interface Placement {
  position: Vector3;
  rotationY: number;
}

const FLOOR = ROOM.floor;
const FACING_RIGHT = Math.PI / 2;
const FACING_LEFT = -Math.PI / 2;

/**
 * The objects of the lab build-out, along the walls where a visitor at the
 * desk can turn to see them, keeping the aisle to the rack free.
 */
export const LAB = {
  door: { position: [ROOM.left + 0.02, FLOOR, 0.5], rotationY: FACING_RIGHT },
  vending: { position: [-6.5, FLOOR, 2.5], rotationY: FACING_RIGHT },
  arcade: { position: [-6.55, FLOOR, 4.1], rotationY: FACING_RIGHT },
  coffee: { position: [-6.65, FLOOR, 5.7], rotationY: FACING_RIGHT },
  whiteboard: {
    position: [ROOM.right - 0.04, 0.6, -4.3],
    rotationY: FACING_LEFT,
  },
  couch: { position: [-6.1, FLOOR, -6.6], rotationY: FACING_RIGHT },
  extinguisher: { position: [-6.8, FLOOR, -0.55], rotationY: FACING_RIGHT },
  cooling: { position: [-6.5, FLOOR, -3], rotationY: FACING_RIGHT },
  ups: { position: [6.5, FLOOR, -0.3], rotationY: FACING_LEFT },
  wallFan: { position: [ROOM.right - 0.05, 2.3, 1], rotationY: FACING_LEFT },
  switchWall: {
    position: [ROOM.right - 0.04, 0.45, 3.4],
    rotationY: FACING_LEFT,
  },
  workbench: { position: [6.3, FLOOR, 5.7], rotationY: FACING_LEFT },
  rack02: { position: [5, FLOOR, -4], rotationY: -2.3 },
  pallets: { position: [3, FLOOR, -12.2], rotationY: 0.25 },
  plants: { position: [-6.4, FLOOR, 1.55], rotationY: 0 },
  duct: { position: [-4.8, ROOM.ceiling - 0.38, -3], rotationY: 0 },
  flickerTube: { position: [-5.4, ROOM.ceiling - 0.12, 2], rotationY: 0 },
} as const satisfies Record<string, Placement>;
