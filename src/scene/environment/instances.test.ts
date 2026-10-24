import { Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { instanceMatrices } from "./instances";

describe("instanceMatrices", () => {
  it("translates one matrix per position", () => {
    const matrices = instanceMatrices([
      [1, 2, 3],
      [-4, 0, 5],
    ]);
    expect(matrices).toHaveLength(2);
    expect(new Vector3().setFromMatrixPosition(matrices[0]).toArray()).toEqual([
      1, 2, 3,
    ]);
    expect(new Vector3().setFromMatrixPosition(matrices[1]).toArray()).toEqual([
      -4, 0, 5,
    ]);
  });

  it("returns no matrices for no positions", () => {
    expect(instanceMatrices([])).toEqual([]);
  });
});
