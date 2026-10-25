import { useMemo } from "react";
import { DoubleSide } from "three";
import { findProject, RACK_UNITS } from "../../content/projects";
import { rackSlots } from "../../content/rack";
import { usePrefersReducedMotion } from "../../ui/usePrefersReducedMotion";
import { InstancedBoxes, type Point3 } from "../environment/InstancedBoxes";
import { usePbr } from "../environment/usePbr";
import { evenlySpaced } from "../layout";
import { RACK, RACK_HEIGHT } from "./geometry";
import { RackModule } from "./RackModule";

const slots = rackSlots();
const HALF_W = RACK.width / 2;
const HALF_D = RACK.depth / 2;

/** Props of {@link Rack}. */
export interface RackProps {
  openProjectId?: string;
  /** Called with a clicked module's id: a project, `about` or `contact`. */
  onSelectProject?: (projectId: string) => void;
}

function Frame() {
  const side = usePbr("wall", 1, 2);
  const posts = useMemo<Point3[]>(
    () =>
      [-1, 1].flatMap((x) =>
        [-1, 1].map((z): Point3 => [
          x * (HALF_W - 0.02),
          RACK.floorY + RACK_HEIGHT / 2,
          z * (HALF_D - 0.02),
        ]),
      ),
    [],
  );
  const holes = useMemo<Point3[]>(
    () =>
      [-1, 1].flatMap((x) =>
        evenlySpaced(
          RACK.floorY + RACK.plinth + 0.02,
          RACK.floorY + RACK.plinth + RACK_UNITS * RACK.unitHeight - 0.02,
          RACK_UNITS * 3,
        ).map((y): Point3 => [x * (HALF_W - 0.03), y, HALF_D + 0.003]),
      ),
    [],
  );
  return (
    <group>
      <InstancedBoxes positions={posts} size={[0.05, RACK_HEIGHT, 0.05]}>
        <meshStandardMaterial
          color="#1b2220"
          metalness={0.9}
          roughness={0.35}
        />
      </InstancedBoxes>
      {[-1, 1].map((x) => (
        <mesh
          key={x}
          position={[
            x * (HALF_W - 0.03),
            RACK.floorY + RACK_HEIGHT / 2,
            HALF_D - 0.005,
          ]}
        >
          <boxGeometry args={[0.04, RACK_HEIGHT - 0.1, 0.012]} />
          <meshStandardMaterial
            color="#2c3532"
            metalness={0.9}
            roughness={0.3}
          />
        </mesh>
      ))}
      <InstancedBoxes positions={holes} size={[0.012, 0.012, 0.004]}>
        <meshStandardMaterial color="#010201" />
      </InstancedBoxes>
      {[-1, 1].map((x) => (
        <mesh
          key={x}
          position={[x * HALF_W, RACK.floorY + RACK_HEIGHT / 2, 0]}
          rotation-y={x * (Math.PI / 2)}
        >
          <planeGeometry args={[RACK.depth, RACK_HEIGHT]} />
          <meshStandardMaterial
            {...side}
            color="#3d4945"
            metalness={1}
            roughness={1}
            side={DoubleSide}
          />
        </mesh>
      ))}
      <mesh position={[0, RACK.floorY + RACK_HEIGHT - 0.03, 0]}>
        <boxGeometry args={[RACK.width + 0.04, 0.06, RACK.depth + 0.04]} />
        <meshStandardMaterial color="#141a18" metalness={0.8} roughness={0.4} />
      </mesh>
      <mesh position={[0, RACK.floorY + RACK.plinth / 2, 0]}>
        <boxGeometry
          args={[RACK.width + 0.04, RACK.plinth, RACK.depth + 0.04]}
        />
        <meshStandardMaterial color="#0a0e0c" metalness={0.6} roughness={0.6} />
      </mesh>
      <mesh position={[0, RACK.floorY + 0.012, HALF_D + 0.03]}>
        <boxGeometry args={[RACK.width + 0.04, 0.012, 0.02]} />
        <meshBasicMaterial color="#4dff88" toneMapped={false} />
      </mesh>
    </group>
  );
}

const usedUnits = slots.reduce((sum, slot) => sum + slot.units, 0);

/** Blanking panels that close the unused units below the modules. */
function BlankingPanels() {
  const panel = usePbr("wall", 1, 0.3);
  return evenlySpaced(
    usedUnits,
    RACK_UNITS - 1,
    Math.max(1, RACK_UNITS - usedUnits),
  ).map((unit) => (
    <mesh
      key={unit}
      position={[
        0,
        RACK.floorY + RACK.plinth + (RACK_UNITS - unit - 0.5) * RACK.unitHeight,
        HALF_D - 0.03,
      ]}
    >
      <boxGeometry args={[RACK.width - 0.04, RACK.unitHeight - 0.006, 0.008]} />
      <meshStandardMaterial
        {...panel}
        color="#2c3532"
        metalness={1}
        roughness={1}
      />
    </mesh>
  ));
}

/**
 * The server rack: frame, side panels and one module
 * per slot (contact panel, the projects, the about server).
 */
export function Rack({ openProjectId, onSelectProject }: RackProps) {
  const reducedMotion = usePrefersReducedMotion();
  return (
    <group position={[RACK.x, 0, RACK.z]} rotation-y={RACK.rotationY}>
      <Frame />
      <BlankingPanels />
      {slots.map((slot, index) => {
        const project = findProject(slot.id);
        return (
          <RackModule
            key={slot.id}
            slot={slot}
            seed={index + 1}
            fork={project?.fork !== undefined}
            open={slot.id === openProjectId}
            reducedMotion={reducedMotion}
            onSelect={
              onSelectProject ? () => onSelectProject(slot.id) : undefined
            }
          />
        );
      })}
    </group>
  );
}
