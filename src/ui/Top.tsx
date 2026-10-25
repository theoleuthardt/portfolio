import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { topScreen, type TopState } from "../terminal/processes";
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
 * snapshot with reduced motion) and quits with q, Escape or Ctrl+C. It takes
 * the focus while it runs, like a full-screen program in a real terminal.
 */
export function Top({ state, onQuit }: TopProps) {
  const reducedMotion = usePrefersReducedMotion();
  const [now, setNow] = useState(() => new Date());
  const view = useRef<HTMLElement>(null);
  useEffect(() => {
    view.current?.focus();
  }, []);
  useEffect(() => {
    if (reducedMotion) {
      return;
    }
    const timer = window.setInterval(() => setNow(new Date()), REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [reducedMotion]);
  const lines = topScreen({ ...state, now });
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const key = event.key.toLowerCase();
    if (key === "q" || key === "escape" || (event.ctrlKey && key === "c")) {
      event.preventDefault();
      event.stopPropagation();
      onQuit();
    }
  };
  return (
    <section
      ref={view}
      tabIndex={0}
      aria-label="top"
      className="crt-top"
      onKeyDown={onKeyDown}
    >
      <pre>{lines.slice(0, HEADER_LINES).join("\n")}</pre>
      <pre className="crt-top-header">{lines[HEADER_LINES]}</pre>
      <pre>{lines.slice(HEADER_LINES + 1).join("\n")}</pre>
      <p className="text-phosphor-dim">press q to quit</p>
    </section>
  );
}
