import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  CatmullRomCurve3,
  Group,
  Mesh,
  MeshBasicMaterial,
  Vector3,
} from "three";
import { signTexture } from "../props/propTextures";
import {
  arcadeTexture,
  statusTexture,
  vendingTexture,
  whiteboardTexture,
} from "./labTextures";
import { At, Block, Glow } from "./parts";
import { useCanvasTexture } from "./useCanvasTexture";
import { LAB } from "./placement";
import { flickerLevel } from "./procedural";

const DARK = "#141716";

/** A heavy security door with a keypad and a neon EXIT sign above. */
function Door() {
  const exit = useCanvasTexture(() => statusTexture("EXIT", "#33ff66"));
  const label = useCanvasTexture(() =>
    signTexture("SERVER ROOM B", "#1a1d1c", "#9aa39d"),
  );
  return (
    <At placement={LAB.door}>
      <Block size={[1.2, 2.3, 0.08]} position={[0, 1.15, 0.03]} color={DARK} />
      <Block
        size={[1, 2.15, 0.06]}
        position={[0, 1.08, 0.08]}
        color="#39403c"
        metalness={0.8}
        roughness={0.45}
      />
      <Block
        size={[0.05, 0.3, 0.04]}
        position={[0.38, 1.05, 0.13]}
        color="#9aa39d"
        metalness={0.9}
        roughness={0.3}
      />
      <Block
        size={[0.12, 0.18, 0.03]}
        position={[0.75, 1.25, 0.06]}
        color={DARK}
      />
      <Glow
        color="#ff3b3b"
        size={[0.02, 0.02]}
        position={[0.75, 1.31, 0.08]}
        glow={3}
      />
      <Glow
        map={label}
        size={[0.7, 0.13]}
        position={[0, 1.7, 0.115]}
        glow={0.8}
      />
      <Glow
        map={exit}
        size={[0.45, 0.12]}
        position={[0, 2.5, 0.06]}
        glow={2.2}
      />
    </At>
  );
}

/** The vending machine; its neon logo flickers like a dying tube. */
function Vending() {
  const front = useCanvasTexture(vendingTexture);
  const material = useRef<MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    material.current?.color.setScalar(
      1.5 * flickerLevel(clock.elapsedTime + 7),
    );
  });
  return (
    <At placement={LAB.vending}>
      <Block
        size={[0.95, 1.95, 0.75]}
        position={[0, 0.975, 0.375]}
        color="#1c1220"
      />
      <mesh position={[-0.1, 1.05, 0.752]}>
        <planeGeometry args={[0.62, 1.5]} />
        <meshBasicMaterial ref={material} map={front} toneMapped={false} />
      </mesh>
      <Block
        size={[0.18, 0.7, 0.04]}
        position={[0.33, 1.1, 0.76]}
        color={DARK}
      />
      <Glow
        color="#4dff88"
        size={[0.1, 0.04]}
        position={[0.33, 1.35, 0.782]}
        glow={2}
      />
      <Block
        size={[0.6, 0.14, 0.04]}
        position={[-0.1, 0.18, 0.76]}
        color="#050505"
      />
      <Glow
        color="#33ff66"
        size={[0.95, 0.012]}
        position={[0, 1.96, 0.76]}
        glow={3}
      />
    </At>
  );
}

/** An arcade cabinet with a lit marquee, joystick and buttons. */
function Arcade() {
  const screen = useCanvasTexture(arcadeTexture);
  const marquee = useCanvasTexture(() =>
    statusTexture("RACK RAIDERS", "#33ff66"),
  );
  return (
    <At placement={LAB.arcade}>
      <Block
        size={[0.72, 1.05, 0.72]}
        position={[0, 0.525, 0.36]}
        color="#101418"
      />
      <Block
        size={[0.72, 0.85, 0.42]}
        position={[0, 1.47, 0.21]}
        color="#101418"
      />
      <Block
        size={[0.66, 0.06, 0.32]}
        position={[0, 1.08, 0.62]}
        rotation={[0.25, 0, 0]}
        color="#1a1f24"
      />
      <Glow
        map={screen}
        size={[0.56, 0.45]}
        position={[0, 1.5, 0.43]}
        rotation={[-0.18, 0, 0]}
        glow={1.6}
      />
      <Glow
        map={marquee}
        size={[0.66, 0.16]}
        position={[0, 1.98, 0.425]}
        glow={2.4}
      />
      <mesh position={[-0.15, 1.15, 0.64]}>
        <sphereGeometry args={[0.03, 12, 8]} />
        <meshStandardMaterial color="#b3261e" roughness={0.3} />
      </mesh>
      {[0.05, 0.13, 0.21].map((x, index) => (
        <mesh
          key={x}
          position={[x, 1.13, 0.66]}
          rotation-x={0.25 + Math.PI / 2}
        >
          <cylinderGeometry args={[0.022, 0.022, 0.02, 16]} />
          <meshStandardMaterial
            color={["#ffb000", "#4dff88", "#33ff66"][index]}
            emissive={["#ffb000", "#4dff88", "#33ff66"][index]}
            emissiveIntensity={0.8}
          />
        </mesh>
      ))}
      <Glow
        color="#4dff88"
        size={[0.012, 1.9]}
        position={[0.362, 0.95, 0.5]}
        rotation={[0, Math.PI / 2, 0]}
        glow={2.5}
      />
    </At>
  );
}

/** Rising wisps of steam above the coffee mug. */
function Steam() {
  const wisps = useRef<Group>(null);
  useFrame(({ clock, camera }) => {
    wisps.current?.children.forEach((child, index) => {
      const phase = (clock.elapsedTime * 0.35 + index / 4) % 1;
      child.position.set(Math.sin(phase * 6 + index) * 0.02, phase * 0.3, 0);
      child.quaternion.copy(camera.quaternion);
      const wisp = child as Mesh<never, MeshBasicMaterial>;
      wisp.material.opacity = 0.28 * Math.sin(phase * Math.PI);
    });
  });
  return (
    <group ref={wisps}>
      {[0, 1, 2, 3].map((index) => (
        <mesh key={index}>
          <circleGeometry args={[0.035, 12]} />
          <meshBasicMaterial color="#dfe9e4" transparent depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

/** The coffee corner: a counter, a machine with a display, a steaming mug. */
function Coffee() {
  const display = useCanvasTexture(() =>
    statusTexture("BREWING ...", "#ffb000"),
  );
  return (
    <At placement={LAB.coffee}>
      <Block size={[1.2, 0.9, 0.6]} position={[0, 0.45, 0.3]} color="#2b2f2d" />
      <Block
        size={[1.24, 0.04, 0.64]}
        position={[0, 0.92, 0.32]}
        color="#5d6460"
        metalness={0.8}
        roughness={0.35}
      />
      <Block
        size={[0.36, 0.46, 0.36]}
        position={[-0.3, 1.17, 0.25]}
        color="#1b1d1c"
        metalness={0.7}
        roughness={0.35}
      />
      <Glow
        map={display}
        size={[0.2, 0.05]}
        position={[-0.3, 1.3, 0.432]}
        glow={1.8}
      />
      <Block
        size={[0.06, 0.08, 0.06]}
        position={[-0.3, 1.05, 0.38]}
        color="#0a0a0a"
      />
      <group position={[0.1, 0.94, 0.4]}>
        <mesh position-y={0.05}>
          <cylinderGeometry args={[0.04, 0.035, 0.1, 20]} />
          <meshStandardMaterial color="#e8e2d2" roughness={0.35} />
        </mesh>
        <group position-y={0.12}>
          <Steam />
        </group>
      </group>
      {[0, 1, 2].map((index) => (
        <mesh key={index} position={[0.35, 0.99 + index * 0.06, 0.25]}>
          <cylinderGeometry args={[0.04, 0.032, 0.09, 16]} />
          <meshStandardMaterial color="#33ff66" roughness={0.5} />
        </mesh>
      ))}
    </At>
  );
}

/** The whiteboard with the network diagram. */
function Whiteboard() {
  const board = useCanvasTexture(whiteboardTexture);
  return (
    <At placement={LAB.whiteboard}>
      <Block
        size={[1.7, 1.08, 0.04]}
        position={[0, 0, 0.02]}
        color="#9aa39d"
        metalness={0.8}
        roughness={0.3}
      />
      <mesh position-z={0.042}>
        <planeGeometry args={[1.6, 1]} />
        <meshStandardMaterial map={board} roughness={0.25} />
      </mesh>
      <Block
        size={[1.4, 0.03, 0.08]}
        position={[0, -0.56, 0.06]}
        color="#9aa39d"
      />
      {["#1f4fbf", "#b3261e", "#0b7a3b"].map((color, index) => (
        <Block
          key={color}
          size={[0.12, 0.018, 0.018]}
          position={[-0.4 + index * 0.16, -0.535, 0.07]}
          color={color}
        />
      ))}
    </At>
  );
}

/** A worn couch for the night shift, with a pizza box on a crate. */
function Couch() {
  const fabric = "#4a1a28";
  return (
    <At placement={LAB.couch}>
      <Block
        size={[1.8, 0.42, 0.85]}
        position={[0, 0.21, 0.42]}
        color={fabric}
        roughness={0.95}
        metalness={0}
      />
      <Block
        size={[1.8, 0.55, 0.22]}
        position={[0, 0.62, 0.11]}
        color={fabric}
        roughness={0.95}
        metalness={0}
      />
      {[-1, 1].map((side) => (
        <Block
          key={side}
          size={[0.2, 0.62, 0.85]}
          position={[side * 0.9, 0.31, 0.42]}
          color={fabric}
          roughness={0.95}
          metalness={0}
        />
      ))}
      {[-0.42, 0.42].map((x) => (
        <Block
          key={x}
          size={[0.8, 0.12, 0.6]}
          position={[x, 0.48, 0.48]}
          rotation={[0, 0, x * 0.04]}
          color="#5a2232"
          roughness={0.95}
          metalness={0}
        />
      ))}
      <Block
        size={[0.5, 0.36, 0.4]}
        position={[0.2, 0.18, 1.35]}
        color="#2a3a2e"
        roughness={0.8}
      />
      <Block
        size={[0.4, 0.04, 0.4]}
        position={[0.2, 0.38, 1.35]}
        rotation={[0, 0.3, 0]}
        color="#c9a27a"
        roughness={0.9}
        metalness={0}
      />
      <mesh position={[0.36, 0.45, 1.2]}>
        <cylinderGeometry args={[0.03, 0.03, 0.12, 14]} />
        <meshStandardMaterial color="#33ff66" metalness={0.8} roughness={0.3} />
      </mesh>
    </At>
  );
}

/** A fire extinguisher with its hose and a wall sign. */
function Extinguisher() {
  const sign = useCanvasTexture(() =>
    signTexture("FIRE EXTINGUISHER", "#b3261e", "#ffffff"),
  );
  const hose = useMemo(
    () =>
      new CatmullRomCurve3([
        new Vector3(0.04, 0.62, 0),
        new Vector3(0.12, 0.55, 0.05),
        new Vector3(0.11, 0.25, 0.08),
        new Vector3(0.06, 0.15, 0.07),
      ]),
    [],
  );
  return (
    <At placement={LAB.extinguisher}>
      <group position-z={0.15}>
        <mesh position-y={0.3}>
          <cylinderGeometry args={[0.09, 0.09, 0.56, 24]} />
          <meshStandardMaterial
            color="#b3261e"
            metalness={0.4}
            roughness={0.35}
          />
        </mesh>
        <mesh position-y={0.62}>
          <cylinderGeometry args={[0.03, 0.05, 0.1, 16]} />
          <meshStandardMaterial
            color="#1a1a1a"
            metalness={0.8}
            roughness={0.3}
          />
        </mesh>
        <mesh>
          <tubeGeometry args={[hose, 16, 0.012, 6, false]} />
          <meshStandardMaterial color="#111" roughness={0.7} />
        </mesh>
      </group>
      <Glow
        map={sign}
        size={[0.6, 0.1125]}
        position={[0, 1.5, 0.03]}
        glow={0.9}
      />
    </At>
  );
}

/** A precision cooling unit with a slowly turning fan behind its grille. */
function Cooling() {
  const display = useCanvasTexture(() =>
    statusTexture("SUPPLY 18.5°C", "#4dff88"),
  );
  const fan = useRef<Group>(null);
  useFrame((_, delta) => {
    if (fan.current) {
      fan.current.rotation.z -= delta * 2.5;
    }
  });
  return (
    <At placement={LAB.cooling}>
      <Block
        size={[0.95, 2, 0.8]}
        position={[0, 1, 0.4]}
        color="#c9ccc7"
        metalness={0.5}
        roughness={0.5}
      />
      <Glow
        map={display}
        size={[0.3, 0.075]}
        position={[0, 1.72, 0.802]}
        glow={1.6}
      />
      <group ref={fan} position={[0, 0.85, 0.79]}>
        {[0, 1, 2, 3, 4].map((blade) => (
          <Block
            key={blade}
            size={[0.07, 0.3, 0.01]}
            position={[0, 0.15, 0]}
            rotation={[0, 0, (blade * 2 * Math.PI) / 5]}
            color="#3a3f3c"
          />
        ))}
      </group>
      {Array.from({ length: 12 }, (_, slat) => (
        <Block
          key={slat}
          size={[0.7, 0.012, 0.02]}
          position={[0, 0.55 + slat * 0.055, 0.81]}
          color="#7d827e"
          metalness={0.7}
          roughness={0.4}
        />
      ))}
    </At>
  );
}

/** Everything along the left wall of the lab. */
export function LeftWall() {
  return (
    <group>
      <Door />
      <Vending />
      <Arcade />
      <Coffee />
      <Whiteboard />
      <Couch />
      <Extinguisher />
      <Cooling />
    </group>
  );
}
