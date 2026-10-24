import { describe, expect, it } from "vitest";
import { ROOM } from "../layout";
import { RACK } from "../rack/geometry";
import { MODEL_PROPS, PROP_MODELS } from "./placement";

describe("MODEL_PROPS", () => {
  it("places every prop inside the room", () => {
    for (const prop of MODEL_PROPS) {
      const [x, , z] = prop.position;
      expect(x).toBeGreaterThan(ROOM.left);
      expect(x).toBeLessThan(ROOM.right);
      expect(z).toBeGreaterThan(ROOM.back);
      expect(z).toBeLessThan(ROOM.front);
    }
  });

  it("keeps the rack's footprint free", () => {
    for (const prop of MODEL_PROPS) {
      const [x, , z] = prop.position;
      expect(Math.hypot(x - RACK.x, z - RACK.z)).toBeGreaterThan(1.4);
    }
  });

  it("keeps the central aisle in front of the camera free", () => {
    for (const prop of MODEL_PROPS) {
      const [x, , z] = prop.position;
      const inAisle = Math.abs(x) < 1.2 && z > -10;
      expect(inAisle).toBe(false);
    }
  });

  it("only uses models that exist in public/models", () => {
    const files = Object.keys(import.meta.glob("/public/models/*.glb"));
    for (const model of PROP_MODELS) {
      expect(files).toContain(`/public/models/${model}.glb`);
    }
    for (const prop of MODEL_PROPS) {
      expect(PROP_MODELS).toContain(prop.model);
    }
  });

  it("fills the room with at least fifteen placed models", () => {
    expect(MODEL_PROPS.length).toBeGreaterThanOrEqual(15);
  });
});
