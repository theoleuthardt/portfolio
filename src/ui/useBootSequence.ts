import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

/** Delay between two boot steps. */
export const BOOT_STEP_MS = 600;

/** How long the full progress bar stays on the splash before it glides up. */
export const BOOT_HOLD_MS = 800;

/** How long the boot splash takes to glide up to the top. */
export const BOOT_GLIDE_MS = 900;

/** How long the static splash stays visible with reduced motion. */
export const BOOT_REDUCED_HOLD_MS = 1200;

/**
 * Number of boot steps reached. Counts up one step at a time, on every visit;
 * jumps as far as allowed at once with reduced motion and after any key press
 * or pointer press. While `hold` is set the count stops one step before the
 * end for everyone, so the last step reflects the real loading of the 3D
 * scene. Once complete, the boot stays complete.
 */
export function useBootSequence(total: number, hold = false): number {
  const reducedMotion = usePrefersReducedMotion();
  const [visible, setVisible] = useState(() => (reducedMotion ? total : 1));
  const done = visible >= total;

  useEffect(() => {
    if (done) {
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

/** Where the boot is: centred splash, gliding up, or done with a prompt. */
export type BootPhase = "splash" | "glide" | "ready";

type AfterBoot = "hold" | "glide" | "ready";

/**
 * Boot phase on top of {@link useBootSequence}. The splash stays while
 * booting and for {@link BOOT_HOLD_MS} with the full bar, then glides up for
 * {@link BOOT_GLIDE_MS}. With reduced motion the static splash stays for
 * {@link BOOT_REDUCED_HOLD_MS} and the prompt follows without a glide. A key
 * press or click skips straight to `ready` once the boot is complete.
 */
export function useBootPhase(booted: boolean): BootPhase {
  const reducedMotion = usePrefersReducedMotion();
  const [stage, setStage] = useState<AfterBoot>("hold");
  const [skipped, setSkipped] = useState(false);
  useEffect(() => {
    if (skipped || stage === "ready") {
      return;
    }
    const skip = () => setSkipped(true);
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip);
    return () => {
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
  }, [skipped, stage]);
  useEffect(() => {
    if (!booted || stage === "ready" || skipped) {
      return;
    }
    const [delay, next]: [number, AfterBoot] = reducedMotion
      ? [BOOT_REDUCED_HOLD_MS, "ready"]
      : stage === "hold"
        ? [BOOT_HOLD_MS, "glide"]
        : [BOOT_GLIDE_MS, "ready"];
    const timer = window.setTimeout(() => setStage(next), delay);
    return () => window.clearTimeout(timer);
  }, [booted, stage, reducedMotion, skipped]);
  if (!booted) {
    return "splash";
  }
  if (skipped) {
    return "ready";
  }
  return stage === "hold" ? "splash" : stage;
}
