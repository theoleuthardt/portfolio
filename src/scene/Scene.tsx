import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import { Vector3 } from "three";
import { usePrefersReducedMotion } from "../ui/usePrefersReducedMotion";
import { cameraPosition, LAB_RIG } from "./cameraRig";
import { LabEnvironment } from "./environment/Environment";

const HAZE = "#06231c";
const TARGET = new Vector3(0, 0.6, 0);

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

/** Props of {@link Scene}. */
export interface SceneProps {
  /** Called once the WebGL renderer has been created. */
  onReady?: () => void;
}

/**
 * The 3D lab behind the terminal, loaded lazily on wide screens with WebGL.
 * It holds the Night City environment, fog and camera rig; rack and props
 * follow in their own issues.
 */
export default function Scene({ onReady }: SceneProps) {
  const reducedMotion = usePrefersReducedMotion();
  return (
    <Canvas
      className="!absolute inset-0"
      dpr={[1, 1.75]}
      camera={{ fov: 38, position: LAB_RIG.base }}
      frameloop={reducedMotion ? "demand" : "always"}
      eventSource={document.getElementById("root") ?? undefined}
      eventPrefix="client"
      aria-hidden="true"
      onCreated={() => onReady?.()}
    >
      <color attach="background" args={[HAZE]} />
      <fogExp2 attach="fog" args={[HAZE, 0.035]} />
      <ambientLight intensity={0.7} color="#7fffd8" />
      <hemisphereLight args={["#c8ffe9", "#031008", 0.6]} />
      <pointLight
        position={[0, 2.6, 3]}
        intensity={45}
        distance={16}
        color="#c8ffe9"
      />
      <pointLight
        position={[0, 2.6, -5]}
        intensity={45}
        distance={16}
        color="#c8ffe9"
      />
      <pointLight
        position={[0, 2.6, -12]}
        intensity={35}
        distance={14}
        color="#9fffe0"
      />
      <pointLight
        position={[-4.6, -1.2, -4]}
        intensity={6}
        distance={6}
        color="#2ef2c0"
      />
      <LabEnvironment />
      <CameraRig reducedMotion={reducedMotion} />
    </Canvas>
  );
}
