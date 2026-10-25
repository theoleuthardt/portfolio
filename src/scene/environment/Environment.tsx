import { Baked } from "../bake/Baked";
import { Ceiling } from "./Ceiling";
import { Floor } from "./Floor";
import { Overhead } from "./Overhead";
import { Partition } from "./Partition";
import { Walls } from "./Walls";

/**
 * The Night City lab around the rack: the reflective floor, and the baked
 * ceiling, walls, partition and overhead runs.
 */
export function LabEnvironment() {
  return (
    <group>
      <Floor />
      <Baked>
        <Ceiling />
        <Walls />
        <Partition />
        <Overhead />
      </Baked>
    </group>
  );
}
