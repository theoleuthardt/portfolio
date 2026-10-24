import { ROOM } from "../layout";
import { glow, palette } from "./palette";

const HEIGHT = 2.6;
const WIDTH = 5;

/** A glass partition on the left with a glowing frame. */
export function Partition() {
  const y = ROOM.floor + HEIGHT / 2;
  return (
    <group position={[-3.2, y, -9]} rotation-y={Math.PI / 2}>
      <mesh>
        <planeGeometry args={[WIDTH, HEIGHT]} />
        <meshStandardMaterial
          color={palette.neon}
          transparent
          opacity={0.08}
          roughness={0.05}
          metalness={0.3}
          depthWrite={false}
        />
      </mesh>
      {[-WIDTH / 2, WIDTH / 2].map((x) => (
        <mesh key={x} position-x={x}>
          <boxGeometry args={[0.06, HEIGHT, 0.06]} />
          <meshStandardMaterial
            color={palette.metal}
            metalness={0.8}
            roughness={0.3}
          />
        </mesh>
      ))}
      <mesh position-y={HEIGHT / 2}>
        <boxGeometry args={[WIDTH, 0.03, 0.03]} />
        <meshBasicMaterial color={glow(palette.neon, 2.5)} toneMapped={false} />
      </mesh>
    </group>
  );
}
