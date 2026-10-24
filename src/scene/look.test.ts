import { describe, expect, it } from "vitest";
import { ROOM } from "./layout";
import {
  drag,
  IDLE_LOOK,
  LOOK_LIMITS,
  lookPose,
  relax,
  wheel,
  type Look,
} from "./look";

const position: [number, number, number] = [0, 1.4, 9];
const target: [number, number, number] = [0, 1.4, 0];

describe("drag", () => {
  it("turns the view against the drag, like grabbing the room", () => {
    const look = drag(IDLE_LOOK, 100, 0, 900);
    expect(look.yaw).toBeGreaterThan(0);
    const pose = lookPose(position, target, look);
    expect(pose.target[0]).toBeLessThan(0);
  });

  it("looks up when dragged down", () => {
    const look = drag(IDLE_LOOK, 0, 100, 900);
    expect(look.pitch).toBeGreaterThan(0);
    expect(lookPose(position, target, look).target[1]).toBeGreaterThan(1.4);
  });

  it("stops at the yaw and pitch limits", () => {
    const far = drag(IDLE_LOOK, 99999, 99999, 900);
    expect(far.yaw).toBe(LOOK_LIMITS.yawLeft);
    expect(far.pitch).toBe(LOOK_LIMITS.pitchUp);
    const other = drag(IDLE_LOOK, -99999, -99999, 900);
    expect(other.yaw).toBe(-LOOK_LIMITS.yawRight);
    expect(other.pitch).toBe(-LOOK_LIMITS.pitchDown);
  });
});

describe("wheel", () => {
  it("moves forward on wheel up and stops at the zoom limits", () => {
    expect(wheel(IDLE_LOOK, -100).zoom).toBeGreaterThan(0);
    expect(wheel(IDLE_LOOK, -99999).zoom).toBe(LOOK_LIMITS.zoomIn);
    expect(wheel(IDLE_LOOK, 99999).zoom).toBe(-LOOK_LIMITS.zoomOut);
  });
});

describe("lookPose", () => {
  it("keeps the rig's view without any look", () => {
    expect(lookPose(position, target, IDLE_LOOK)).toEqual({
      position,
      target,
    });
  });

  it("moves the eyes along the view when zoomed", () => {
    const pose = lookPose(position, target, { ...IDLE_LOOK, zoom: 2 });
    expect(pose.position[2]).toBeCloseTo(7);
    expect(pose.target[2]).toBeCloseTo(-2);
  });

  it("never leaves the room", () => {
    const pose = lookPose([0, 1.4, ROOM.front - 0.6], target, {
      ...IDLE_LOOK,
      zoom: -LOOK_LIMITS.zoomOut,
    });
    expect(pose.position[2]).toBeLessThanOrEqual(ROOM.front - 0.5);
  });
});

describe("relax", () => {
  const looked: Look = { yaw: 0.5, pitch: -0.2, zoom: 2 };

  it("eases back towards the rig", () => {
    const next = relax(looked, 0.1, false);
    expect(Math.abs(next.yaw)).toBeLessThan(0.5);
    expect(Math.abs(next.yaw)).toBeGreaterThan(0);
    expect(next.zoom).toBeLessThan(2);
  });

  it("returns at once with reduced motion", () => {
    expect(relax(looked, 0.1, true)).toEqual(IDLE_LOOK);
  });
});
