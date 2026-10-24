/** A point on the screen in CSS pixels. */
export interface ScreenPoint {
  x: number;
  y: number;
}

/**
 * SVG polyline points for the HUD line from the terminal prompt (`anchor`)
 * to the focused module: out of the terminal horizontally, diagonally across,
 * and into the module horizontally.
 */
export function connectorPoints(
  anchor: ScreenPoint,
  module: ScreenPoint,
): string {
  const points: [number, number][] = [
    [anchor.x, anchor.y],
    [anchor.x + 40, anchor.y],
    [module.x - 30, module.y],
    [module.x, module.y],
  ];
  return points.map(([x, y]) => `${Math.round(x)},${Math.round(y)}`).join(" ");
}
