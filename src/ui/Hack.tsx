import { useEffect, useEffectEvent } from "react";
import { HACK_ABORT, hackFrame, hackSummary } from "../terminal/hack";
import { ProgramScreen } from "./ProgramScreen";
import { useElapsed } from "./useElapsed";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

/** Props of {@link Hack}. */
export interface HackProps {
  target: string;
  /** Called with what the hack leaves in the log when it ends or aborts. */
  onExit: (lines: { text: string; muted: boolean }[]) => void;
}

/**
 * The cinematic fake intrusion of `hack <target>`: plays its phases (calm
 * checklists with reduced motion), then leaves the ending in the log; q,
 * Escape or Ctrl+C abort with a reset connection.
 */
export function Hack({ target, onExit }: HackProps) {
  const reducedMotion = usePrefersReducedMotion();
  const elapsed = useElapsed(reducedMotion ? 250 : 60);
  const frame = hackFrame(target, elapsed, reducedMotion);
  const finish = useEffectEvent(() =>
    onExit(hackSummary(target).map((text) => ({ text, muted: false }))),
  );
  useEffect(() => {
    if (frame.done) {
      finish();
    }
  }, [frame.done]);
  return (
    <ProgramScreen
      columns={50}
      label="hack"
      flash={frame.flash}
      onQuit={() => onExit(HACK_ABORT.map((text) => ({ text, muted: true })))}
    >
      <pre>{frame.lines.join("\n")}</pre>
    </ProgramScreen>
  );
}
