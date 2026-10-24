import { useMemo } from "react";
import { ROOM, evenlySpaced } from "../layout";
import { InstancedBoxes, type Point3 } from "./InstancedBoxes";
import { glow, palette } from "./palette";

const HEIGHT = ROOM.ceiling - ROOM.floor;
const MID_Y = (ROOM.ceiling + ROOM.floor) / 2;
const DEPTH = ROOM.front - ROOM.back;
const CENTER_Z = (ROOM.front + ROOM.back) / 2;
const PILLAR_ZS = evenlySpaced(ROOM.back + 2, 6, 5);

/** Side and back walls with panel seams. */
function Shell() {
  const seams = useMemo<Point3[]>(
    () => [
      ...[ROOM.left + 0.02, ROOM.right - 0.02].flatMap((x) =>
        evenlySpaced(ROOM.back, ROOM.front, 24).map((z): Point3 => [
          x,
          MID_Y,
          z,
        ]),
      ),
    ],
    [],
  );
  return (
    <group>
      {[ROOM.left, ROOM.right].map((x) => (
        <mesh
          key={x}
          position={[x, MID_Y, CENTER_Z]}
          rotation-y={x < 0 ? Math.PI / 2 : -Math.PI / 2}
        >
          <planeGeometry args={[DEPTH, HEIGHT]} />
          <meshStandardMaterial
            color={palette.metal}
            metalness={0.4}
            roughness={0.7}
          />
        </mesh>
      ))}
      <mesh position={[0, MID_Y, ROOM.back]}>
        <planeGeometry args={[ROOM.right - ROOM.left, HEIGHT]} />
        <meshStandardMaterial
          color={palette.metal}
          metalness={0.4}
          roughness={0.7}
        />
      </mesh>
      <InstancedBoxes positions={seams} size={[0.03, HEIGHT, 0.03]}>
        <meshStandardMaterial
          color={palette.darkMetal}
          metalness={0.6}
          roughness={0.5}
        />
      </InstancedBoxes>
    </group>
  );
}

/** Pillars along both walls with vertical neon strips. */
function Pillars() {
  const pillars = useMemo<Point3[]>(
    () =>
      [ROOM.left + 0.35, ROOM.right - 0.35].flatMap((x) =>
        PILLAR_ZS.map((z): Point3 => [x, MID_Y, z]),
      ),
    [],
  );
  const strips = useMemo<Point3[]>(
    () =>
      pillars.map(([x, y, z]): Point3 => [x + (x < 0 ? 0.36 : -0.36), y, z]),
    [pillars],
  );
  return (
    <group>
      <InstancedBoxes positions={pillars} size={[0.7, HEIGHT, 0.7]}>
        <meshStandardMaterial
          color={palette.metal}
          metalness={0.7}
          roughness={0.35}
        />
      </InstancedBoxes>
      <InstancedBoxes positions={strips} size={[0.02, HEIGHT - 0.6, 0.06]}>
        <meshBasicMaterial color={glow(palette.neon, 2.2)} toneMapped={false} />
      </InstancedBoxes>
    </group>
  );
}

/** Wall vents with slats between the pillars. */
function Vents() {
  const slats = useMemo<Point3[]>(
    () =>
      [ROOM.left + 0.06, ROOM.right - 0.06].flatMap((x) =>
        PILLAR_ZS.slice(0, -1).flatMap((z) =>
          evenlySpaced(ROOM.ceiling - 1.4, ROOM.ceiling - 0.8, 7).map(
            (y): Point3 => [x, y, z + 1.6],
          ),
        ),
      ),
    [],
  );
  return (
    <InstancedBoxes positions={slats} size={[0.06, 0.04, 1.4]}>
      <meshStandardMaterial
        color={palette.darkMetal}
        metalness={0.7}
        roughness={0.4}
      />
    </InstancedBoxes>
  );
}

/** A red and a pink practical light on the back wall. */
function Practicals() {
  return (
    <group position={[0, ROOM.ceiling - 1, ROOM.back + 0.05]}>
      <mesh position={[-4, 0, 0]}>
        <boxGeometry args={[0.08, 0.5, 0.02]} />
        <meshBasicMaterial color={glow(palette.alert, 3)} toneMapped={false} />
      </mesh>
      <mesh position={[3.5, -0.6, 0]}>
        <boxGeometry args={[1.2, 0.05, 0.02]} />
        <meshBasicMaterial color={glow(palette.pink, 2.5)} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Walls, pillars, vents and small accent lights. */
export function Walls() {
  return (
    <group>
      <Shell />
      <Pillars />
      <Vents />
      <Practicals />
    </group>
  );
}
