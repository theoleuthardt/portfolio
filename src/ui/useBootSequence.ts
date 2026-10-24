import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

/** Delay between two boot steps. */
export const BOOT_STEP_MS = 420;

/** Session storage key that marks the boot sequence as seen. */
export const BOOTED_KEY = "theocloud.booted";

function alreadyBooted(): boolean {
  try {
    return sessionStorage.getItem(BOOTED_KEY) === "1";
  } catch {
    return false;
  }
}

function markBooted(): void {
  try {
    sessionStorage.setItem(BOOTED_KEY, "1");
  } catch {
    return;
  }
}

/**
 * Number of boot steps reached. Counts up one step at a time on the first
 * visit of a session; shows everything at once with reduced motion, for
 * returning visitors and after any key press or pointer press. When the
 * browser blocks session storage, every visit counts as the first one.
 * While `hold` is set the count stops one step before the end, so the last
 * step waits for the 3D scene. Once complete, the boot stays complete.
 */
export function useBootSequence(total: number, hold = false): number {
  const reducedMotion = usePrefersReducedMotion();
  const [visible, setVisible] = useState(() =>
    reducedMotion || alreadyBooted() ? total : 1,
  );
  const done = visible >= total;

  useEffect(() => {
    if (done) {
      if (!hold) {
        markBooted();
      }
      return;
    }
    const skip = () => setVisible(total);
    const timer = window.setInterval(
      () => setVisible((count) => Math.min(total, count + 1)),
      BOOT_STEP_MS,
    );
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
  }, [done, hold, total]);

  const reached = reducedMotion ? total : visible;
  const [finished, setFinished] = useState(false);
  if (!finished && !hold && reached >= total) {
    setFinished(true);
  }
  if (finished) {
    return total;
  }
  return hold ? Math.min(reached, total - 1) : reached;
}
