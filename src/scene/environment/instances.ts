import { Matrix4 } from "three";

/** A position in scene space. */
export type Point3 = [number, number, number];

/** One translation matrix per position, for an instanced mesh. */
export function instanceMatrices(positions: readonly Point3[]): Matrix4[] {
  return positions.map((position) =>
    new Matrix4().makeTranslation(...position),
  );
}
