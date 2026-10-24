import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import { Color, Vector3 } from "three";
import { usePrefersReducedMotion } from "../ui/usePrefersReducedMotion";
import { cameraPosition, type RigSettings } from "./cameraRig";

const HAZE = "#06231c";
const NEON = "#2ef2c0";
const TARGET = new Vector3(0, 0.6, 0);

const rig: RigSettings = {
  base: [0.6, 1.4, 9],
  orbitRadians: 0.06,
  orbitPeriodSeconds: 48,
  parallax: 0.35,
};

function CameraRig({ reducedMotion }: { reducedMotion: boolean }) {
  const next = useMemo(() => new Vector3(), []);
  useFrame(({ camera, clock, pointer }, delta) => {
    next.set(...cameraPosition(rig, clock.elapsedTime, pointer, reducedMotion));
    camera.position.lerp(next, reducedMotion ? 1 : 1 - Math.exp(-delta * 2));
    camera.lookAt(TARGET);
  });
  return null;
}

function NeonFloor() {
  const lines = useMemo(() => Array.from({ length: 13 }, (_, i) => i - 6), []);
  const glow = useMemo(() => new Color(NEON).multiplyScalar(1.6), []);
  return (
    <group position={[0, -1.6, 0]}>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial
          color="#05100c"
          metalness={0.4}
          roughness={0.35}
        />
      </mesh>
      {lines.map((offset) => (
        <mesh key={`x${offset}`} position={[offset * 1.2, 0.005, -6]}>
          <boxGeometry args={[0.012, 0.002, 28]} />
          <meshBasicMaterial color={glow} toneMapped={false} />
        </mesh>
      ))}
      {lines.map((offset) => (
        <mesh key={`z${offset}`} position={[0, 0.005, offset * 1.6 - 6]}>
          <boxGeometry args={[16, 0.002, 0.012]} />
          <meshBasicMaterial color={glow} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

/** Props of {@link Scene}. */
export interface SceneProps {
  /** Called once the WebGL renderer has been created. */
  onReady?: () => void;
}

/**
 * The 3D lab behind the terminal, loaded lazily on wide screens with WebGL.
 * This first stage has the floor, fog and camera rig; the environment, rack
 * and props follow in their own issues.
 */
export default function Scene({ onReady }: SceneProps) {
  const reducedMotion = usePrefersReducedMotion();
  return (
    <Canvas
      className="!absolute inset-0"
      dpr={[1, 1.75]}
      camera={{ fov: 38, position: rig.base }}
      frameloop={reducedMotion ? "demand" : "always"}
      eventSource={document.getElementById("root") ?? undefined}
      eventPrefix="client"
      aria-hidden="true"
      onCreated={() => onReady?.()}
    >
      <color attach="background" args={[HAZE]} />
      <fogExp2 attach="fog" args={[HAZE, 0.06]} />
      <ambientLight intensity={0.4} color="#9fffe0" />
      <pointLight position={[0, 4, 2]} intensity={30} color="#c8ffe9" />
      <NeonFloor />
      <CameraRig reducedMotion={reducedMotion} />
    </Canvas>
  );
}
