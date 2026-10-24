import { useLayoutEffect, useRef, type ReactNode } from "react";
import { Object3D, type InstancedMesh } from "three";

/** A position in scene space. */
export type Point3 = [number, number, number];

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
    const dummy = new Object3D();
    positions.forEach((position, index) => {
      dummy.position.set(...position);
      dummy.updateMatrix();
      mesh.current?.setMatrixAt(index, dummy.matrix);
    });
    if (mesh.current) {
      mesh.current.instanceMatrix.needsUpdate = true;
    }
  }, [positions]);
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, positions.length]}>
      <boxGeometry args={size} />
      {children}
    </instancedMesh>
  );
}
