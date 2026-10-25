import { matrixFrame } from "../terminal/matrix";
import { ProgramScreen } from "./ProgramScreen";
import { useElapsed } from "./useElapsed";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

const COLUMNS = 48;
const ROWS = 16;

/** Props of {@link Matrix}. */
export interface MatrixProps {
  onQuit: () => void;
}

/** The digital rain of `matrix` (one still frame with reduced motion). */
export function Matrix({ onQuit }: MatrixProps) {
  const reducedMotion = usePrefersReducedMotion();
  const elapsed = useElapsed(80, reducedMotion);
  return (
    <ProgramScreen columns={48} label="matrix" onQuit={onQuit}>
      <pre aria-hidden="true">
        {matrixFrame(COLUMNS, ROWS, elapsed + 2000).join("\n")}
      </pre>
      <p className="text-phosphor-dim">wake up, guest. press q to quit</p>
    </ProgramScreen>
  );
}
