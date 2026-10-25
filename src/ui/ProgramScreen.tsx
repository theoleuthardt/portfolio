import {
  useEffect,
  useRef,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";

/** Props of {@link ProgramScreen}. */
export interface ProgramScreenProps {
  /** Accessible name of the program, e.g. `top`. */
  label: string;
  onQuit: () => void;
  /** Keys the program handles itself; return true if handled. */
  onKey?: (event: KeyboardEvent<HTMLElement>) => boolean;
  /** Flash the screen, e.g. for a glitch. */
  flash?: boolean;
  /** Width of the program's text in columns; the font scales to fit it. */
  columns: number;
  children: ReactNode;
}

/**
 * The screen of a full-screen terminal program: takes the focus while it
 * runs and quits with q, Escape or Ctrl+C unless the program handles the
 * key itself.
 */
export function ProgramScreen({
  label,
  onQuit,
  onKey,
  flash = false,
  columns,
  children,
}: ProgramScreenProps) {
  const view = useRef<HTMLElement>(null);
  useEffect(() => {
    view.current?.focus();
  }, []);
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (onKey?.(event)) {
      event.preventDefault();
      return;
    }
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
      aria-label={label}
      className={flash ? "crt-top crt-flash" : "crt-top"}
      style={{ "--columns": columns } as CSSProperties}
      onKeyDown={onKeyDown}
    >
      {children}
    </section>
  );
}
