import { RoundedBox } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  BoxGeometry,
  Color,
  ExtrudeGeometry,
  Group,
  InstancedMesh,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  Shape,
  type CanvasTexture,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { brandPanelTexture, crtScreenTexture } from "../props/propTextures";
import {
  KEYBOARD_UNITS,
  keyboardKeys,
  NUMPAD_UNITS,
  numpadKeys,
  type Key,
} from "./keyboard";
import { screenPlacement, type ScreenRect } from "./placement";
import { wearTexture } from "./wearTexture";

/** Distance of the screen from the camera, in metres. */
const DISTANCE = 1.2;
const SIDE = 0.07;
const PANEL = 0.36;
const TOP = 0.08;
const BELOW = 0.07;
const BEZEL_DEPTH = 0.05;
const BEVEL = 0.012;
const CASE_DEPTH = 0.34;
const TUBE_DEPTH = 0.5;
const HOLE_RADIUS = 0.05;
const DECK_HEIGHT = 0.2;
const DECK_FRONT = 0.62;
const DECK_DROP = 0.14;
const KEY_UNIT = 0.05;
const KEYPAD_GAP = 0.6;
const PLASTIC = "#cdc5ae";
const DARK = "#1d1b17";
const PHOSPHOR = "#33ff66";
const NEON = "#2ef2c0";
const PINK = "#ff3d8b";
const LEG = 1.6;
const KEY_DARK = new Color("#34332f");
const KEY_GREY = new Color("#7a776d");
const KEY_RED = new Color("#a8322a");
const KEY_LIGHT = new Color("#d6cfba");
const KEY_ORANGE = new Color("#d08a2c");

/** The outline of the screen unit around a screen of width 1 at the origin. */
function outline(aspect: number) {
  const left = -0.5 - SIDE;
  const right = 0.5 + PANEL;
  const top = aspect / 2 + TOP;
  const bottom = -aspect / 2 - BELOW;
  return {
    left,
    right,
    top,
    bottom,
    width: right - left,
    height: top - bottom,
    centreX: (left + right) / 2,
    centreY: (top + bottom) / 2,
  };
}

function roundedRect(
  shape: Shape,
  [cx, cy]: [number, number],
  width: number,
  height: number,
  radius: number,
) {
  const x = cx - width / 2;
  const y = cy - height / 2;
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

/** The front of the screen unit, with a rounded hole for the screen. */
function bezelGeometry(aspect: number): ExtrudeGeometry {
  const box = outline(aspect);
  const front = roundedRect(
    new Shape(),
    [box.centreX, box.centreY],
    box.width,
    box.height,
    0.035,
  );
  front.holes.push(
    roundedRect(
      new Shape(),
      [0, 0],
      1 + 2 * BEVEL,
      aspect + 2 * BEVEL,
      HOLE_RADIUS,
    ),
  );
  const geometry = new ExtrudeGeometry(front, {
    depth: BEZEL_DEPTH,
    bevelEnabled: true,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelSegments: 3,
    curveSegments: 8,
  });
  geometry.translate(0, 0, -BEZEL_DEPTH);
  return geometry;
}

/**
 * The keyboard deck below the screen unit: a wedge whose top slopes down
 * towards the visitor, as wide as the screen unit and joined to it.
 */
function deckGeometry(aspect: number): ExtrudeGeometry {
  const box = outline(aspect);
  const back = -BEZEL_DEPTH - CASE_DEPTH;
  const base = box.bottom - DECK_HEIGHT;
  const profile = new Shape();
  profile.moveTo(back, base);
  profile.lineTo(DECK_FRONT, base);
  profile.lineTo(DECK_FRONT, base + 0.05);
  profile.lineTo(0.03, box.bottom - 0.004);
  profile.lineTo(back, box.bottom - 0.004);
  profile.lineTo(back, base);
  const geometry = new ExtrudeGeometry(profile, {
    depth: box.width,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.01,
    bevelSegments: 3,
  });
  geometry.rotateY(-Math.PI / 2);
  geometry.translate(box.right, 0, 0);
  return geometry;
}

/** The tube's back: a box that tapers towards the rear, like a CRT neck. */
function tubeGeometry(): BoxGeometry {
  const geometry = new BoxGeometry(1, 1, 1);
  const position = geometry.getAttribute("position");
  for (let index = 0; index < position.count; index++) {
    if (position.getZ(index) < 0) {
      position.setX(index, position.getX(index) * 0.55);
      position.setY(index, position.getY(index) * 0.6);
    }
  }
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * A ref for an instanced mesh whose `count` instances `place` positions;
 * `place` may also return a colour for the instance.
 */
function useInstances(
  count: number,
  place: (dummy: Object3D, index: number) => Color | undefined,
): RefObject<InstancedMesh | null> {
  const mesh = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const target = mesh.current;
    if (target === null) {
      return;
    }
    const dummy = new Object3D();
    for (let index = 0; index < count; index++) {
      const color = place(dummy, index);
      dummy.updateMatrix();
      target.setMatrixAt(index, dummy.matrix);
      if (color !== undefined) {
        target.setColorAt(index, color);
      }
    }
    target.instanceMatrix.needsUpdate = true;
    if (target.instanceColor) {
      target.instanceColor.needsUpdate = true;
    }
    target.computeBoundingSphere();
  });
  return mesh;
}

interface PartProps {
  aspect: number;
  plastic: MeshStandardMaterial;
  dark: MeshStandardMaterial;
}

/** The screen unit: bezel, case, tapered tube, vents and brand panel. */
function ScreenUnit({
  aspect,
  plastic,
  dark,
  brand,
  screen,
}: PartProps & { brand: CanvasTexture; screen: CanvasTexture }) {
  const bezel = useMemo(() => bezelGeometry(aspect), [aspect]);
  const tube = useMemo(() => tubeGeometry(), []);
  const box = outline(aspect);
  const caseZ = -BEZEL_DEPTH - CASE_DEPTH / 2;
  const panelWidth = PANEL - 0.1;
  const panelX = 0.5 + 0.05 + panelWidth / 2;
  const slots = 12;
  useEffect(() => () => bezel.dispose(), [bezel]);
  useEffect(() => () => tube.dispose(), [tube]);
  const vents = useInstances(slots * 2, (dummy, index) => {
    const slot = index % slots;
    if (index < slots) {
      dummy.position.set(
        box.centreX - 0.33 + slot * 0.06,
        box.top + 0.001,
        caseZ - 0.04,
      );
      dummy.scale.set(0.012, 0.004, CASE_DEPTH * 0.5);
    } else {
      dummy.position.set(
        box.right + 0.001,
        box.centreY + 0.2 - slot * 0.035,
        caseZ - 0.04,
      );
      dummy.scale.set(0.004, 0.01, CASE_DEPTH * 0.5);
    }
    return undefined;
  });
  return (
    <group>
      <mesh geometry={bezel} material={plastic} />
      <mesh position={[0, 0, -0.004]}>
        <planeGeometry args={[1.04, aspect + 0.04]} />
        <meshBasicMaterial map={screen} color="#7a9a80" />
      </mesh>
      <RoundedBox
        args={[box.width, box.height, CASE_DEPTH]}
        radius={0.03}
        smoothness={3}
        position={[box.centreX, box.centreY, caseZ]}
        material={plastic}
      />
      <mesh
        geometry={tube}
        material={plastic}
        position={[
          box.centreX * 0.5,
          box.centreY + 0.02,
          caseZ - CASE_DEPTH / 2 - TUBE_DEPTH / 2 + 0.01,
        ]}
        scale={[box.width * 0.85, box.height * 0.92, TUBE_DEPTH]}
      />
      <instancedMesh
        ref={vents}
        args={[undefined, undefined, slots * 2]}
        material={dark}
      >
        <boxGeometry />
      </instancedMesh>
      <mesh position={[panelX, 0, BEVEL + 0.001]}>
        <planeGeometry args={[panelWidth, aspect - 0.04]} />
        <meshStandardMaterial map={brand} roughness={0.25} metalness={0.2} />
      </mesh>
      <mesh
        position={[
          panelX - panelWidth * 0.32,
          -aspect / 2 + 0.02 + (aspect - 0.04) * 0.06,
          BEVEL + 0.006,
        ]}
      >
        <sphereGeometry args={[0.008, 12, 8]} />
        <meshStandardMaterial
          color={PHOSPHOR}
          emissive={PHOSPHOR}
          emissiveIntensity={3}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function keyColor(key: Key, index: number, numpad: boolean): Color {
  if (numpad) {
    return index === 15 ? KEY_ORANGE : KEY_LIGHT;
  }
  if (index === 0 || index === 27) {
    return KEY_RED;
  }
  return key.width === 1 ? KEY_DARK : KEY_GREY;
}

/** The keyboard deck joined to the screen unit, with keys and a keypad. */
function Deck({ aspect, plastic }: Omit<PartProps, "dark">) {
  const deck = useMemo(() => deckGeometry(aspect), [aspect]);
  const capGeometry = useMemo(
    () => new RoundedBoxGeometry(1, 1, 1, 2, 0.15),
    [],
  );
  const caps = useMemo(
    () => new MeshStandardMaterial({ roughness: 0.55, fog: false }),
    [],
  );
  const box = outline(aspect);
  const main = useMemo(() => keyboardKeys(), []);
  const pad = useMemo(() => numpadKeys(), []);
  const keys = [...main, ...pad];
  const totalUnits = KEYBOARD_UNITS + KEYPAD_GAP + NUMPAD_UNITS;
  const slope = Math.atan2(DECK_DROP, DECK_FRONT - 0.03);
  useEffect(() => () => deck.dispose(), [deck]);
  useEffect(() => () => capGeometry.dispose(), [capGeometry]);
  useEffect(() => () => caps.dispose(), [caps]);
  const mesh = useInstances(keys.length, (dummy, index) => {
    const numpad = index >= main.length;
    const key = keys[index];
    const offset = numpad ? KEYBOARD_UNITS + KEYPAD_GAP : 0;
    dummy.position.set(
      (offset + key.x - totalUnits / 2) * KEY_UNIT,
      0.012,
      (key.row - 2) * KEY_UNIT,
    );
    dummy.scale.set(key.width * KEY_UNIT - 0.007, 0.018, KEY_UNIT - 0.007);
    return keyColor(key, numpad ? index - main.length : index, numpad);
  });
  return (
    <group>
      <mesh geometry={deck} material={plastic} />
      <group
        position={[
          box.centreX,
          box.bottom - 0.004 - DECK_DROP * 0.55,
          0.03 + (DECK_FRONT - 0.03) * 0.55,
        ]}
        rotation-x={slope}
      >
        <instancedMesh ref={mesh} args={[capGeometry, caps, keys.length]} />
      </group>
    </group>
  );
}

/**
 * The desk the terminal stands on: dark gunmetal with a neon strip along
 * its front edge, and a pink underglow beneath the keyboard deck.
 */
function Desk({ aspect }: { aspect: number }) {
  const box = outline(aspect);
  const top = box.bottom - DECK_HEIGHT - 0.01;
  const depth = 1.1;
  const centreZ = 0.2;
  return (
    <group>
      <mesh position={[box.centreX, top - 0.02, centreZ]}>
        <boxGeometry args={[box.width + 0.5, 0.04, depth]} />
        <meshStandardMaterial
          color="#15181a"
          roughness={0.38}
          metalness={0.65}
          fog={false}
        />
      </mesh>
      {[-1, 1].flatMap((side) =>
        [-1, 1].map((end) => (
          <mesh
            key={`${side}${end}`}
            position={[
              box.centreX + side * (box.width / 2 + 0.17),
              top - 0.04 - LEG / 2,
              centreZ + end * (depth / 2 - 0.08),
            ]}
          >
            <boxGeometry args={[0.04, LEG, 0.04]} />
            <meshStandardMaterial
              color="#15181a"
              roughness={0.45}
              metalness={0.7}
            />
          </mesh>
        )),
      )}
      <mesh position={[box.centreX, top - 0.022, centreZ + depth / 2 + 0.003]}>
        <boxGeometry args={[box.width + 0.5, 0.008, 0.006]} />
        <meshStandardMaterial
          color={NEON}
          emissive={NEON}
          emissiveIntensity={2.5}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[box.centreX, top + 0.004, DECK_FRONT - 0.02]}>
        <boxGeometry args={[box.width * 0.9, 0.006, 0.01]} />
        <meshStandardMaterial
          color={PINK}
          emissive={PINK}
          emissiveIntensity={2.5}
          toneMapped={false}
        />
      </mesh>
      <pointLight
        position={[box.centreX, top + 0.03, DECK_FRONT + 0.05]}
        intensity={0.25}
        distance={0.8}
        color={PINK}
      />
    </group>
  );
}

/**
 * Where the visitor is: seated at the 3D terminal (it moves with the camera
 * around the page's screen), standing (it stays on the desk in the room
 * while the camera rises), or without one (`off`).
 */
export type MonitorPose = "seated" | "standing" | "off";

/** Props of {@link CrtMonitor}. */
export interface CrtMonitorProps {
  /** The terminal's tube glass on the page. */
  screenRect?: () => ScreenRect | undefined;
  pose: MonitorPose;
  reducedMotion: boolean;
}

/**
 * The terminal the visitor sits at, as a 3D model in the style of the
 * integrated terminals of the 1980s: a screen unit with a brand panel and a
 * keyboard deck in one worn case, on a desk. It travels with the camera, and
 * every frame it is placed so that its screen hole projects exactly onto the
 * terminal's glass on the page; the real HTML terminal is drawn on top, so
 * text stays crisp and accessible, while perspective shows the depth. When
 * the visitor stands up it stays parked on the desk; when they sit down it
 * glides back onto the camera.
 */
export function CrtMonitor({
  screenRect,
  pose,
  reducedMotion,
}: CrtMonitorProps) {
  const mount = useRef<Group>(null);
  const lastRect = useRef<ScreenRect>(undefined);
  const parked = useRef(false);
  const model = useRef<Group>(null);
  const [aspect, setAspect] = useState(0.75);
  const invalidate = useThree((state) => state.invalidate);
  const wear = useMemo(() => wearTexture(), []);
  const brand = useMemo(() => brandPanelTexture(), []);
  const screen = useMemo(() => crtScreenTexture(5), []);
  const plastic = useMemo(
    () =>
      new MeshStandardMaterial({
        color: PLASTIC,
        map: wear,
        roughness: 0.72,
        envMapIntensity: 0.35,
        fog: false,
      }),
    [wear],
  );
  const dark = useMemo(
    () => new MeshStandardMaterial({ color: DARK, roughness: 0.8, fog: false }),
    [],
  );
  useEffect(
    () => () => {
      wear.dispose();
      brand.dispose();
      screen.dispose();
      plastic.dispose();
      dark.dispose();
    },
    [wear, brand, screen, plastic, dark],
  );
  useEffect(() => invalidate(), [screenRect, pose, invalidate]);
  useFrame(({ camera, size }, delta) => {
    const group = mount.current;
    const inner = model.current;
    if (group === null || inner === null) {
      return;
    }
    const rect = screenRect?.();
    if (rect !== undefined && rect.width > 0) {
      lastRect.current = {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      };
    }
    const shown = pose !== "off" && lastRect.current !== undefined;
    group.visible = shown;
    if (!shown || lastRect.current === undefined) {
      parked.current = false;
      return;
    }
    if (pose === "standing") {
      parked.current = true;
      return;
    }
    if (parked.current && !reducedMotion) {
      const blend = 1 - Math.exp(-delta * 5);
      group.position.lerp(camera.position, blend);
      group.quaternion.slerp(camera.quaternion, blend);
      parked.current =
        group.position.distanceTo(camera.position) > 0.001 ||
        group.quaternion.angleTo(camera.quaternion) > 0.001;
    } else {
      parked.current = false;
      group.position.copy(camera.position);
      group.quaternion.copy(camera.quaternion);
    }
    const fov = camera instanceof PerspectiveCamera ? camera.fov : 38;
    const placement = screenPlacement(lastRect.current, size, fov, DISTANCE);
    inner.position.set(...placement.position);
    inner.scale.setScalar(placement.width);
    const next = placement.height / placement.width;
    if (Math.abs(next - aspect) > 0.005) {
      setAspect(next);
    }
  });
  return (
    <group ref={mount} visible={false}>
      <pointLight
        position={[-0.5, 0.6, -0.2]}
        intensity={1.1}
        distance={3}
        color="#fff4e0"
      />
      <group ref={model}>
        <pointLight
          position={[0, -aspect / 2 - 0.1, 0.35]}
          intensity={0.2}
          distance={1.5}
          color={PHOSPHOR}
        />
        <ScreenUnit
          aspect={aspect}
          plastic={plastic}
          dark={dark}
          brand={brand}
          screen={screen}
        />
        <Deck aspect={aspect} plastic={plastic} />
        <Desk aspect={aspect} />
      </group>
    </group>
  );
}
