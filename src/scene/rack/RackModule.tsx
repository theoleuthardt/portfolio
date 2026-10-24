import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { Color, type Group, type MeshBasicMaterial } from "three";
import type { RackSlot } from "../../content/rack";
import { InstancedBoxes, type Point3 } from "../environment/InstancedBoxes";
import { evenlySpaced } from "../layout";
import { usePbr } from "../environment/usePbr";
import { blinkLevel, RACK, slotCenterY } from "./geometry";
import { labelTexture } from "./labelTexture";

const PHOSPHOR = new Color("#33ff66");
const AMBER = new Color("#ffb000");
const OFF = new Color("#06140b");
const FACE_WIDTH = RACK.width - 0.12;
const FRONT = RACK.depth / 2;

/** Props of {@link RackModule}. */
export interface RackModuleProps {
  slot: RackSlot;
  seed: number;
  fork: boolean;
  open: boolean;
  reducedMotion: boolean;
  /** Called on click; absent for modules that are not projects. */
  onSelect?: () => void;
}

function ignoresOverlay(event: ThreeEvent<PointerEvent | MouseEvent>): boolean {
  const target = event.nativeEvent.target;
  return (
    target instanceof Element && target.closest(".crt, .hud-panel") !== null
  );
}

function Fan({ reducedMotion }: { reducedMotion: boolean }) {
  const blades = useRef<Group>(null);
  useFrame((_, delta) => {
    if (!reducedMotion && blades.current) {
      blades.current.rotation.z -= delta * 9;
    }
  });
  return (
    <group position={[FACE_WIDTH / 2 - 0.13, 0, FRONT + 0.012]}>
      <mesh>
        <ringGeometry args={[0.07, 0.085, 32]} />
        <meshStandardMaterial color="#1a201d" metalness={0.8} roughness={0.4} />
      </mesh>
      <group ref={blades}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} rotation-z={(i * 2 * Math.PI) / 5} position-z={-0.004}>
            <boxGeometry args={[0.012, 0.13, 0.004]} />
            <meshStandardMaterial color="#0b0f0d" roughness={0.6} />
          </mesh>
        ))}
      </group>
      {evenlySpaced(-0.06, 0.06, 5).map((y) => (
        <mesh key={y} position={[0, y, 0.004]}>
          <boxGeometry args={[0.15, 0.004, 0.004]} />
          <meshStandardMaterial
            color="#2a312d"
            metalness={0.8}
            roughness={0.4}
          />
        </mesh>
      ))}
    </group>
  );
}

/**
 * One rack module: vented face plate with handles and screws, a label strip,
 * a power LED, a blinking activity LED, an amber badge for the fork and a fan
 * on 2U modules. Hovering highlights it; clicking selects it.
 */
export function RackModule({
  slot,
  seed,
  fork,
  open,
  reducedMotion,
  onSelect,
}: RackModuleProps) {
  const height = slot.units * RACK.unitHeight - 0.006;
  const [hovered, setHovered] = useState(false);
  const face = usePbr("wall", 1, height * 2);
  const label = useMemo(() => labelTexture(slot.id), [slot.id]);
  useEffect(() => () => label.dispose(), [label]);
  const activity = useRef<MeshBasicMaterial>(null);
  const lit = hovered || open;

  useFrame(({ clock }) => {
    if (activity.current) {
      const on = reducedMotion ? 1 : blinkLevel(seed, clock.elapsedTime);
      activity.current.color
        .copy(on ? (fork ? AMBER : PHOSPHOR) : OFF)
        .multiplyScalar(on ? 4 : 1);
    }
  });

  const vents = useMemo<Point3[]>(
    () =>
      evenlySpaced(
        -height / 2 + 0.02,
        height / 2 - 0.02,
        Math.max(2, slot.units * 3),
      ).flatMap((y) =>
        evenlySpaced(-FACE_WIDTH / 2 + 0.1, -0.14, 5).map((x): Point3 => [
          x,
          y,
          FRONT + 0.006,
        ]),
      ),
    [height, slot.units],
  );
  const screws = useMemo<Point3[]>(
    () =>
      [-1, 1].flatMap((side) =>
        [-1, 1].map((v): Point3 => [
          side * (FACE_WIDTH / 2 + 0.025),
          v * (height / 2 - 0.015),
          FRONT + 0.008,
        ]),
      ),
    [height],
  );

  const interactive = onSelect !== undefined;
  return (
    <group
      position={[0, slotCenterY(slot), open ? 0.08 : 0]}
      onPointerOver={(event) => {
        if (!interactive || ignoresOverlay(event)) {
          return;
        }
        event.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "";
      }}
      onClick={(event) => {
        if (!interactive || ignoresOverlay(event)) {
          return;
        }
        event.stopPropagation();
        onSelect();
      }}
    >
      <mesh>
        <boxGeometry args={[FACE_WIDTH, height, RACK.depth - 0.06]} />
        <meshStandardMaterial color="#0b0f0d" metalness={0.7} roughness={0.5} />
      </mesh>
      <mesh position-z={FRONT - 0.03 + 0.002}>
        <boxGeometry args={[FACE_WIDTH + 0.08, height, 0.008]} />
        <meshStandardMaterial
          {...face}
          color={lit ? "#7a8c86" : "#5a6762"}
          metalness={1}
          roughness={1}
          emissive={PHOSPHOR}
          emissiveIntensity={lit ? 0.05 : 0}
        />
      </mesh>
      <InstancedBoxes positions={vents} size={[0.05, 0.008, 0.004]}>
        <meshStandardMaterial color="#010302" roughness={0.9} />
      </InstancedBoxes>
      <InstancedBoxes positions={screws} size={[0.012, 0.012, 0.006]}>
        <meshStandardMaterial color="#9aa6a1" metalness={1} roughness={0.3} />
      </InstancedBoxes>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * (FACE_WIDTH / 2 - 0.02), 0, FRONT + 0.02]}
        >
          <boxGeometry args={[0.018, Math.min(height - 0.02, 0.16), 0.025]} />
          <meshStandardMaterial
            color="#8e9a95"
            metalness={1}
            roughness={0.25}
          />
        </mesh>
      ))}
      <mesh position={[0.08, slot.units > 1 ? height / 4 : 0, FRONT + 0.007]}>
        <planeGeometry args={[0.32, 0.04]} />
        <meshBasicMaterial
          map={label}
          color={new Color(1, 1, 1).multiplyScalar(lit ? 2.4 : 1.1)}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0.27, slot.units > 1 ? height / 4 : 0, FRONT + 0.008]}>
        <circleGeometry args={[0.009, 16]} />
        <meshBasicMaterial
          color={PHOSPHOR.clone().multiplyScalar(3)}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0.3, slot.units > 1 ? height / 4 : 0, FRONT + 0.008]}>
        <circleGeometry args={[0.009, 16]} />
        <meshBasicMaterial ref={activity} color={PHOSPHOR} toneMapped={false} />
      </mesh>
      {fork ? (
        <mesh
          position={[0.08, slot.units > 1 ? -height / 4 : -0.03, FRONT + 0.007]}
        >
          <planeGeometry args={[0.1, 0.022]} />
          <meshBasicMaterial
            color={AMBER.clone().multiplyScalar(2)}
            toneMapped={false}
          />
        </mesh>
      ) : null}
      {slot.units > 1 ? <Fan reducedMotion={reducedMotion} /> : null}
    </group>
  );
}
