import { describe, expect, it } from "vitest";
import { fieldOfView } from "../cameraRig";
import { SCREEN, SEAT } from "./seat";
import { SCREEN_CORNERS, SCREEN_DEPTH } from "./terminal";

/** The share of the view's height the screen takes from the seat. */
const heightShare = (aspect: number) =>
  (SCREEN.width * SCREEN.aspect) /
  (2 * SCREEN_DEPTH * Math.tan((fieldOfView(aspect) * Math.PI) / 360));

describe("the terminal on the desk", () => {
  it("shows a screen of about 40 to 50 % of the view's height from the seat", () => {
    expect(heightShare(1440 / 900)).toBeGreaterThan(0.4);
    expect(heightShare(1440 / 900)).toBeLessThan(0.5);
    expect(heightShare(1024 / 768)).toBeLessThan(0.5);
  });

  it("keeps the screen below the seated eyes, like a monitor on a desk", () => {
    for (const [, y] of SCREEN_CORNERS) {
      expect(y).toBeLessThan(SEAT.position[1]);
    }
  });
});
