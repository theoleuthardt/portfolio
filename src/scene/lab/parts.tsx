import type { ReactNode } from "react";
import { Color, type CanvasTexture } from "three";
import type { Vector3 } from "../cameraRig";
import type { Placement } from "./placement";

/** Props of {@link Block}. */
export interface BlockProps {
  size: Vector3;
  position?: Vector3;
  rotation?: Vector3;
  color: string;
  metalness?: number;
  roughness?: number;
}

/** A plain box with a standard material, the brick most lab objects use. */
export function Block({
  size,
  position,
  rotation,
  color,
  metalness = 0.3,
  roughness = 0.6,
}: BlockProps) {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        metalness={metalness}
        roughness={roughness}
      />
    </mesh>
  );
}

/** Props of {@link Glow}. */
export interface GlowProps {
  map?: CanvasTexture;
  color?: string;
  size: [number, number];
  position?: Vector3;
  rotation?: Vector3;
  /** Brightness factor; above 1 blooms. */
  glow?: number;
}

/** A self-lit plane: a screen, display, sign or LED strip. */
export function Glow({
  map,
  color = "#ffffff",
  size,
  position,
  rotation,
  glow = 1.4,
}: GlowProps) {
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={size} />
      <meshBasicMaterial
        map={map}
        color={new Color(color).multiplyScalar(glow)}
        toneMapped={false}
      />
    </mesh>
  );
}

/** Puts its children where `placement` says, facing its direction. */
export function At({
  placement,
  children,
}: {
  placement: Placement;
  children: ReactNode;
}) {
  return (
    <group position={placement.position} rotation-y={placement.rotationY}>
      {children}
    </group>
  );
}
