import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  CatmullRomCurve3,
  MeshBasicMaterial,
  PointLight,
  Vector3,
} from "three";
import { rackSlots } from "../../content/rack";
import type { Vector3 as Point } from "../cameraRig";
import { InstancedBoxes, type Point3 } from "../environment/InstancedBoxes";
import { evenlySpaced, ROOM } from "../layout";
import { BACK_RACK_TOP, BACK_RACK_XS, BACK_RACK_Z } from "../props/placement";
import { RACK, RACK_HEIGHT, slotCenterY } from "../rack/geometry";
import { Block } from "./parts";
import { LAB } from "./placement";
import { catenary, flickerLevel } from "./procedural";

const TRAY_Y = ROOM.ceiling - 0.45;
const TRAY_X = RACK.x - 0.1;
const TRAY_FROM = RACK.z - 0.2;
const TRAY_WIDTH = 0.42;
const BRANCH_X = ROOM.right - 0.45;
const SWITCH_TOP = LAB.switchWall.position[1] + 0.63;
const CABLE = "#070a09";
const NEON = "#4dff88";
const UP = new Vector3(0, 1, 0);

/** The cable trays: rack-01 to the back racks, and a branch to the switches. */
const TRAYS: { axis: "x" | "z"; at: number; from: number; to: number }[] = [
  { axis: "z", at: TRAY_X, from: TRAY_FROM + 0.25, to: BACK_RACK_Z - 0.2 },
  { axis: "x", at: BACK_RACK_Z, from: -3.75, to: 3.75 },
  { axis: "x", at: TRAY_FROM, from: TRAY_X + 0.2, to: BRANCH_X + 0.2 },
  { axis: "z", at: BRANCH_X, from: TRAY_FROM - 0.2, to: 3.9 },
];

/** A point given in the rack's own frame, in scene space. */
function fromRack([x, y, z]: Point): Vector3 {
  return new Vector3(x, y, z)
    .applyAxisAngle(UP, RACK.rotationY)
    .add(new Vector3(RACK.x, 0, RACK.z));
}

const curve = (points: Point[]) =>
  new CatmullRomCurve3(
    points.map((point) => new Vector3(...point)),
    false,
    "centripetal",
  );

/** A small, repeatable offset in -0.5…0.5 so no two cables run alike. */
function jitter(cable: number, step: number): number {
  const value = Math.sin(cable * 12.9898 + step * 78.233) * 43758.5453;
  return value - Math.floor(value) - 0.5;
}

/** A point on a tray: `value` along its axis, `across` to its side. */
function trayPoint(
  { axis, at }: (typeof TRAYS)[number],
  value: number,
  across: number,
): Point {
  return axis === "z"
    ? [at + across, TRAY_Y, value]
    : [value, TRAY_Y, at + across];
}

/** One straight ladder tray along `axis`, hung from the ceiling on rods. */
function Tray(tray: (typeof TRAYS)[number]) {
  const { axis, from, to } = tray;
  const length = Math.abs(to - from);
  const middle = (from + to) / 2;
  const rungs = useMemo<Point3[]>(
    () =>
      evenlySpaced(from, to, Math.max(2, Math.round(length / 0.3))).map(
        (value) => {
          const [x, , z] = trayPoint(tray, value, 0);
          return [x, TRAY_Y - 0.03, z];
        },
      ),
    [tray, from, to, length],
  );
  const rods = evenlySpaced(from, to, Math.max(2, Math.round(length / 2.2)));
  return (
    <group>
      {[-1, 1].map((side) => (
        <Block
          key={side}
          size={axis === "z" ? [0.03, 0.08, length] : [length, 0.08, 0.03]}
          position={trayPoint(tray, middle, (side * TRAY_WIDTH) / 2)}
          color="#3a403d"
          metalness={0.85}
          roughness={0.35}
        />
      ))}
      <InstancedBoxes
        positions={rungs}
        size={
          axis === "z" ? [TRAY_WIDTH, 0.015, 0.03] : [0.03, 0.015, TRAY_WIDTH]
        }
      >
        <meshStandardMaterial
          color="#3a403d"
          metalness={0.85}
          roughness={0.35}
        />
      </InstancedBoxes>
      {rods.flatMap((value) =>
        [-1, 1].map((side) => {
          const [x, , z] = trayPoint(tray, value, (side * TRAY_WIDTH) / 2);
          return (
            <Block
              key={`${value}${side}`}
              size={[0.012, ROOM.ceiling - TRAY_Y, 0.012]}
              position={[x, (ROOM.ceiling + TRAY_Y) / 2, z]}
              color="#5d6460"
              metalness={0.9}
              roughness={0.3}
            />
          );
        }),
      )}
    </group>
  );
}

/** Rack-01's uplinks: up into the tray, along it and down into a back rack. */
function backRoute(cable: number): Point[] {
  const start = fromRack([
    -0.34 + cable * 0.08,
    RACK.floorY + RACK_HEIGHT,
    -RACK.depth / 2 + 0.14,
  ]);
  const x = TRAY_X + jitter(cable, 1) * 0.22;
  const lift = TRAY_Y + 0.03 + Math.abs(jitter(cable, 2)) * 0.05;
  const rack = BACK_RACK_XS[cable];
  const crossZ = BACK_RACK_Z + jitter(cable, 3) * 0.2;
  return [
    [start.x, start.y, start.z],
    [start.x, start.y + 0.3, start.z - 0.05],
    [x, lift, TRAY_FROM - 0.2],
    [x + jitter(cable, 4) * 0.08, lift + 0.01, -4],
    [x, lift, -10],
    [x, lift, BACK_RACK_Z + 0.35],
    [x + Math.sign(rack - x) * 0.25, lift, crossZ],
    [rack + jitter(cable, 5) * 0.2, lift, crossZ],
    [rack + 0.1, TRAY_Y - 0.6, BACK_RACK_Z - 0.05],
    [rack + 0.15, BACK_RACK_TOP + 0.02, BACK_RACK_Z - 0.25],
  ];
}

/** Rack-01's links to the switch wall: along the branch tray and down. */
function switchRoute(cable: number): Point[] {
  const start = fromRack([
    0.12 + cable * 0.09,
    RACK.floorY + RACK_HEIGHT,
    -RACK.depth / 2 + 0.14,
  ]);
  const z = TRAY_FROM + jitter(cable, 6) * 0.22;
  const lift = TRAY_Y + 0.03 + Math.abs(jitter(cable, 7)) * 0.05;
  const x = BRANCH_X + jitter(cable, 8) * 0.22;
  const port = LAB.switchWall.position[2] - 0.35 + cable * 0.3;
  return [
    [start.x, start.y, start.z],
    [start.x, start.y + 0.28, start.z],
    [TRAY_X + 0.3, lift, z],
    [4.4, lift + 0.01, z + jitter(cable, 9) * 0.08],
    [x - 0.25, lift, z],
    [x, lift, TRAY_FROM + 0.3],
    [x, lift, port - 0.2],
    [x + 0.2, TRAY_Y - 0.5, port],
    [ROOM.right - 0.09, SWITCH_TOP + 0.05, port + 0.05],
  ];
}

/**
 * The cabling from the top of rack-01: uplinks through the trays into the
 * back racks and down into the switch wall, zip-tied where they bundle, a
 * service loop near the rack, loose cables sagging between the hangers and
 * one hanging down with a free end. Slightly messy, as in any real lab.
 */
function RackCabling() {
  const cables = useMemo(
    () => [
      ...BACK_RACK_XS.map((_, cable) => curve(backRoute(cable))),
      ...[0, 1, 2].map((cable) => curve(switchRoute(cable))),
    ],
    [],
  );
  const loose = useMemo(
    () => [
      curve(
        catenary(
          [TRAY_X + 0.2, TRAY_Y, -2.4],
          [TRAY_X + 0.2, TRAY_Y, -4.6],
          0.55,
          16,
        ),
      ),
      curve(
        catenary(
          [TRAY_X - 0.2, TRAY_Y, -7.2],
          [TRAY_X - 0.2, TRAY_Y, -8.8],
          0.35,
          16,
        ),
      ),
      curve(
        catenary(
          [3.2, TRAY_Y, TRAY_FROM + 0.2],
          [5, TRAY_Y, TRAY_FROM + 0.2],
          0.3,
          16,
        ),
      ),
      curve([
        [TRAY_X + 0.2, TRAY_Y, -11.2],
        [TRAY_X + 0.32, TRAY_Y - 0.4, -11.3],
        [TRAY_X + 0.3, TRAY_Y - 1.1, -11.25],
        [TRAY_X + 0.36, TRAY_Y - 1.5, -11.1],
      ]),
    ],
    [],
  );
  const ties: { position: Point; vertical: boolean }[] = [
    ...[-1, -5, -9, -13].map((z): { position: Point; vertical: boolean } => ({
      position: [TRAY_X, TRAY_Y + 0.05, z],
      vertical: false,
    })),
    { position: [3.6, TRAY_Y + 0.05, TRAY_FROM], vertical: false },
  ];
  return (
    <group>
      {cables.map((path, index) => (
        <mesh key={index}>
          <tubeGeometry args={[path, 96, 0.02, 7, false]} />
          {index === 2 ? (
            <meshBasicMaterial color={NEON} toneMapped={false} />
          ) : (
            <meshStandardMaterial
              color={index === 6 ? "#1d3b5c" : CABLE}
              roughness={0.6}
              metalness={0.2}
            />
          )}
        </mesh>
      ))}
      {ties.map(({ position, vertical }, index) => (
        <mesh
          key={index}
          position={position}
          rotation-y={position[2] === TRAY_FROM ? Math.PI / 2 : 0}
          rotation-x={vertical ? Math.PI / 2 : 0}
        >
          <torusGeometry args={[0.13, 0.008, 6, 24]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
        </mesh>
      ))}
      {[0, 0.05, 0.1].map((offset) => (
        <mesh
          key={offset}
          position={[TRAY_X - 0.12 + offset, TRAY_Y - 0.28, -0.6 - offset]}
          rotation-y={Math.PI / 2 + offset}
        >
          <torusGeometry args={[0.2, 0.016, 6, 28]} />
          <meshStandardMaterial color={CABLE} roughness={0.6} />
        </mesh>
      ))}
      {loose.map((path, index) => (
        <mesh key={index}>
          <tubeGeometry args={[path, 32, 0.016, 6, false]} />
          <meshStandardMaterial
            color={index === 1 ? "#ffb000" : CABLE}
            roughness={0.6}
          />
        </mesh>
      ))}
    </group>
  );
}

/** Patch cables looping down the front edge of the rack between modules. */
function PatchCables() {
  const slots = rackSlots();
  const front = RACK.depth / 2 + 0.07;
  const loops = useMemo(
    () =>
      [
        [1, 3, 0.47, "#ffb000"],
        [2, 5, 0.5, "#4dff88"],
        [4, 7, 0.47, "#33ff66"],
        [0, 2, -0.47, "#9aa39d"],
      ].map(([from, to, x, color]) => {
        const top = slotCenterY(slots[from as number]);
        const bottom = slotCenterY(slots[to as number]);
        const side = x as number;
        return {
          color: color as string,
          path: curve([
            [side, top, front],
            [side + Math.sign(side) * 0.07, top - 0.05, front + 0.05],
            [side + Math.sign(side) * 0.1, (top + bottom) / 2, front + 0.08],
            [side + Math.sign(side) * 0.07, bottom + 0.05, front + 0.05],
            [side, bottom, front],
          ]),
        };
      }),
    [slots, front],
  );
  return (
    <group position={[RACK.x, 0, RACK.z]} rotation-y={RACK.rotationY}>
      {loops.map(({ path, color }, index) => (
        <mesh key={index} raycast={() => null}>
          <tubeGeometry args={[path, 24, 0.007, 5, false]} />
          <meshStandardMaterial color={color} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

/** An air duct along the ceiling, held by brackets. */
function Duct() {
  const [x, y] = LAB.duct.position;
  const length = 22;
  return (
    <group position={[x, y, LAB.duct.position[2]]}>
      <mesh rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.28, 0.28, length, 24, 1, true]} />
        <meshStandardMaterial
          color="#8f9692"
          metalness={0.85}
          roughness={0.35}
        />
      </mesh>
      {Array.from({ length: 9 }, (_, bracket) => (
        <mesh key={bracket} position-z={-length / 2 + 1.2 + bracket * 2.5}>
          <torusGeometry args={[0.29, 0.02, 6, 28]} />
          <meshStandardMaterial
            color="#4a504c"
            metalness={0.8}
            roughness={0.4}
          />
        </mesh>
      ))}
      {[-6, -1, 4].map((z) => (
        <Block
          key={z}
          size={[0.3, 0.05, 0.4]}
          position={[0, -0.28, z]}
          color="#1a1d1c"
        />
      ))}
    </group>
  );
}

/** A fluorescent tube that is about to die. */
function FlickerTube() {
  const tube = useRef<MeshBasicMaterial>(null);
  const light = useRef<PointLight>(null);
  useFrame(({ clock }) => {
    const level = flickerLevel(clock.elapsedTime);
    tube.current?.color.setScalar(2.2 * level);
    if (light.current) {
      light.current.intensity = 5 * level;
    }
  });
  return (
    <group position={LAB.flickerTube.position}>
      <Block
        size={[1.4, 0.06, 0.2]}
        position={[0, 0.06, 0]}
        color="#3a403d"
        metalness={0.7}
        roughness={0.4}
      />
      <mesh rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.025, 0.025, 1.3, 10]} />
        <meshBasicMaterial ref={tube} color="#e6fff4" toneMapped={false} />
      </mesh>
      <pointLight ref={light} position-y={-0.3} distance={4} color="#d8fff0" />
    </group>
  );
}

/** Everything that hangs from the ceiling or on the rack's cables. */
export function Overhead() {
  return (
    <group>
      {TRAYS.map((tray, index) => (
        <Tray key={index} {...tray} />
      ))}
      <RackCabling />
      <PatchCables />
      <Duct />
      <FlickerTube />
    </group>
  );
}
