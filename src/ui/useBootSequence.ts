import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

/** Delay between two boot lines. */
export const BOOT_STEP_MS = 350;

/** Session storage key that marks the boot sequence as seen. */
export const BOOTED_KEY = "theocloud.booted";

function alreadyBooted(): boolean {
  return sessionStorage.getItem(BOOTED_KEY) === "1";
}

/**
 * Number of boot lines to show. Counts up one line per step on the first
 * visit of a session; shows everything at once with reduced motion, for
 * returning visitors and after any key press or pointer press.
 */
export function useBootSequence(total: number): number {
  const reducedMotion = usePrefersReducedMotion();
  const [visible, setVisible] = useState(() =>
    reducedMotion || alreadyBooted() ? total : 1,
  );
  const done = visible >= total;

  useEffect(() => {
    if (done) {
      sessionStorage.setItem(BOOTED_KEY, "1");
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
  }, [done, total]);

  return reducedMotion ? total : visible;
}
