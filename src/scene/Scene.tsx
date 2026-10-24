import { Environment, Lightformer, SpotLight } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  lazy,
  Suspense,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { SceneErrorBoundary } from "../ui/SceneErrorBoundary";
import { rackSlots, type RackSlot } from "../content/rack";
import { PerspectiveCamera, Vector3 } from "three";
import { usePrefersReducedMotion } from "../ui/usePrefersReducedMotion";
import { cameraPosition, fieldOfView, LAB_RIG } from "./cameraRig";
import { drag, IDLE_LOOK, lookPose, relax, wheel, type Look } from "./look";
import { LabEnvironment } from "./environment/Environment";
import { connectorPoints, toScreen } from "./rack/connector";
import { approach, moduleFront, SLIDE_OUT } from "./rack/focus";
import { Rack } from "./rack/Rack";
import {
  CrtMonitor,
  type MonitorPose,
  type ScreenPlacement,
} from "./monitor/CrtMonitor";
import { SEAT, seatFocus, standUp, type Pose } from "./monitor/seat";
import { closePose } from "./monitor/terminal";
import { BEAM_ZS, ROOM } from "./layout";

const PostEffects = lazy(() => import("./PostEffects"));
const Props = lazy(() => import("./props/Props"));
const Lab = lazy(() => import("./lab/Lab"));

const HAZE = "#041a0b";
const MINT = "#d4ffdc";
const NEON = "#4dff88";
const TARGET = new Vector3(...SEAT.target);
const SLOTS = rackSlots();
/**
 * Frame priority of the camera rig: before everything else, so whatever
 * hangs on the camera (the 3D terminal) follows it in the same frame.
 */
const CAMERA_FIRST = -1;

/** Seconds without input before the look eases back to the rig. */
const LOOK_IDLE_SECONDS = 4;

/**
 * The visitor's look around, driven by drag and wheel input. Only gestures
 * that start on the page background (`data-look-surface`) count, never those
 * on the terminal or the project panel. `sample` returns the look for the
 * next frame: eased back to the rig after a few idle seconds, reset while a
 * module is focused, and whether the visitor is moving it right now.
 */
function useLook(reducedMotion: boolean) {
  const state = useRef({ look: IDLE_LOOK, lastInput: -Infinity });
  const invalidate = useThree((three) => three.invalidate);
  useEffect(() => {
    let dragging: { x: number; y: number } | undefined;
    let wake: number | undefined;
    const touched = (look: Look) => {
      state.current = { look, lastInput: performance.now() / 1000 };
      invalidate();
      window.clearTimeout(wake);
      wake = window.setTimeout(invalidate, LOOK_IDLE_SECONDS * 1000 + 50);
    };
    const onSurface = (event: Event) =>
      event.target instanceof Element &&
      event.target.hasAttribute("data-look-surface");
    const down = (event: PointerEvent) => {
      if (event.button === 0 && onSurface(event)) {
        dragging = { x: event.clientX, y: event.clientY };
      }
    };
    const move = (event: PointerEvent) => {
      if (dragging === undefined) {
        return;
      }
      touched(
        drag(
          state.current.look,
          event.clientX - dragging.x,
          event.clientY - dragging.y,
          window.innerHeight,
        ),
      );
      dragging = { x: event.clientX, y: event.clientY };
    };
    const up = () => {
      dragging = undefined;
    };
    const turn = (event: WheelEvent) => {
      if (onSurface(event)) {
        touched(wheel(state.current.look, event.deltaY));
      }
    };
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    window.addEventListener("wheel", turn, { passive: true });
    return () => {
      window.clearTimeout(wake);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      window.removeEventListener("wheel", turn);
    };
  }, [invalidate]);
  return {
    sample: (delta: number, focused: boolean) => {
      const now = performance.now() / 1000;
      const { look, lastInput } = state.current;
      const next = focused
        ? IDLE_LOOK
        : now - lastInput > LOOK_IDLE_SECONDS
          ? relax(look, delta, reducedMotion)
          : look;
      state.current = { look: next, lastInput };
      return { look: next, active: now - lastInput < 0.5 };
    },
  };
}

interface CameraRigProps {
  reducedMotion: boolean;
  focus?: Pose;
  /** Seated, leaning in, standing or without terminal; see MonitorPose. */
  pose: MonitorPose;
}

function CameraRig({ reducedMotion, focus, pose: where }: CameraRigProps) {
  const standing = where === "standing";
  const looking = useLook(reducedMotion);
  const next = useMemo(() => new Vector3(), []);
  const lookAt = useMemo(() => TARGET.clone(), []);
  const goal = useMemo(() => new Vector3(), []);
  useFrame(({ camera, clock, pointer, size }, delta) => {
    const fov = fieldOfView(size.width / size.height);
    if (camera instanceof PerspectiveCamera && camera.fov !== fov) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    const close = where === "close";
    const sample = looking.sample(delta, focus !== undefined || close);
    if (close) {
      const lean = closePose(fov);
      next.set(...lean.position);
      goal.set(...lean.target);
    } else if (focus) {
      next.set(...focus.position);
      goal.set(...focus.target);
    } else {
      const seated = cameraPosition(
        LAB_RIG,
        clock.elapsedTime,
        pointer,
        reducedMotion,
      );
      const rest: Pose = { position: seated, target: SEAT.target };
      const from = standing ? standUp(rest) : rest;
      const pose = lookPose(from.position, from.target, {
        ...sample.look,
        zoom: standing ? sample.look.zoom : 0,
      });
      next.set(...pose.position);
      goal.set(...pose.target);
    }
    const speed = reducedMotion
      ? Infinity
      : focus
        ? 3.2
        : sample.active
          ? 6
          : standing
            ? 1.3
            : 2;
    camera.position.set(
      approach(camera.position.x, next.x, delta, speed),
      approach(camera.position.y, next.y, delta, speed),
      approach(camera.position.z, next.z, delta, speed),
    );
    lookAt.set(
      approach(lookAt.x, goal.x, delta, speed),
      approach(lookAt.y, goal.y, delta, speed),
      approach(lookAt.z, goal.z, delta, speed),
    );
    camera.lookAt(lookAt);
  }, CAMERA_FIRST);
  return null;
}

/**
 * Keeps the HUD line from the terminal prompt to the focused module up to
 * date, and clears it when nothing is focused or the scene goes away.
 */
function Connector({
  line,
  slot,
  promptAnchor,
}: {
  line?: RefObject<SVGPolylineElement | null>;
  slot?: RackSlot;
  promptAnchor?: () => DOMRect | undefined;
}) {
  const point = useMemo(() => new Vector3(), []);
  useEffect(
    () => () => {
      line?.current?.setAttribute("points", "");
    },
    [line],
  );
  useFrame(({ camera, size }) => {
    const element = line?.current;
    if (!element) {
      return;
    }
    if (!slot) {
      element.setAttribute("points", "");
      return;
    }
    const anchor = promptAnchor?.();
    camera.updateMatrixWorld();
    point.set(...moduleFront(slot, SLIDE_OUT)).project(camera);
    const module = toScreen(point, size);
    element.setAttribute(
      "points",
      anchor && module
        ? connectorPoints(
            { x: anchor.right, y: anchor.top + anchor.height / 2 },
            module,
          )
        : "",
    );
  });
  return null;
}

/**
 * Environment map made of light shapes that match the room (ceiling panels,
 * neon strips, a green accent), so metal and tiles reflect the lab's own
 * lights without downloading an HDRI.
 */
function Reflections() {
  return (
    <Environment resolution={256} frames={1}>
      <color attach="background" args={["#020604"]} />
      <Lightformer
        form="rect"
        intensity={2.2}
        color={MINT}
        position={[0, ROOM.ceiling, -4]}
        rotation-x={Math.PI / 2}
        scale={[5, 16, 1]}
      />
      {[ROOM.left + 0.8, ROOM.right - 0.8].map((x) => (
        <Lightformer
          key={x}
          form="rect"
          intensity={4}
          color={NEON}
          position={[x, 0.8, -4]}
          rotation-y={x < 0 ? Math.PI / 2 : -Math.PI / 2}
          scale={[24, 0.12, 1]}
        />
      ))}
      <Lightformer
        form="rect"
        intensity={3}
        color="#33ff66"
        position={[3.5, 1.6, ROOM.back + 0.5]}
        scale={[1.2, 0.1, 1]}
      />
    </Environment>
  );
}

/** Soft volumetric cones of light under the ceiling panels. */
function LightBeams() {
  return BEAM_ZS.map((z) => (
    <SpotLight
      key={z}
      position={[0, ROOM.ceiling - 0.1, z]}
      target-position={[0, ROOM.floor, z]}
      color={MINT}
      intensity={18}
      distance={7}
      angle={0.55}
      penumbra={0.8}
      attenuation={5.5}
      anglePower={4}
      opacity={0.22}
      volumetric
    />
  ));
}

/** Calls `onReady` once everything inside the same Suspense has loaded. */
function ReadySignal({ onReady }: { onReady: () => void }) {
  const signal = useEffectEvent(onReady);
  useEffect(() => signal(), []);
  return null;
}

/** Props of {@link Scene}. */
export interface SceneProps {
  /** Called once the textures are loaded and the lab can be shown. */
  onReady?: () => void;
  /** The project whose module is ejected, if any. */
  openProjectId?: string;
  /** Called when a rack module or a friend's postcard is clicked. */
  onSelectProject?: (projectId: string) => void;
  /** SVG polyline the scene draws the HUD line into, from prompt to module. */
  connector?: RefObject<SVGPolylineElement | null>;
  /** Where the HUD line starts: the terminal prompt. */
  promptAnchor?: () => DOMRect | undefined;
  /** Called every frame with where the HTML screen goes, or `undefined`. */
  onScreenPlacement?: (placement: ScreenPlacement | undefined) => void;
  /** Whether the visitor sits at the 3D terminal, stands, or there is none. */
  monitorPose?: MonitorPose;
  /** Called when the 3D terminal is seated around the screen, or no more. */
  onSeatedChange?: (seated: boolean) => void;
}

/**
 * The Night City lab behind the terminal, loaded lazily on wide screens with
 * WebGL: PBR environment, reflections, volumetric light, post-processing,
 * the camera rig and the 3D monitor around the terminal's screen.
 */
export default function Scene({
  onReady,
  openProjectId,
  onSelectProject,
  connector,
  promptAnchor,
  onScreenPlacement,
  monitorPose = "off",
  onSeatedChange,
}: SceneProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [labReady, setLabReady] = useState(false);
  const focusedSlot = SLOTS.find((slot) => slot.id === openProjectId);
  const focus = useMemo(
    () =>
      focusedSlot
        ? seatFocus(SEAT, moduleFront(focusedSlot, SLIDE_OUT), 0.25)
        : undefined,
    [focusedSlot],
  );
  return (
    <Canvas
      className="!absolute inset-0"
      flat
      dpr={[1, 1.75]}
      camera={{ fov: 38, position: LAB_RIG.base }}
      frameloop={reducedMotion ? "demand" : "always"}
      eventSource={document.getElementById("root") ?? undefined}
      eventPrefix="client"
      aria-hidden="true"
    >
      <color attach="background" args={[HAZE]} />
      <fogExp2 attach="fog" args={[HAZE, 0.03]} />
      <ambientLight intensity={0.25} color="#8cffa0" />
      <hemisphereLight args={[MINT, "#031008", 0.35]} />
      <pointLight
        position={[0, 2.6, 3]}
        intensity={30}
        distance={16}
        color={MINT}
      />
      <pointLight
        position={[0, 2.6, -5]}
        intensity={30}
        distance={16}
        color={MINT}
      />
      <pointLight
        position={[0, 2.6, -12]}
        intensity={24}
        distance={14}
        color={MINT}
      />
      <pointLight
        position={[-4.6, -1.2, -4]}
        intensity={6}
        distance={6}
        color={NEON}
      />
      <pointLight
        position={[3.5, 1.6, ROOM.back + 1]}
        intensity={4}
        distance={6}
        color="#33ff66"
      />
      <Suspense fallback={null}>
        <Reflections />
        <LabEnvironment />
        <Rack openProjectId={openProjectId} onSelectProject={onSelectProject} />
        <LightBeams />
        <ReadySignal
          onReady={() => {
            setLabReady(true);
            onReady?.();
          }}
        />
      </Suspense>
      {labReady ? (
        <SceneErrorBoundary fallback={null}>
          <Suspense fallback={null}>
            <Props />
            <Lab openProjectId={openProjectId} />
          </Suspense>
        </SceneErrorBoundary>
      ) : null}
      <Suspense fallback={null}>
        <PostEffects />
      </Suspense>
      <CameraRig
        reducedMotion={reducedMotion}
        focus={focus}
        pose={monitorPose}
      />
      <CrtMonitor
        pose={monitorPose}
        onScreenPlacement={onScreenPlacement}
        onSeatedChange={onSeatedChange}
        onOpen={onSelectProject}
      />
      <Connector
        line={connector}
        slot={focusedSlot}
        promptAnchor={promptAnchor}
      />
    </Canvas>
  );
}
