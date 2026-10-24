import { useLayoutEffect, useRef, type ReactNode } from "react";
import type { InstancedMesh } from "three";
import { instanceMatrices, type Point3 } from "./instances";

export type { Point3 };

/** Props of {@link InstancedBoxes}. */
export interface InstancedBoxesProps {
  positions: readonly Point3[];
  size: Point3;
  /** The material, as a child element. */
  children: ReactNode;
}

/** Many equal boxes in one draw call. */
export function InstancedBoxes({
  positions,
  size,
  children,
}: InstancedBoxesProps) {
  const mesh = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const instanced = mesh.current;
    if (instanced === null) {
      return;
    }
    instanceMatrices(positions).forEach((matrix, index) =>
      instanced.setMatrixAt(index, matrix),
    );
    instanced.instanceMatrix.needsUpdate = true;
    instanced.computeBoundingSphere();
  }, [positions]);
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, positions.length]}>
      <boxGeometry args={size} />
      {children}
    </instancedMesh>
  );
}
