import { Environment, Lightformer, SpotLight } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { lazy, Suspense, useEffect, useMemo } from "react";
import { Vector3 } from "three";
import { usePrefersReducedMotion } from "../ui/usePrefersReducedMotion";
import { cameraPosition, LAB_RIG } from "./cameraRig";
import { LabEnvironment } from "./environment/Environment";
import { ROOM } from "./layout";

const PostEffects = lazy(() => import("./PostEffects"));

const HAZE = "#06231c";
const MINT = "#c8ffe9";
const NEON = "#2ef2c0";
const TARGET = new Vector3(0, 0.6, 0);
const BEAM_ZS = [2, -3.5, -9];

function CameraRig({ reducedMotion }: { reducedMotion: boolean }) {
  const next = useMemo(() => new Vector3(), []);
  useFrame(({ camera, clock, pointer }, delta) => {
    next.set(
      ...cameraPosition(LAB_RIG, clock.elapsedTime, pointer, reducedMotion),
    );
    camera.position.lerp(next, reducedMotion ? 1 : 1 - Math.exp(-delta * 2));
    camera.lookAt(TARGET);
  });
  return null;
}

/**
 * Environment map made of light shapes that match the room (ceiling panels,
 * neon strips, a pink accent), so metal and tiles reflect the lab's own
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
        color="#ff3d8b"
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
function ReadySignal({ onReady }: { onReady?: () => void }) {
  useEffect(() => onReady?.(), [onReady]);
  return null;
}

/** Props of {@link Scene}. */
export interface SceneProps {
  /** Called once the textures are loaded and the lab can be shown. */
  onReady?: () => void;
}

/**
 * The Night City lab behind the terminal, loaded lazily on wide screens with
 * WebGL: PBR environment, reflections, volumetric light, post-processing and
 * the camera rig.
 */
export default function Scene({ onReady }: SceneProps) {
  const reducedMotion = usePrefersReducedMotion();
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
      <ambientLight intensity={0.25} color="#7fffd8" />
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
        color="#ff3d8b"
      />
      <Suspense fallback={null}>
        <Reflections />
        <LabEnvironment />
        <LightBeams />
        <ReadySignal onReady={onReady} />
      </Suspense>
      <Suspense fallback={null}>
        <PostEffects />
      </Suspense>
      <CameraRig reducedMotion={reducedMotion} />
    </Canvas>
  );
}
