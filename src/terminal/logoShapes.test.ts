import { describe, expect, it } from "vitest";
import { LOGO_COMPACT, LOGO_WIDE } from "./boot";
import { CELL_HEIGHT, logoShapes } from "./logoShapes";

describe("logoShapes", () => {
  it("turns every full block into a filled cell", () => {
    const shapes = logoShapes("█ █\n ██");
    expect(shapes.blocks).toEqual([
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 1, y: CELL_HEIGHT },
      { x: 2, y: CELL_HEIGHT },
    ]);
    expect(shapes.width).toBe(3);
    expect(shapes.height).toBe(2 * CELL_HEIGHT);
  });

  it("draws the shadow glyphs as lines through the cell centre", () => {
    const mid = CELL_HEIGHT / 2;
    expect(logoShapes("═").strokes).toEqual([
      { x1: 0, y1: mid, x2: 1, y2: mid },
    ]);
    expect(logoShapes("║").strokes).toEqual([
      { x1: 0.5, y1: 0, x2: 0.5, y2: CELL_HEIGHT },
    ]);
    expect(logoShapes("╗").strokes).toEqual([
      { x1: 0, y1: mid, x2: 0.5, y2: mid },
      { x1: 0.5, y1: mid, x2: 0.5, y2: CELL_HEIGHT },
    ]);
    expect(logoShapes("╚").strokes).toEqual([
      { x1: 0.5, y1: 0, x2: 0.5, y2: mid },
      { x1: 0.5, y1: mid, x2: 1, y2: mid },
    ]);
  });

  it("covers every glyph of both logos", () => {
    for (const logo of [LOGO_WIDE, LOGO_COMPACT]) {
      const glyphs = [...logo].filter((char) => !" \n".includes(char));
      const shapes = logoShapes(logo);
      const drawn =
        shapes.blocks.length +
        [...logo].filter((char) => "═║".includes(char)).length +
        [...logo].filter((char) => "╔╗╚╝".includes(char)).length;
      expect(drawn).toBe(glyphs.length);
      expect(shapes.strokes.length).toBeGreaterThan(0);
    }
  });
});
