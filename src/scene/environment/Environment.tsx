import { Ceiling } from "./Ceiling";
import { Floor } from "./Floor";
import { Overhead } from "./Overhead";
import { Partition } from "./Partition";
import { Walls } from "./Walls";

/** The Night City lab around the rack: floor, ceiling, walls, partition, overhead runs. */
export function LabEnvironment() {
  return (
    <group>
      <Floor />
      <Ceiling />
      <Walls />
      <Partition />
      <Overhead />
    </group>
  );
}
