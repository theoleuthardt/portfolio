/** A position on the floor plane: x and z. */
export type FloorPoint = [number, number];

/** Inner bounds of the lab in scene units (metres). */
export const ROOM = {
  left: -7,
  right: 7,
  front: 11,
  back: -18,
  floor: -1.6,
  ceiling: 3.2,
} as const;

/** Depths of the volumetric light beams under the ceiling panels. */
export const BEAM_ZS = [2, -3.5, -9] as const;

/** Positions of a `cols` × `rows` grid with the given spacing, centred on `center`. */
export function centeredGrid(
  cols: number,
  rows: number,
  spacingX: number,
  spacingZ: number,
  [cx, cz]: FloorPoint,
): FloorPoint[] {
  const points: FloorPoint[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      points.push([
        cx + (col - (cols - 1) / 2) * spacingX,
        cz + (row - (rows - 1) / 2) * spacingZ,
      ]);
    }
  }
  return points;
}

/** `count` values from `start` to `end`, both included. */
export function evenlySpaced(
  start: number,
  end: number,
  count: number,
): number[] {
  if (count === 1) {
    return [start];
  }
  return Array.from(
    { length: count },
    (_, i) => start + ((end - start) * i) / (count - 1),
  );
}
