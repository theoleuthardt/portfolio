import { useEffect, useState } from "react";

/**
 * Milliseconds since the component mounted, updated every `interval`
 * milliseconds; frozen at 0 while `paused`.
 */
export function useElapsed(interval: number, paused = false): number {
  const [start] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (paused) {
      return;
    }
    const timer = window.setInterval(
      () => setElapsed(Date.now() - start),
      interval,
    );
    return () => window.clearInterval(timer);
  }, [interval, paused, start]);
  return paused ? 0 : elapsed;
}
