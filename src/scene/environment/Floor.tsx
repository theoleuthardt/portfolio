import { MeshReflectorMaterial } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import { ROOM, evenlySpaced } from "../layout";
import { glassFloorTexture } from "./textures";
import { usePbr } from "./usePbr";
import { InstancedBoxes, type Point3 } from "./InstancedBoxes";
import { glow, palette } from "./palette";

const TILE = 2.4;
const WIDTH = ROOM.right - ROOM.left;
const DEPTH = ROOM.front - ROOM.back;
const CENTER_Z = (ROOM.front + ROOM.back) / 2;

/** Polished dark stone tiles with real reflections. */
function Tiles() {
  const maps = usePbr("floor", WIDTH / TILE, DEPTH / TILE);
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, ROOM.floor, CENTER_Z]}>
      <planeGeometry args={[WIDTH, DEPTH]} />
      <MeshReflectorMaterial
        {...maps}
        resolution={1024}
        blur={[260, 90]}
        mixBlur={0.9}
        mixStrength={11}
        mixContrast={1.15}
        roughness={0.9}
        metalness={0.15}
        normalScale={[0.6, 0.6]}
        depthScale={0.8}
        minDepthThreshold={0.3}
        maxDepthThreshold={1.2}
        color="#26302d"
        mirror={0.8}
      />
    </mesh>
  );
}

/** Metal grating strips along both sides of the aisle. */
function Gratings() {
  const grating = usePbr("grating", 1, 0.2);
  const length = ROOM.front - ROOM.back - 2;
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
    <group>
      {[-2.6, 2.6].map((x) => (
        <mesh key={x} position={[x, ROOM.floor + 0.004, CENTER_Z]}>
          <boxGeometry args={[0.62, 0.008, length]} />
          <meshStandardMaterial
            color="#030605"
            metalness={0.6}
            roughness={0.8}
          />
        </mesh>
      ))}
      {[-2.92, -2.28, 2.28, 2.92].map((x) => (
        <mesh key={x} position={[x, ROOM.floor + 0.014, CENTER_Z]}>
          <boxGeometry args={[0.04, 0.028, length]} />
          <meshStandardMaterial
            {...grating}
            color="#7d8a85"
            metalness={1}
            roughness={1}
          />
        </mesh>
      ))}
      <InstancedBoxes positions={slats} size={[0.5, 0.02, 0.08]}>
        <meshStandardMaterial
          {...grating}
          color="#7d8a85"
          metalness={1}
          roughness={1}
        />
      </InstancedBoxes>
    </group>
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
