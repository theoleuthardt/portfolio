import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { Group, Mesh } from "three";
import { mergeStatic } from "./merge";

/** Props of {@link Baked}. */
export interface BakedProps {
  children: ReactNode;
}

/**
 * Draws its static meshes merged per material once they have mounted (see
 * {@link mergeStatic}): the originals stay in the tree but are hidden, the
 * merged meshes draw them in a few calls. Mark anything that moves, changes
 * its material or reacts to the pointer with `userData={{ dynamic: true }}`.
 */
export function Baked({ children }: BakedProps) {
  const root = useRef<Group>(null);
  const [merged, setMerged] = useState<readonly Mesh[]>([]);
  useLayoutEffect(() => {
    const group = root.current;
    if (group === null) {
      return;
    }
    group.updateMatrixWorld(true);
    const { meshes, sources } = mergeStatic(group);
    for (const source of sources) {
      source.visible = false;
    }
    setMerged(meshes);
    return () => {
      for (const source of sources) {
        source.visible = true;
      }
      for (const mesh of meshes) {
        mesh.geometry.dispose();
      }
    };
  }, []);
  return (
    <group ref={root}>
      {children}
      {merged.map((mesh) => (
        <primitive key={mesh.uuid} object={mesh} />
      ))}
    </group>
  );
}
