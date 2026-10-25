import { topScreen, type TopState } from "../terminal/processes";
import { ProgramScreen } from "./ProgramScreen";
import { useElapsed } from "./useElapsed";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

/** Props of {@link Top}. */
export interface TopProps {
  state: Omit<TopState, "now">;
  onQuit: () => void;
}

const REFRESH_MS = 1000;
const HEADER_LINES = 6;

/**
 * The live process view of `top`: refreshes every second (one still
 * snapshot with reduced motion) and quits with q, Escape or Ctrl+C.
 */
export function Top({ state, onQuit }: TopProps) {
  const reducedMotion = usePrefersReducedMotion();
  useElapsed(REFRESH_MS, reducedMotion);
  const lines = topScreen({ ...state, now: new Date() });
  return (
    <ProgramScreen columns={92} label="top" onQuit={onQuit}>
      <pre>{lines.slice(0, HEADER_LINES).join("\n")}</pre>
      <pre className="crt-top-header">{lines[HEADER_LINES]}</pre>
      <pre>{lines.slice(HEADER_LINES + 1).join("\n")}</pre>
      <p className="text-phosphor-dim">press q to quit</p>
    </ProgramScreen>
  );
}
