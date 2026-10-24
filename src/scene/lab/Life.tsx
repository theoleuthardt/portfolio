import { Sparkles } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import { Group, MeshBasicMaterial, Object3D, SpotLight } from "three";
import { BEAM_ZS, ROOM } from "../layout";
import { RACK, RACK_HEIGHT } from "../rack/geometry";
import { approach } from "../rack/focus";
import { blinkLevel } from "../rack/geometry";
import { vacuumPose } from "./procedural";

/** The maintenance robot vacuum doing its rounds between desk and rack. */
function Vacuum() {
  const body = useRef<Group>(null);
  const led = useRef<MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    const { position, heading } = vacuumPose(clock.elapsedTime);
    body.current?.position.set(position[0], ROOM.floor, position[2]);
    if (body.current) {
      body.current.rotation.y = heading;
    }
    led.current?.color.setScalar(blinkLevel(99, clock.elapsedTime) ? 3 : 0.4);
  });
  return (
    <group ref={body}>
      <mesh position-y={0.04}>
        <cylinderGeometry args={[0.17, 0.17, 0.07, 32]} />
        <meshStandardMaterial
          color="#141716"
          metalness={0.5}
          roughness={0.35}
        />
      </mesh>
      <mesh position-y={0.078}>
        <cylinderGeometry args={[0.1, 0.1, 0.01, 24]} />
        <meshStandardMaterial color="#232826" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.085, 0.12]}>
        <boxGeometry args={[0.04, 0.008, 0.012]} />
        <meshBasicMaterial ref={led} color="#33ff66" toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Dust drifting in the light beams under the ceiling panels. */
function Dust() {
  return BEAM_ZS.map((z) => (
    <Sparkles
      key={z}
      count={36}
      scale={[2.4, 3.6, 2.4]}
      position={[0, 0.9, z]}
      size={1.6}
      speed={0.15}
      opacity={0.35}
      color="#d4ffdc"
      noise={0.4}
    />
  ));
}

/** A spotlight that comes up on the rack while a project is open. */
function RackSpot({ open }: { open: boolean }) {
  const light = useRef<SpotLight>(null);
  const [target] = useState(() => {
    const object = new Object3D();
    object.position.set(RACK.x, RACK.floorY + RACK_HEIGHT / 2, RACK.z);
    return object;
  });
  useFrame((_, delta) => {
    if (light.current) {
      light.current.intensity = approach(
        light.current.intensity,
        open ? 40 : 0,
        delta,
        3,
      );
    }
  });
  return (
    <>
      <primitive object={target} />
      <spotLight
        ref={light}
        position={[RACK.x + 1.2, ROOM.ceiling - 0.2, RACK.z + 1.6]}
        target={target}
        angle={0.32}
        penumbra={0.6}
        distance={8}
        intensity={0}
        color="#d4ffdc"
      />
    </>
  );
}

/** Props of {@link Life}. */
export interface LifeProps {
  /** Whether a project is open, which puts the rack in the spotlight. */
  open: boolean;
}

/** The small life of the lab; frozen with reduced motion like all frames. */
export function Life({ open }: LifeProps) {
  return (
    <group>
      <Vacuum />
      <Dust />
      <RackSpot open={open} />
    </group>
  );
}
