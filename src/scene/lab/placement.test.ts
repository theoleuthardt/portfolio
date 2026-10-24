import { describe, expect, it } from "vitest";
import { ROOM } from "../layout";
import { LOOK_LIMITS } from "../look";
import { SEAT, standUp } from "../monitor/seat";
import { LAB } from "./placement";

describe("LAB", () => {
  it("places every object inside the room", () => {
    for (const [name, { position }] of Object.entries(LAB)) {
      const [x, y, z] = position;
      expect(x, name).toBeGreaterThanOrEqual(ROOM.left);
      expect(x, name).toBeLessThanOrEqual(ROOM.right);
      expect(y, name).toBeGreaterThanOrEqual(ROOM.floor);
      expect(y, name).toBeLessThanOrEqual(ROOM.ceiling);
      expect(z, name).toBeGreaterThanOrEqual(ROOM.back);
      expect(z, name).toBeLessThanOrEqual(ROOM.front);
    }
  });

  it("keeps the walk from the camera to the rack free", () => {
    for (const [name, { position }] of Object.entries(LAB)) {
      const [x, y, z] = position;
      const onFloor = y < ROOM.floor + 2;
      const inAisle = Math.abs(x) < 4 && z > 2 && z < 9;
      expect(onFloor && inAisle, name).toBe(false);
    }
  });

  it("puts every object where a visitor can turn to see it from the desk", () => {
    const { position, target } = standUp(SEAT);
    const ahead = Math.atan2(
      target[0] - position[0],
      -(target[2] - position[2]),
    );
    const halfView = 0.55;
    for (const [name, placement] of Object.entries(LAB)) {
      const [x, , z] = placement.position;
      const bearing = Math.atan2(x - position[0], -(z - position[2]));
      const turn = Math.abs(bearing - ahead);
      expect(turn, name).toBeLessThanOrEqual(LOOK_LIMITS.yaw + halfView);
    }
  });
});
