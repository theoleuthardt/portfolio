import { MeshReflectorMaterial } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import { ROOM, evenlySpaced } from "../layout";
import { glassFloorTexture, tileRoughnessTexture } from "./textures";
import { InstancedBoxes, type Point3 } from "./InstancedBoxes";
import { glow, palette } from "./palette";

const TILE = 1.2;
const WIDTH = ROOM.right - ROOM.left;
const DEPTH = ROOM.front - ROOM.back;
const CENTER_Z = (ROOM.front + ROOM.back) / 2;

/** Glossy tiled floor with real reflections. */
function Tiles() {
  const roughness = useMemo(() => {
    const texture = tileRoughnessTexture();
    texture.repeat.set(WIDTH / (TILE * 4), DEPTH / (TILE * 4));
    return texture;
  }, []);
  useEffect(() => () => roughness.dispose(), [roughness]);
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, ROOM.floor, CENTER_Z]}>
      <planeGeometry args={[WIDTH, DEPTH]} />
      <MeshReflectorMaterial
        resolution={512}
        blur={[220, 80]}
        mixBlur={0.8}
        mixStrength={7}
        mixContrast={1.1}
        roughness={0.35}
        roughnessMap={roughness}
        metalness={0.5}
        depthScale={0.8}
        minDepthThreshold={0.3}
        maxDepthThreshold={1.2}
        color={palette.tile}
        mirror={0.75}
      />
    </mesh>
  );
}

/** Metal grating strips along both sides of the aisle. */
function Gratings() {
  const slats = useMemo<Point3[]>(
    () =>
      [-2.6, 2.6].flatMap((x) =>
        evenlySpaced(ROOM.back + 1, ROOM.front - 1, 90).map((z): Point3 => [
          x,
          ROOM.floor + 0.012,
          z,
        ]),
      ),
    [],
  );
  return (
    <InstancedBoxes positions={slats} size={[0.5, 0.02, 0.08]}>
      <meshStandardMaterial
        color={palette.darkMetal}
        metalness={0.8}
        roughness={0.4}
      />
    </InstancedBoxes>
  );
}

/** A row of glass floor panels lit from below, along the left side. */
function GlassPanels() {
  const texture = useMemo(() => glassFloorTexture(), []);
  useEffect(() => () => texture.dispose(), [texture]);
  const zs = evenlySpaced(-12, 4, 6);
  return (
    <group>
      {zs.map((z) => (
        <group key={z} position={[-4.6, ROOM.floor + 0.006, z]}>
          <mesh rotation-x={-Math.PI / 2}>
            <planeGeometry args={[1.5, 1.5]} />
            <meshBasicMaterial
              map={texture}
              color={glow(palette.neon, 1.4)}
              toneMapped={false}
            />
          </mesh>
          <mesh position-y={0.012}>
            <boxGeometry args={[1.6, 0.02, 1.6]} />
            <meshStandardMaterial
              color={palette.neon}
              transparent
              opacity={0.12}
              roughness={0.05}
              metalness={0.2}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** The lab floor: reflective tiles, gratings and glowing glass panels. */
export function Floor() {
  return (
    <group>
      <Tiles />
      <Gratings />
      <GlassPanels />
    </group>
  );
}
