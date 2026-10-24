import { useMemo } from "react";
import { ROOM, evenlySpaced } from "../layout";
import { InstancedBoxes, type Point3 } from "./InstancedBoxes";
import { palette } from "./palette";

const TRAY_Y = ROOM.ceiling - 0.25;
const LENGTH = ROOM.front - ROOM.back;
const CENTER_Z = (ROOM.front + ROOM.back) / 2;
const PIPES: { x: number; y: number; radius: number }[] = [
  { x: 5.6, y: ROOM.ceiling - 0.3, radius: 0.12 },
  { x: 5.95, y: ROOM.ceiling - 0.35, radius: 0.08 },
  { x: -5.8, y: ROOM.ceiling - 0.3, radius: 0.1 },
];

/** Cable trays with hangers and pipes running along the ceiling. */
export function Overhead() {
  const hangers = useMemo<Point3[]>(
    () =>
      [-5.2, 5.2].flatMap((x) =>
        evenlySpaced(ROOM.back + 1, ROOM.front - 1, 12).map((z): Point3 => [
          x,
          TRAY_Y + 0.12,
          z,
        ]),
      ),
    [],
  );
  return (
    <group>
      {[-5.2, 5.2].map((x) => (
        <group key={x} position={[x, TRAY_Y, CENTER_Z]}>
          <mesh>
            <boxGeometry args={[0.6, 0.03, LENGTH]} />
            <meshStandardMaterial
              color={palette.metal}
              metalness={0.8}
              roughness={0.35}
            />
          </mesh>
          {[-0.3, 0.3].map((side) => (
            <mesh key={side} position={[side, 0.06, 0]}>
              <boxGeometry args={[0.02, 0.12, LENGTH]} />
              <meshStandardMaterial
                color={palette.metal}
                metalness={0.8}
                roughness={0.35}
              />
            </mesh>
          ))}
          <mesh position-y={0.05}>
            <boxGeometry args={[0.5, 0.07, LENGTH]} />
            <meshStandardMaterial color={palette.darkMetal} roughness={0.7} />
          </mesh>
        </group>
      ))}
      <InstancedBoxes positions={hangers} size={[0.03, 0.25, 0.03]}>
        <meshStandardMaterial
          color={palette.darkMetal}
          metalness={0.6}
          roughness={0.5}
        />
      </InstancedBoxes>
      {PIPES.map((pipe) => (
        <mesh
          key={pipe.x}
          position={[pipe.x, pipe.y, CENTER_Z]}
          rotation-x={Math.PI / 2}
        >
          <cylinderGeometry args={[pipe.radius, pipe.radius, LENGTH, 16]} />
          <meshStandardMaterial
            color={palette.metal}
            metalness={0.85}
            roughness={0.25}
          />
        </mesh>
      ))}
    </group>
  );
}
