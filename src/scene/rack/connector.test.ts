import { describe, expect, it } from "vitest";
import { connectorPoints } from "./connector";

describe("connectorPoints", () => {
  it("leaves the anchor horizontally, then runs to the module", () => {
    expect(connectorPoints({ x: 100, y: 400 }, { x: 900, y: 300 })).toBe(
      "100,400 140,400 870,300 900,300",
    );
  });

  it("rounds to whole pixels", () => {
    expect(connectorPoints({ x: 10.4, y: 20.6 }, { x: 99.5, y: 50.2 })).toBe(
      "10,21 50,21 70,50 100,50",
    );
  });
});
