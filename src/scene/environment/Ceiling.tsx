import { useMemo } from "react";
import { CatmullRomCurve3, Vector3 } from "three";
import { ROOM, centeredGrid, evenlySpaced } from "../layout";
import { InstancedBoxes, type Point3 } from "./InstancedBoxes";
import { glow, palette } from "./palette";

const SOFFIT_Y = ROOM.ceiling - 0.45;
const SOFFIT = { halfWidth: 4.2, front: 5, back: -14, radius: 1.6 };

/** Closed rounded rectangle on the ceiling, the outline of the soffit. */
function soffitPath(): CatmullRomCurve3 {
  const { halfWidth, front, back, radius } = SOFFIT;
  const corner = (cx: number, cz: number, start: number) =>
    evenlySpaced(start, start + Math.PI / 2, 6).map(
      (angle) =>
        new Vector3(
          cx + Math.cos(angle) * radius,
          SOFFIT_Y,
          cz + Math.sin(angle) * radius,
        ),
    );
  const points = [
    ...corner(halfWidth - radius, front - radius, 0),
    ...corner(-halfWidth + radius, front - radius, Math.PI / 2),
    ...corner(-halfWidth + radius, back + radius, Math.PI),
    ...corner(halfWidth - radius, back + radius, (3 * Math.PI) / 2),
  ];
  return new CatmullRomCurve3(points, true, "centripetal");
}

/** The curved soffit with its neon contour, like the bars of Night City. */
function Soffit() {
  const path = useMemo(() => soffitPath(), []);
  return (
    <group>
      <mesh>
        <tubeGeometry args={[path, 160, 0.32, 10, true]} />
        <meshStandardMaterial
          color={palette.metal}
          metalness={0.7}
          roughness={0.35}
        />
      </mesh>
      <mesh position-y={-0.345}>
        <tubeGeometry args={[path, 200, 0.025, 6, true]} />
        <meshBasicMaterial color={glow(palette.neon, 3)} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Bright light panels behind grilles inside the soffit. */
function LightPanels() {
  const panels = useMemo<Point3[]>(
    () =>
      centeredGrid(3, 7, 2, 2.4, [0, -4.5]).map(([x, z]): Point3 => [
        x,
        ROOM.ceiling - 0.05,
        z,
      ]),
    [],
  );
  const grille = useMemo<Point3[]>(
    () =>
      panels.flatMap(([x, y, z]) =>
        evenlySpaced(x - 0.75, x + 0.75, 8).map((gx): Point3 => [
          gx,
          y - 0.04,
          z,
        ]),
      ),
    [panels],
  );
  return (
    <group>
      <InstancedBoxes positions={panels} size={[1.6, 0.02, 1.9]}>
        <meshBasicMaterial
          color={glow(palette.ceiling.clone().lerp(palette.neon, 0.35), 0.95)}
          toneMapped={false}
        />
      </InstancedBoxes>
      <InstancedBoxes positions={grille} size={[0.04, 0.05, 1.9]}>
        <meshStandardMaterial
          color={palette.darkMetal}
          metalness={0.6}
          roughness={0.5}
        />
      </InstancedBoxes>
    </group>
  );
}

/** Ceiling slab, soffit and light panels. */
export function Ceiling() {
  return (
    <group>
      <mesh
        rotation-x={Math.PI / 2}
        position={[0, ROOM.ceiling, (ROOM.front + ROOM.back) / 2]}
      >
        <planeGeometry
          args={[ROOM.right - ROOM.left, ROOM.front - ROOM.back]}
        />
        <meshStandardMaterial
          color={palette.darkMetal}
          metalness={0.3}
          roughness={0.8}
        />
      </mesh>
      <Soffit />
      <LightPanels />
    </group>
  );
}
