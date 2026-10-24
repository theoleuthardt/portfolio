import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import {
  CatmullRomCurve3,
  Color,
  DoubleSide,
  Group,
  InstancedMesh,
  Object3D,
  Vector3,
} from "three";
import { blinkLevel } from "../rack/geometry";
import { hazardStripesTexture } from "../props/propTextures";
import { scopeTexture, statusTexture } from "./labTextures";
import { At, Block, Glow } from "./parts";
import { useCanvasTexture } from "./useCanvasTexture";
import { LAB } from "./placement";

const STEEL = "#2a2f2d";
const DARK = "#141716";
const SWITCHES = 4;
const PORTS = 24;
const LED_ON = new Color("#33ff66").multiplyScalar(3);
const LED_AMBER = new Color("#ffb000").multiplyScalar(3);
const LED_OFF = new Color("#06140c");

/** Two UPS battery cabinets with status displays. */
function Ups() {
  const display = useCanvasTexture(() => statusTexture("LOAD 42% · ON LINE"));
  return (
    <At placement={LAB.ups}>
      {[-0.33, 0.33].map((x) => (
        <group key={x} position-x={x}>
          <Block
            size={[0.62, 1.8, 0.8]}
            position={[0, 0.9, 0.4]}
            color="#1d2120"
            metalness={0.6}
            roughness={0.45}
          />
          {Array.from({ length: 10 }, (_, slat) => (
            <Block
              key={slat}
              size={[0.5, 0.012, 0.01]}
              position={[0, 0.3 + slat * 0.05, 0.805]}
              color="#0b0d0c"
            />
          ))}
          <Glow
            map={display}
            size={[0.36, 0.09]}
            position={[0, 1.45, 0.802]}
            glow={1.6}
          />
          <Glow
            color="#33ff66"
            size={[0.02, 0.02]}
            position={[0.22, 1.3, 0.802]}
            glow={3}
          />
        </group>
      ))}
    </At>
  );
}

/** An exhaust fan high on the wall, turning behind its guard. */
function WallFan() {
  const blades = useRef<Group>(null);
  useFrame((_, delta) => {
    if (blades.current) {
      blades.current.rotation.z -= delta * 7;
    }
  });
  return (
    <At placement={LAB.wallFan}>
      <Block size={[0.7, 0.7, 0.12]} position={[0, 0, 0.06]} color={STEEL} />
      <mesh position-z={0.13}>
        <torusGeometry args={[0.3, 0.02, 8, 32]} />
        <meshStandardMaterial
          color="#5d6460"
          metalness={0.8}
          roughness={0.35}
        />
      </mesh>
      <group ref={blades} position-z={0.1}>
        {[0, 1, 2, 3].map((blade) => (
          <Block
            key={blade}
            size={[0.1, 0.27, 0.01]}
            position={[0, 0.14, 0]}
            rotation={[0.3, 0, (blade * Math.PI) / 2]}
            color="#4a504c"
          />
        ))}
      </group>
    </At>
  );
}

/** A wall of network switches with blinking port LEDs and patch cables. */
function SwitchWall() {
  const ports = useRef<InstancedMesh>(null);
  const leds = useRef<InstancedMesh>(null);
  const count = SWITCHES * PORTS;
  const portX = (port: number) =>
    -0.62 + (port % 12) * 0.1 + Math.floor(port / 12) * 0.06;
  const portY = (unit: number, port: number) =>
    0.45 - unit * 0.3 + (port < 12 ? 0.03 : -0.03);
  useLayoutEffect(() => {
    const dummy = new Object3D();
    for (let index = 0; index < count; index++) {
      const unit = Math.floor(index / PORTS);
      const port = index % PORTS;
      dummy.position.set(portX(port), portY(unit, port), 0.1);
      dummy.updateMatrix();
      ports.current?.setMatrixAt(index, dummy.matrix);
      dummy.position.set(portX(port) + 0.025, portY(unit, port) + 0.022, 0.101);
      dummy.updateMatrix();
      leds.current?.setMatrixAt(index, dummy.matrix);
      leds.current?.setColorAt(index, LED_OFF);
    }
    if (ports.current) {
      ports.current.instanceMatrix.needsUpdate = true;
    }
    if (leds.current) {
      leds.current.instanceMatrix.needsUpdate = true;
    }
  });
  useFrame(({ clock }) => {
    const target = leds.current;
    if (target === null) {
      return;
    }
    for (let index = 0; index < count; index++) {
      const lit =
        index % 7 !== 3 && blinkLevel(index + 40, clock.elapsedTime) === 1;
      target.setColorAt(
        index,
        lit ? (index % 11 === 0 ? LED_AMBER : LED_ON) : LED_OFF,
      );
    }
    if (target.instanceColor) {
      target.instanceColor.needsUpdate = true;
    }
  });
  const patches = useMemo(
    () =>
      [0, 1, 2].flatMap((unit) =>
        [2, 6, 9].map((port, index) => {
          const from = new Vector3(portX(port), portY(unit, port), 0.12);
          const to = new Vector3(
            portX(port + 3 + index),
            portY(unit + 1, port + 3 + index),
            0.12,
          );
          return new CatmullRomCurve3([
            from,
            from.clone().add(new Vector3(0, -0.05, 0.08)),
            to.clone().add(new Vector3(0, 0.05, 0.08)),
            to,
          ]);
        }),
      ),
    [],
  );
  return (
    <At placement={LAB.switchWall}>
      <Block
        size={[1.6, 1.25, 0.03]}
        position={[0, 0, 0.015]}
        color="#0e1110"
      />
      {Array.from({ length: SWITCHES }, (_, unit) => (
        <Block
          key={unit}
          size={[1.42, 0.16, 0.12]}
          position={[0, 0.45 - unit * 0.3, 0.04]}
          color="#232826"
          metalness={0.7}
          roughness={0.4}
        />
      ))}
      <instancedMesh ref={ports} args={[undefined, undefined, count]}>
        <boxGeometry args={[0.05, 0.04, 0.01]} />
        <meshStandardMaterial color="#050605" />
      </instancedMesh>
      <instancedMesh ref={leds} args={[undefined, undefined, count]}>
        <boxGeometry args={[0.012, 0.008, 0.004]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      {patches.map((curve, index) => (
        <mesh key={index}>
          <tubeGeometry args={[curve, 12, 0.006, 5, false]} />
          <meshStandardMaterial
            color={["#ffb000", "#4dff88", "#33ff66"][index % 3]}
            roughness={0.5}
          />
        </mesh>
      ))}
    </At>
  );
}

/** The second workbench: oscilloscope, soldering station, an opened server. */
function Workbench() {
  const scope = useCanvasTexture(scopeTexture);
  const iron = useCanvasTexture(() => statusTexture("350°C", "#ff3b3b"));
  return (
    <At placement={LAB.workbench}>
      <Block
        size={[1.7, 0.05, 0.78]}
        position={[0, 0.86, 0.4]}
        color="#3b3f3c"
        metalness={0.6}
        roughness={0.5}
      />
      {[-0.8, 0.8].flatMap((x) =>
        [0.06, 0.74].map((z) => (
          <Block
            key={`${x}${z}`}
            size={[0.05, 0.84, 0.05]}
            position={[x, 0.42, z]}
            color={DARK}
          />
        )),
      )}
      <Block size={[1.6, 0.03, 0.6]} position={[0, 0.2, 0.4]} color={DARK} />
      <group position={[-0.5, 0.885, 0.3]}>
        <Block
          size={[0.42, 0.27, 0.32]}
          position={[0, 0.135, 0]}
          color="#c8ccc7"
          metalness={0.4}
          roughness={0.5}
        />
        <Glow
          map={scope}
          size={[0.22, 0.16]}
          position={[-0.06, 0.15, 0.161]}
          glow={1.6}
        />
        {[0, 1, 2].map((knob) => (
          <mesh
            key={knob}
            position={[0.13, 0.22 - knob * 0.06, 0.165]}
            rotation-x={Math.PI / 2}
          >
            <cylinderGeometry args={[0.015, 0.015, 0.02, 12]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
        ))}
      </group>
      <group position={[0.1, 0.885, 0.55]}>
        <Block
          size={[0.22, 0.1, 0.16]}
          position={[0, 0.05, 0]}
          color="#2c2f2e"
        />
        <Glow
          map={iron}
          size={[0.1, 0.025]}
          position={[0, 0.07, 0.081]}
          glow={2}
        />
        <mesh position={[0.2, 0.08, 0]} rotation-z={0.6}>
          <cylinderGeometry args={[0.03, 0.02, 0.14, 12, 1, true]} />
          <meshStandardMaterial
            color="#8a8f8b"
            metalness={0.9}
            roughness={0.3}
            side={DoubleSide}
          />
        </mesh>
      </group>
      <group position={[0.45, 0.885, 0.3]} rotation-y={-0.2}>
        <Block
          size={[0.6, 0.09, 0.45]}
          position={[0, 0.045, 0]}
          color="#1b1f1d"
          metalness={0.7}
          roughness={0.4}
        />
        <Glow
          color="#0b4f24"
          size={[0.54, 0.4]}
          position={[0, 0.092, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          glow={0.7}
        />
        {Array.from({ length: 6 }, (_, stick) => (
          <Block
            key={stick}
            size={[0.012, 0.03, 0.14]}
            position={[-0.12 + stick * 0.025, 0.1, -0.05]}
            color="#1d3b5c"
          />
        ))}
        <Block
          size={[0.6, 0.01, 0.45]}
          position={[0, 0.24, -0.2]}
          rotation={[-1.1, 0, 0]}
          color="#2a2f2d"
          metalness={0.7}
        />
      </group>
      <pointLight
        position={[0, 1.6, 0.5]}
        intensity={1.6}
        distance={2.2}
        color="#fff1d6"
      />
    </At>
  );
}

/** Rack-02, half assembled, with a module still lying on the floor. */
function RackTwo() {
  const stripes = useCanvasTexture(hazardStripesTexture);
  const height = 2.1;
  return (
    <At placement={LAB.rack02}>
      {[-0.5, 0.5].flatMap((x) =>
        [-0.45, 0.45].map((z) => (
          <Block
            key={`${x}${z}`}
            size={[0.05, height, 0.05]}
            position={[x, height / 2, z]}
            color="#1a1e1c"
            metalness={0.8}
            roughness={0.4}
          />
        )),
      )}
      {[0.06, height - 0.03].map((y) => (
        <Block
          key={y}
          size={[1.05, 0.05, 0.95]}
          position={[0, y, 0]}
          color="#1a1e1c"
          metalness={0.8}
          roughness={0.4}
        />
      ))}
      {[0.25, 0.4, 0.62].map((y, index) => (
        <group key={y} position={[0, y, 0]}>
          <Block
            size={[0.9, index === 2 ? 0.2 : 0.12, 0.8]}
            color="#0d1110"
            metalness={0.7}
            roughness={0.5}
          />
          <Glow
            color="#33ff66"
            size={[0.02, 0.02]}
            position={[0.36, 0, 0.402]}
            glow={3}
          />
        </group>
      ))}
      <Block
        size={[0.9, 0.12, 0.7]}
        position={[0.95, 0.06, 0.6]}
        rotation={[0, 0.5, 0]}
        color="#0d1110"
        metalness={0.7}
        roughness={0.5}
      />
      <mesh position={[0, 0.003, 0.75]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[1.2, 0.12]} />
        <meshStandardMaterial map={stripes} roughness={0.8} />
      </mesh>
    </At>
  );
}

/** A pallet with shrink-wrapped boxes of new hardware. */
function Pallets() {
  return (
    <At placement={LAB.pallets}>
      {[-0.45, 0, 0.45].map((z) => (
        <Block
          key={z}
          size={[1.2, 0.1, 0.1]}
          position={[0, 0.05, z]}
          color="#7a5a3a"
          metalness={0}
          roughness={0.9}
        />
      ))}
      {Array.from({ length: 7 }, (_, slat) => (
        <Block
          key={slat}
          size={[0.12, 0.025, 1]}
          position={[-0.54 + slat * 0.18, 0.112, 0]}
          color="#8b6a46"
          metalness={0}
          roughness={0.9}
        />
      ))}
      {[
        [-0.28, 0.27, -0.2, 0.5],
        [0.28, 0.27, -0.2, 0.5],
        [0, 0.27, 0.27, 0.42],
        [-0.05, 0.62, -0.1, 0.36],
      ].map(([x, y, z, size]) => (
        <group key={`${x}${y}${z}`}>
          <Block
            size={[size, size * 0.62, size]}
            position={[x, y, z]}
            color="#a88a62"
            metalness={0}
            roughness={0.85}
          />
          <mesh position={[x, y, z]}>
            <boxGeometry
              args={[size + 0.01, size * 0.62 + 0.01, size + 0.01]}
            />
            <meshStandardMaterial
              color="#ffffff"
              transparent
              opacity={0.12}
              roughness={0.15}
            />
          </mesh>
        </group>
      ))}
    </At>
  );
}

/** Plants gone wild in the corner: a pot of leaves and vines on the wall. */
function Plants() {
  const leaves = useRef<InstancedMesh>(null);
  const count = 46;
  useLayoutEffect(() => {
    const dummy = new Object3D();
    for (let index = 0; index < count; index++) {
      const angle = index * 2.399;
      const height = 0.45 + (index % 9) * 0.09;
      dummy.position.set(
        Math.cos(angle) * 0.18,
        height,
        Math.sin(angle) * 0.18,
      );
      dummy.rotation.set(0.9 - (index % 5) * 0.12, -angle, 0);
      dummy.scale.setScalar(0.8 + (index % 4) * 0.15);
      dummy.updateMatrix();
      leaves.current?.setMatrixAt(index, dummy.matrix);
    }
    if (leaves.current) {
      leaves.current.instanceMatrix.needsUpdate = true;
    }
  });
  const vines = useMemo(
    () =>
      [0, 1, 2].map(
        (vine) =>
          new CatmullRomCurve3([
            new Vector3(0.45, 2.6 - vine * 0.2, -0.2 + vine * 0.2),
            new Vector3(0.5, 1.9 - vine * 0.1, 0.1 + vine * 0.1),
            new Vector3(0.48, 1.2, -0.1 + vine * 0.25),
            new Vector3(0.3, 0.7, 0.05),
          ]),
      ),
    [],
  );
  return (
    <At placement={LAB.plants}>
      <mesh position-y={0.22}>
        <cylinderGeometry args={[0.24, 0.18, 0.44, 24]} />
        <meshStandardMaterial color="#3a2e28" roughness={0.9} />
      </mesh>
      <instancedMesh ref={leaves} args={[undefined, undefined, count]}>
        <planeGeometry args={[0.12, 0.42]} />
        <meshStandardMaterial
          color="#1f6b35"
          roughness={0.6}
          side={DoubleSide}
        />
      </instancedMesh>
      {vines.map((curve, index) => (
        <mesh key={index}>
          <tubeGeometry args={[curve, 20, 0.01, 5, false]} />
          <meshStandardMaterial color="#1a5a2c" roughness={0.7} />
        </mesh>
      ))}
    </At>
  );
}

/** Everything along the right wall of the lab. */
export function RightWall() {
  return (
    <group>
      <Ups />
      <WallFan />
      <SwitchWall />
      <Workbench />
      <RackTwo />
      <Pallets />
      <Plants />
    </group>
  );
}
