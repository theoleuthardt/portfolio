import { Clone, useGLTF } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import { Color } from "three";
import { InstancedBoxes, type Point3 } from "../environment/InstancedBoxes";
import { evenlySpaced, ROOM } from "../layout";
import { RACK } from "../rack/geometry";
import { CatmullRomCurve3, Vector3 } from "three";
import { DESK_TOP, MODEL_PROPS, type PropModel } from "./placement";
import {
  crtScreenTexture,
  hazardStripesTexture,
  hudScreenTexture,
  neonSignTexture,
  signTexture,
} from "./propTextures";

const MODELS = [...new Set(MODEL_PROPS.map((prop) => prop.model))];
const urlOf = (model: PropModel) =>
  `${import.meta.env.BASE_URL}models/${model}.glb`;

function Model({ model, position, rotationY }: (typeof MODEL_PROPS)[number]) {
  const { scene } = useGLTF(urlOf(model), false, true);
  return <Clone object={scene} position={position} rotation-y={rotationY} />;
}

/** Two old CRT monitors with green screens on the workbench. */
function DeskMonitors() {
  const screens = useMemo(() => [crtScreenTexture(1), crtScreenTexture(2)], []);
  useEffect(
    () => () => screens.forEach((screen) => screen.dispose()),
    [screens],
  );
  return [
    { z: -8.85, rot: Math.PI / 2 + 0.2 },
    { z: -8.15, rot: Math.PI / 2 - 0.15 },
  ].map(({ z, rot }, index) => (
    <group key={z} position={[-5.45, DESK_TOP, z]} rotation-y={rot}>
      <mesh position-y={0.19}>
        <boxGeometry args={[0.42, 0.36, 0.4]} />
        <meshStandardMaterial color="#2a2d27" roughness={0.7} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.2, 0.201]}>
        <planeGeometry args={[0.33, 0.25]} />
        <meshBasicMaterial
          map={screens[index]}
          color={new Color(1, 1, 1).multiplyScalar(1.6)}
          toneMapped={false}
        />
      </mesh>
    </group>
  ));
}

/** A row of dark racks in the haze at the back of the lab. */
const BACK_RACK_XS = evenlySpaced(-3.2, 3.2, 5);

function BackgroundRacks() {
  const xs = BACK_RACK_XS;
  const leds = useMemo<Point3[]>(
    () =>
      xs.flatMap((x, rack) =>
        evenlySpaced(ROOM.floor + 0.3, ROOM.floor + 1.9, 14)
          .filter((_, row) => (row * 7 + rack * 3) % 5 !== 0)
          .map((y, row): Point3 => [x + 0.3 + (row % 3) * 0.05, y, -14.48]),
      ),
    [xs],
  );
  return (
    <group>
      {xs.map((x) => (
        <mesh key={x} position={[x, ROOM.floor + 1.1, -15]}>
          <boxGeometry args={[1, 2.2, 1]} />
          <meshStandardMaterial
            color="#0b100e"
            metalness={0.8}
            roughness={0.4}
          />
        </mesh>
      ))}
      <InstancedBoxes positions={leds} size={[0.02, 0.012, 0.01]}>
        <meshBasicMaterial
          color={new Color("#33ff66").multiplyScalar(3)}
          toneMapped={false}
        />
      </InstancedBoxes>
    </group>
  );
}

/** The neon sign on the back wall. */
function NeonSign() {
  const texture = useMemo(
    () => neonSignTexture("THEOCLOUD", "// LAB 01 · NIGHT SHIFT"),
    [],
  );
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh position={[0, 1.55, ROOM.back + 0.06]}>
      <planeGeometry args={[4.4, 1.1]} />
      <meshBasicMaterial
        map={texture}
        transparent
        color={new Color(1, 1, 1).multiplyScalar(2.2)}
        toneMapped={false}
        depthWrite={false}
      />
    </mesh>
  );
}

const STRIP_HALF = RACK.width / 2 + 0.35;
const STRIP_DEPTH = RACK.depth / 2 + 0.55;
const STRIPS: { position: Point3; length: number; rot: number }[] = [
  { position: [0, 0, STRIP_DEPTH], length: STRIP_HALF * 2, rot: 0 },
  { position: [0, 0, -STRIP_DEPTH], length: STRIP_HALF * 2, rot: 0 },
  { position: [STRIP_HALF, 0, 0], length: STRIP_DEPTH * 2, rot: Math.PI / 2 },
  { position: [-STRIP_HALF, 0, 0], length: STRIP_DEPTH * 2, rot: Math.PI / 2 },
];

/** Hazard stripes on the floor around the rack's footprint. */
function HazardStripes() {
  const textures = useMemo(() => {
    const base = hazardStripesTexture();
    const tiled = STRIPS.map(({ length }) => {
      const copy = base.clone();
      copy.repeat.set(length / 0.4, 1);
      copy.needsUpdate = true;
      return copy;
    });
    base.dispose();
    return tiled;
  }, []);
  useEffect(
    () => () => textures.forEach((texture) => texture.dispose()),
    [textures],
  );
  return (
    <group
      position={[RACK.x, ROOM.floor + 0.004, RACK.z]}
      rotation-y={RACK.rotationY}
    >
      {STRIPS.map(({ position, length, rot }, index) => (
        <mesh
          key={position.join()}
          position={position}
          rotation={[-Math.PI / 2, 0, rot]}
        >
          <planeGeometry args={[length, 0.12]} />
          <meshStandardMaterial map={textures[index]} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

/** Cable spools near the back racks. */
function CableSpools() {
  return [
    [-2.4, -12.4],
    [-1.75, -12.9],
  ].map(([x, z]) => (
    <group key={x} position={[x, ROOM.floor + 0.3, z]} rotation-z={Math.PI / 2}>
      <mesh>
        <cylinderGeometry args={[0.3, 0.3, 0.06, 32]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.8} />
      </mesh>
      <mesh position-y={0.3}>
        <cylinderGeometry args={[0.3, 0.3, 0.06, 32]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.8} />
      </mesh>
      <mesh position-y={0.15}>
        <cylinderGeometry args={[0.2, 0.2, 0.26, 32]} />
        <meshStandardMaterial color="#111613" roughness={0.5} metalness={0.2} />
      </mesh>
    </group>
  ));
}

/** Rows of racks along both side walls at the back of the lab. */
function SideRackRows() {
  const racks = useMemo(
    () =>
      [-5.6, 5.6].flatMap((x) =>
        evenlySpaced(-11.6, -16.4, 4).map((z) => ({ x, z })),
      ),
    [],
  );
  const leds = useMemo<Point3[]>(
    () =>
      racks.flatMap(({ x, z }, rack) =>
        evenlySpaced(ROOM.floor + 0.3, ROOM.floor + 1.9, 12)
          .filter((_, row) => (row * 5 + rack * 7) % 4 !== 0)
          .map((y, row): Point3 => [
            x + (x < 0 ? 0.51 : -0.51),
            y,
            z - 0.3 + (row % 3) * 0.05,
          ]),
      ),
    [racks],
  );
  return (
    <group>
      {racks.map(({ x, z }) => (
        <mesh key={`${x},${z}`} position={[x, ROOM.floor + 1.1, z]}>
          <boxGeometry args={[1, 2.2, 1.1]} />
          <meshStandardMaterial
            color="#0c1210"
            metalness={0.8}
            roughness={0.4}
          />
        </mesh>
      ))}
      <InstancedBoxes positions={leds} size={[0.01, 0.012, 0.02]}>
        <meshBasicMaterial
          color={new Color("#33ff66").multiplyScalar(3)}
          toneMapped={false}
        />
      </InstancedBoxes>
    </group>
  );
}

const SCREENS: { title: string; position: Point3; rotationY: number }[] = [
  {
    title: "RACK-01 // LOAD",
    position: [-6.93, 1.2, -5.6],
    rotationY: Math.PI / 2,
  },
  {
    title: "UPLINK // TRAFFIC",
    position: [-6.93, 1.5, -8.6],
    rotationY: Math.PI / 2,
  },
  {
    title: "COOLING // LOOP B",
    position: [6.93, 1.3, -13.2],
    rotationY: -Math.PI / 2,
  },
];

/** Wall monitors with HUD graphics. */
function WallScreens() {
  const textures = useMemo(
    () =>
      SCREENS.map((screen, index) => hudScreenTexture(screen.title, index + 1)),
    [],
  );
  useEffect(
    () => () => textures.forEach((texture) => texture.dispose()),
    [textures],
  );
  return SCREENS.map(({ title, position, rotationY }, index) => (
    <group key={title} position={position} rotation-y={rotationY}>
      <mesh position-z={-0.03}>
        <boxGeometry args={[1.32, 0.78, 0.05]} />
        <meshStandardMaterial color="#121614" metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh>
        <planeGeometry args={[1.2, 0.675]} />
        <meshBasicMaterial
          map={textures[index]}
          color={new Color(1, 1, 1).multiplyScalar(1.5)}
          toneMapped={false}
        />
      </mesh>
    </group>
  ));
}

/** Cable bundles on the floor from the back racks to the main rack. */
function FloorCables() {
  const paths = useMemo(
    () =>
      [0, 1, 2].map(
        (i) =>
          new CatmullRomCurve3([
            new Vector3(1.6 + i * 0.08, ROOM.floor + 0.03, -14.4),
            new Vector3(2.9 + i * 0.08, ROOM.floor + 0.03, -9),
            new Vector3(3.05 + i * 0.08, ROOM.floor + 0.03, -3),
            new Vector3(
              RACK.x + 0.4 + i * 0.06,
              ROOM.floor + 0.03,
              RACK.z - 0.9,
            ),
          ]),
      ),
    [],
  );
  return paths.map((path, i) => (
    <mesh key={i}>
      <tubeGeometry args={[path, 80, 0.03, 8, false]} />
      <meshStandardMaterial
        color={i === 1 ? "#13261d" : "#070a09"}
        roughness={0.55}
      />
    </mesh>
  ));
}

const SIGNS: {
  text: string;
  plate: string;
  ink: string;
  glow: number;
  position: Point3;
  rotationY: number;
  width: number;
}[] = [
  {
    text: "AUTHORIZED PERSONNEL ONLY",
    plate: "#ffb000",
    ink: "#0a0a08",
    glow: 0.9,
    position: [6.93, 1.1, 1.4],
    rotationY: -Math.PI / 2,
    width: 1.6,
  },
  {
    text: "→ RACK-01",
    plate: "#140208",
    ink: "#ff3d8b",
    glow: 2.2,
    position: [-6.93, 1.9, 0.5],
    rotationY: Math.PI / 2,
    width: 1.2,
  },
];

/** Wall signs: a hazard plate near the rack and a neon arrow. */
function Signs() {
  const textures = useMemo(
    () => SIGNS.map((sign) => signTexture(sign.text, sign.plate, sign.ink)),
    [],
  );
  useEffect(
    () => () => textures.forEach((texture) => texture.dispose()),
    [textures],
  );
  return SIGNS.map(({ text, glow, position, rotationY, width }, index) => (
    <mesh key={text} position={position} rotation-y={rotationY}>
      <planeGeometry args={[width, width * 0.1875]} />
      <meshBasicMaterial
        map={textures[index]}
        color={new Color(1, 1, 1).multiplyScalar(glow)}
        toneMapped={false}
      />
    </mesh>
  ));
}

/** Warm light under the hanging lamps. */
function LampLights() {
  return MODEL_PROPS.filter(
    (prop) => prop.model === "hanging_industrial_lamp",
  ).map(({ position: [x, y, z] }) => (
    <pointLight
      key={`${x},${z}`}
      position={[x, y - 1.45, z]}
      intensity={6}
      distance={4}
      color="#ffd9a0"
    />
  ));
}

/**
 * Everything in the lab that is not room or rack: models, monitors, sign,
 * stripes. Its own lazy chunk, loaded after the lab is visible.
 */
export default function Props() {
  return (
    <group>
      {MODEL_PROPS.map((prop, index) => (
        <Model key={index} {...prop} />
      ))}
      <DeskMonitors />
      <BackgroundRacks />
      <NeonSign />
      <HazardStripes />
      <CableSpools />
      <SideRackRows />
      <WallScreens />
      <FloorCables />
      <Signs />
      <LampLights />
    </group>
  );
}

MODELS.forEach((model) => useGLTF.preload(urlOf(model), false, true));
