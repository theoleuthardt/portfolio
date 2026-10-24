import { LeftWall } from "./LeftWall";
import { Life } from "./Life";
import { Overhead } from "./Overhead";
import { RightWall } from "./RightWall";

/** Props of {@link Lab}. */
export interface LabProps {
  openProjectId?: string;
}

/**
 * The lab's build-out, a lazy chunk of its own loaded after the props: the
 * objects along the walls, the cable trays and cabling, and the small life.
 */
export default function Lab({ openProjectId }: LabProps) {
  return (
    <group>
      <LeftWall />
      <RightWall />
      <Overhead />
      <Life open={openProjectId !== undefined} />
    </group>
  );
}
