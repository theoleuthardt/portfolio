import { RoundedBox } from "@react-three/drei";
import { Baked } from "../bake/Baked";
import { useFrame, useThree } from "@react-three/fiber";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type RefObject,
} from "react";
import {
  BoxGeometry,
  Color,
  ExtrudeGeometry,
  InstancedMesh,
  DoubleSide,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  Shape,
  Vector3,
  type CanvasTexture,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import {
  brandPanelTexture,
  crtScreenTexture,
  postcardTexture,
} from "../props/propTextures";
import { friends } from "../../content/friends";
import {
  KEYBOARD_UNITS,
  keyboardKeys,
  NUMPAD_UNITS,
  numpadKeys,
  type Key,
} from "./keyboard";
import { type Point2, type Quad, SCREEN } from "./seat";
import {
  closePose,
  SCREEN_CENTRE,
  SCREEN_CORNERS,
  SCREEN_DEPTH,
  SEAT_EYES,
  TERMINAL_FLOOR,
  TERMINAL_FRAME,
  TERMINAL_ORIENTATION,
} from "./terminal";
import { wearTexture } from "./wearTexture";

const ASPECT = SCREEN.aspect;
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
const NEON = "#4dff88";
const KEY_DARK = new Color("#34332f");
const KEY_GREY = new Color("#7a776d");
const KEY_RED = new Color("#a8322a");
const KEY_LIGHT = new Color("#d6cfba");
const KEY_ORANGE = new Color("#d08a2c");
/**
 * The desk's model unit in metres: the desk, chair and props were modelled
 * around a screen this wide and keep their real size when the terminal
 * grows.
 */
const DESK_UNIT = 0.36;

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

/** The screen unit's outline. */
const HOUSING = outline(ASPECT);

/** The bottom of the keyboard deck, where the desk top is. */
const DECK_BOTTOM = HOUSING.bottom - DECK_HEIGHT - 0.01;

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

/** Pixels a click may move before it counts as a drag to look around. */
const DRAG_TOLERANCE = 5;

/**
 * A postcard propped up on the desk for each friend's site; clicking it
 * opens the site, like `open <site>` in the terminal.
 */
function Postcards({
  top,
  left,
  onOpen,
}: {
  top: number;
  left: number;
  onOpen?: (id: string) => void;
}) {
  const cards = useMemo(
    () =>
      friends.map((friend) => ({
        friend,
        texture: postcardTexture(friend.site, new URL(friend.url).host),
      })),
    [],
  );
  useEffect(
    () => () => cards.forEach(({ texture }) => texture.dispose()),
    [cards],
  );
  return cards.map(({ friend, texture }, index) => (
    <mesh
      key={friend.id}
      userData={{ dynamic: true }}
      position={[left + index * 0.6, top + 0.17, 0.25]}
      rotation={[-0.35, -0.25, 0]}
      onPointerOver={(event) => {
        event.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "";
      }}
      onClick={(event) => {
        const target = event.nativeEvent.target;
        const onOverlay =
          target instanceof Element &&
          target.closest(".crt, .hud-panel") !== null;
        if (onOverlay || event.delta > DRAG_TOLERANCE) {
          return;
        }
        event.stopPropagation();
        onOpen?.(friend.id);
      }}
    >
      <planeGeometry args={[0.55, 0.37]} />
      <meshStandardMaterial
        map={texture}
        roughness={0.6}
        emissiveMap={texture}
        emissive="#ffffff"
        emissiveIntensity={0.35}
      />
    </mesh>
  ));
}

/**
 * The desk the terminal stands on, in desk units ({@link DESK_UNIT}) from
 * the screen centre: its top at `top`, its legs on the floor at `floor`,
 * the props right of the terminal's right edge `right`. Dark gunmetal with
 * a neon strip along its front edge, and a chair.
 */
function Desk({
  top,
  floor,
  right,
  onOpen,
}: {
  top: number;
  floor: number;
  right: number;
  onOpen?: (id: string) => void;
}) {
  const width = 5.6;
  const depth = 2.5;
  const centreX = 1.2;
  const centreZ = -0.05;
  const leg = top - 0.04 - floor;
  const seat = floor + 1.33;
  return (
    <group>
      <mesh position={[centreX, top - 0.02, centreZ]}>
        <boxGeometry args={[width, 0.04, depth]} />
        <meshStandardMaterial
          color="#15181a"
          roughness={0.38}
          metalness={0.65}
        />
      </mesh>
      {[-1, 1].flatMap((side) =>
        [-1, 1].map((end) => (
          <mesh
            key={`${side}${end}`}
            position={[
              centreX + side * (width / 2 - 0.12),
              top - 0.04 - leg / 2,
              centreZ + end * (depth / 2 - 0.12),
            ]}
          >
            <boxGeometry args={[0.1, leg, 0.1]} />
            <meshStandardMaterial
              color="#15181a"
              roughness={0.45}
              metalness={0.7}
            />
          </mesh>
        )),
      )}
      <mesh position={[centreX, top - 0.022, centreZ + depth / 2 + 0.003]}>
        <boxGeometry args={[width, 0.008, 0.006]} />
        <meshStandardMaterial
          color={NEON}
          emissive={NEON}
          emissiveIntensity={2.5}
          toneMapped={false}
        />
      </mesh>
      <group position={[right + 1.74, top, -0.75]} rotation-y={-0.5}>
        <mesh position-y={0.04}>
          <cylinderGeometry args={[0.22, 0.26, 0.08, 24]} />
          <meshStandardMaterial
            color="#1b1e1d"
            metalness={0.7}
            roughness={0.4}
          />
        </mesh>
        <mesh position={[0, 0.75, 0.15]} rotation-x={0.35}>
          <cylinderGeometry args={[0.03, 0.03, 1.5, 10]} />
          <meshStandardMaterial
            color="#2a2f2d"
            metalness={0.8}
            roughness={0.35}
          />
        </mesh>
        <mesh position={[0, 1.42, 0.62]} rotation-x={-0.9}>
          <coneGeometry args={[0.28, 0.42, 20, 1, true]} />
          <meshStandardMaterial
            color="#141716"
            metalness={0.7}
            roughness={0.4}
            side={DoubleSide}
          />
        </mesh>
        <pointLight
          position={[0, 0.9, 0.85]}
          intensity={0.6}
          distance={1.6}
          color="#ffe2b0"
        />
      </group>
      <group position={[right + 0.89, top, -0.35]}>
        <mesh position-y={0.17}>
          <cylinderGeometry args={[0.12, 0.11, 0.34, 20]} />
          <meshStandardMaterial color="#1b1e1d" roughness={0.4} />
        </mesh>
        <mesh position={[0.15, 0.18, 0]} rotation-x={Math.PI / 2}>
          <torusGeometry args={[0.07, 0.02, 8, 16]} />
          <meshStandardMaterial color="#1b1e1d" roughness={0.4} />
        </mesh>
      </group>
      {[0, 0.04, 0.08].map((lift, index) => (
        <mesh
          key={lift}
          position={[right + 1.09, top + 0.01 + lift * 0.1, 0.35]}
          rotation-y={0.3 - index * 0.2}
        >
          <boxGeometry args={[0.6, 0.008, 0.82]} />
          <meshStandardMaterial color="#d9dcd6" roughness={0.9} />
        </mesh>
      ))}
      <Postcards top={top} left={right + 0.34} onOpen={onOpen} />
      <group position={[0.55, 0, 2.25]}>
        <mesh position-y={seat}>
          <boxGeometry args={[1.3, 0.2, 1.2]} />
          <meshStandardMaterial color="#121414" roughness={0.85} />
        </mesh>
        <mesh position={[0, seat + 0.95, 0.62]} rotation-x={-0.12}>
          <boxGeometry args={[1.2, 1.6, 0.16]} />
          <meshStandardMaterial color="#121414" roughness={0.85} />
        </mesh>
        <mesh position-y={(seat + floor) / 2}>
          <cylinderGeometry args={[0.07, 0.07, seat - floor - 0.25, 12]} />
          <meshStandardMaterial
            color="#5d6460"
            metalness={0.9}
            roughness={0.3}
          />
        </mesh>
        {[0, 1, 2, 3, 4].map((spoke) => (
          <mesh
            key={spoke}
            position={[
              Math.sin((spoke * 2 * Math.PI) / 5) * 0.45,
              floor + 0.14,
              Math.cos((spoke * 2 * Math.PI) / 5) * 0.45,
            ]}
            rotation-y={(spoke * 2 * Math.PI) / 5}
          >
            <boxGeometry args={[0.09, 0.07, 0.9]} />
            <meshStandardMaterial
              color="#1b1e1d"
              metalness={0.6}
              roughness={0.4}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/**
 * Where the visitor is: seated at the terminal (its screen shows the HTML
 * terminal), leaning in close to its screen, standing (the terminal stays on
 * the desk while the camera rises), or without one (`off`).
 */
export type MonitorPose = "seated" | "close" | "standing" | "off";

/** Where the page has to draw the HTML screen to cover the 3D one. */
export interface ScreenPlacement {
  quad: Quad;
  /** The element's size in CSS pixels at rest, so it is drawn at about 1:1. */
  width: number;
  height: number;
}

/** Props of {@link CrtMonitor}. */
export interface CrtMonitorProps {
  pose: MonitorPose;
  /** Called every frame while seated, with `undefined` when it is not. */
  onScreenPlacement?: (placement: ScreenPlacement | undefined) => void;
  /**
   * Called when the visitor sits at the terminal with its screen in view,
   * and when they no longer do, so the page shows the screen only then.
   */
  onSeatedChange?: (seated: boolean) => void;
  /** Called with a friend's id when their postcard on the desk is clicked. */
  onOpen?: (id: string) => void;
}

const SEATED_DISTANCE = 0.12;

/**
 * The terminal the visitor sits at, as a 3D model in the style of the
 * integrated terminals of the 1980s: a screen unit with a brand panel and a
 * keyboard deck in one worn case, on a desk beside rack-01, with a chair.
 * It stands still in the room. Every frame while seated it projects its
 * screen corners onto the page, and the page maps the real HTML terminal
 * onto them, so the terminal reads as a program on this computer while its
 * text stays real, selectable and accessible.
 */
export function CrtMonitor({
  pose,
  onScreenPlacement,
  onSeatedChange,
  onOpen,
}: CrtMonitorProps) {
  const reported = useRef(false);
  const point = useMemo(() => new Vector3(), []);
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
      }),
    [wear],
  );
  const dark = useMemo(
    () => new MeshStandardMaterial({ color: DARK, roughness: 0.8 }),
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
  useEffect(() => invalidate(), [pose, invalidate]);
  useFrame(({ camera, size }) => {
    const fov = camera instanceof PerspectiveCamera ? camera.fov : 38;
    const atScreen = pose === "seated" || pose === "close";
    const eyes =
      pose === "close" ? new Vector3(...closePose(fov).position) : SEAT_EYES;
    const seatedNow =
      atScreen && camera.position.distanceTo(eyes) < SEATED_DISTANCE;
    camera.updateMatrixWorld();
    const quad = SCREEN_CORNERS.map((corner) => {
      point.set(...corner).project(camera);
      return point.z < 1
        ? ([
            ((point.x + 1) / 2) * size.width,
            ((1 - point.y) / 2) * size.height,
          ] as Point2)
        : undefined;
    });
    const visible = quad.every((corner) => corner !== undefined);
    if (atScreen && visible) {
      const depth =
        pose === "close" ? eyes.distanceTo(SCREEN_CENTRE) : SCREEN_DEPTH;
      const width =
        (SCREEN.width * size.height) /
        (2 * depth * Math.tan((fov * Math.PI) / 360));
      onScreenPlacement?.({
        quad: quad as Quad,
        width,
        height: width * SCREEN.aspect,
      });
    } else {
      onScreenPlacement?.(undefined);
    }
    const seated = seatedNow && visible;
    if (reported.current !== seated) {
      reported.current = seated;
      onSeatedChange?.(seated);
    }
  });
  return (
    <group
      position={TERMINAL_FRAME.centre}
      quaternion={TERMINAL_ORIENTATION}
      visible={pose !== "off"}
    >
      <Baked>
        <group scale={SCREEN.width}>
          <ScreenUnit
            aspect={ASPECT}
            plastic={plastic}
            dark={dark}
            brand={brand}
            screen={screen}
          />
          <Deck aspect={ASPECT} plastic={plastic} />
          <mesh
            position={[HOUSING.centreX, DECK_BOTTOM + 0.004, DECK_FRONT - 0.02]}
          >
            <boxGeometry args={[HOUSING.width * 0.9, 0.006, 0.01]} />
            <meshStandardMaterial
              color={PHOSPHOR}
              emissive={PHOSPHOR}
              emissiveIntensity={2.5}
              toneMapped={false}
            />
          </mesh>
        </group>
        <group scale={DESK_UNIT}>
          <Desk
            top={(DECK_BOTTOM * SCREEN.width) / DESK_UNIT}
            floor={(TERMINAL_FLOOR * SCREEN.width) / DESK_UNIT}
            right={(HOUSING.right * SCREEN.width) / DESK_UNIT}
            onOpen={onOpen}
          />
        </group>
      </Baked>
    </group>
  );
}
