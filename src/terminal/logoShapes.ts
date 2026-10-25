/** Height of one character cell in the logo, its width being 1. */
export const CELL_HEIGHT = 2;

/** A filled cell, by its top-left corner. */
export interface LogoBlock {
  x: number;
  y: number;
}

/** A line segment of the logo's shadow. */
export interface LogoStroke {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** The logo as cells and lines, to draw it as an image. */
export interface LogoShapes {
  blocks: LogoBlock[];
  strokes: LogoStroke[];
  width: number;
  height: number;
}

type Side = "left" | "right" | "up" | "down";

const LINKS: Readonly<Record<string, readonly Side[]>> = {
  "═": ["left", "right"],
  "║": ["up", "down"],
  "╔": ["right", "down"],
  "╗": ["left", "down"],
  "╚": ["up", "right"],
  "╝": ["up", "left"],
};

/**
 * The ANSI Shadow letters of a text logo as shapes: every `█` a filled cell,
 * every box-drawing glyph lines from the cell centre to the sides it links,
 * so the logo can be drawn as an image in any font.
 */
export function logoShapes(logo: string): LogoShapes {
  const lines = logo.split("\n");
  const blocks: LogoBlock[] = [];
  const strokes: LogoStroke[] = [];
  lines.forEach((line, row) => {
    [...line].forEach((char, column) => {
      const top = row * CELL_HEIGHT;
      if (char === "█") {
        blocks.push({ x: column, y: top });
        return;
      }
      const centre = { x: column + 0.5, y: top + CELL_HEIGHT / 2 };
      const horizontal = LINKS[char]?.filter(
        (side) => side === "left" || side === "right",
      );
      const vertical = LINKS[char]?.filter(
        (side) => side === "up" || side === "down",
      );
      if (horizontal?.length === 2) {
        strokes.push({
          x1: column,
          y1: centre.y,
          x2: column + 1,
          y2: centre.y,
        });
      }
      if (vertical?.length === 2) {
        strokes.push({
          x1: centre.x,
          y1: top,
          x2: centre.x,
          y2: top + CELL_HEIGHT,
        });
      }
      if (horizontal?.length === 1 && vertical?.length === 1) {
        const [across] = horizontal;
        const [along] = vertical;
        const horizontalStroke = {
          x1: across === "left" ? column : centre.x,
          y1: centre.y,
          x2: across === "left" ? centre.x : column + 1,
          y2: centre.y,
        };
        const verticalStroke = {
          x1: centre.x,
          y1: along === "up" ? top : centre.y,
          x2: centre.x,
          y2: along === "up" ? centre.y : top + CELL_HEIGHT,
        };
        strokes.push(
          ...(along === "up"
            ? [verticalStroke, horizontalStroke]
            : [horizontalStroke, verticalStroke]),
        );
      }
    });
  });
  return {
    blocks,
    strokes,
    width: Math.max(...lines.map((line) => [...line].length)),
    height: lines.length * CELL_HEIGHT,
  };
}
