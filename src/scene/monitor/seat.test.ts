import { describe, expect, it } from "vitest";
import {
  homography,
  leanIn,
  type Point2,
  screenCorners,
  screenFrame,
  seatFocus,
  standUp,
  type Pose,
} from "./seat";

const seat: Pose = { position: [0, 1, 5], target: [0, 1, 0] };

function apply(matrix: number[], [x, y]: Point2): Point2 {
  const w = matrix[3] * x + matrix[7] * y + matrix[15];
  return [
    (matrix[0] * x + matrix[4] * y + matrix[12]) / w,
    (matrix[1] * x + matrix[5] * y + matrix[13]) / w,
  ];
}

describe("screenFrame", () => {
  it("puts the screen in front of the seat, facing it, offset left and down", () => {
    const frame = screenFrame(seat, { distance: 0.6, offset: [-0.2, -0.05] });
    expect(frame.centre[0]).toBeCloseTo(-0.2);
    expect(frame.centre[1]).toBeCloseTo(0.95);
    expect(frame.centre[2]).toBeCloseTo(4.4);
    expect(frame.normal).toEqual([0, 0, 1]);
    expect(frame.right[0]).toBeCloseTo(1);
    expect(frame.up[1]).toBeCloseTo(1);
  });
});

describe("screenFrame from a seat looking down", () => {
  it("keeps the screen upright, facing the seat horizontally", () => {
    const frame = screenFrame(
      { position: [0, 1, 5], target: [0, 0, 2] },
      { distance: 0.6, offset: [0, -0.2] },
    );
    expect(frame.up).toEqual([0, 1, 0]);
    expect(frame.normal[1]).toBe(0);
    expect(frame.normal[2]).toBeCloseTo(1);
    expect(frame.centre[1]).toBeCloseTo(0.8);
    expect(frame.centre[2]).toBeCloseTo(4.4);
  });
});

describe("screenCorners", () => {
  it("returns the corners clockwise from the top left", () => {
    const frame = screenFrame(seat, { distance: 0.6, offset: [0, 0] });
    const [topLeft, topRight, bottomRight, bottomLeft] = screenCorners(
      frame,
      0.4,
      0.3,
    );
    expect(topLeft[0]).toBeCloseTo(-0.2);
    expect(topLeft[1]).toBeCloseTo(1.15);
    expect(topRight[0]).toBeCloseTo(0.2);
    expect(bottomRight[1]).toBeCloseTo(0.85);
    expect(bottomLeft[0]).toBeCloseTo(-0.2);
  });
});

describe("homography", () => {
  it("is the identity for a quad equal to the element", () => {
    const matrix = homography(400, 300, [
      [0, 0],
      [400, 0],
      [400, 300],
      [0, 300],
    ]);
    expect(matrix.map((value) => Math.round(value * 1e6) / 1e6)).toEqual([
      1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
    ]);
  });

  it("maps the element's corners onto any quad, also in perspective", () => {
    const quad: [Point2, Point2, Point2, Point2] = [
      [120, 80],
      [530, 110],
      [520, 420],
      [100, 450],
    ];
    const matrix = homography(400, 300, quad);
    const corners: Point2[] = [
      [0, 0],
      [400, 0],
      [400, 300],
      [0, 300],
    ];
    corners.forEach((corner, index) => {
      const [x, y] = apply(matrix, corner);
      expect(x).toBeCloseTo(quad[index][0]);
      expect(y).toBeCloseTo(quad[index][1]);
    });
  });
});

describe("seatFocus", () => {
  it("turns the head part of the way towards a module, without moving", () => {
    const pose = seatFocus(seat, [4, 1, 1], 0.5);
    expect(pose.position).toEqual(seat.position);
    expect(pose.target[0]).toBeGreaterThan(0);
    expect(pose.target[0]).toBeLessThan(4);
  });
});

describe("standUp", () => {
  it("raises the eyes and steps back along the view", () => {
    const standing = standUp(seat);
    expect(standing.position[1]).toBeGreaterThan(1);
    expect(standing.position[2]).toBeGreaterThan(5);
    expect(standing.position[0]).toBeCloseTo(0);
  });
});

describe("leanIn", () => {
  it("brings the eyes straight in front of the screen until it fills the view", () => {
    const frame = screenFrame(seat, { distance: 1, offset: [-0.2, -0.1] });
    const pose = leanIn(frame, 0.3, 38, 0.8);
    expect(pose.target).toEqual(frame.centre);
    expect(pose.position[0]).toBeCloseTo(frame.centre[0]);
    expect(pose.position[1]).toBeCloseTo(frame.centre[1]);
    const distance = pose.position[2] - frame.centre[2];
    const visible = 2 * distance * Math.tan((19 * Math.PI) / 180);
    expect(0.3 / visible).toBeCloseTo(0.8);
  });
});
