import {
  useEffect,
  useState,
  type Dispatch,
  type KeyboardEvent,
  type Ref,
  type SetStateAction,
} from "react";
import { LAUNCHERS, windowTitle } from "../../desktop/apps";
import {
  closeWindow,
  cycleFocus,
  focusWindow,
  minimizeWindow,
  moveWindow,
  openWindow,
  topWindow,
  toggleMaximize,
  type AppId,
  type Bounds,
  type Desk,
} from "../../desktop/windows";
import type { TopState } from "../../terminal/processes";
import { useElapsed } from "../useElapsed";
import { AppContent } from "./AppContent";
import { AppWindow } from "./AppWindow";
import { PixelIcon } from "./PixelIcon";

const TASKBAR = 30;

/** Props of {@link Desktop}. */
export interface DesktopProps {
  desk: Desk;
  setDesk: Dispatch<SetStateAction<Desk>>;
  /** The terminal is minimized and waits in the taskbar. */
  terminalMinimized: boolean;
  onOpenTerminal: () => void;
  /** Runs a terminal command, e.g. `open <project>`. */
  onRun: (command: string) => void;
  /** Stands the visitor up from the desk; absent where there is no desk. */
  onStandUp?: () => void;
  /** Gets the Terminal icon, which takes the focus when the desktop shows. */
  focusRef?: Ref<HTMLButtonElement>;
  /** Projects show their screen in the window; else the page shows it. */
  inlineProjectScreens: boolean;
  processes: Omit<TopState, "now">;
}

/** The size of the desktop area above the taskbar. */
function useBounds(element: HTMLElement | null): Bounds {
  const [bounds, setBounds] = useState<Bounds>({ width: 640, height: 400 });
  useEffect(() => {
    if (element === null || typeof ResizeObserver === "undefined") {
      return;
    }
    const observer = new ResizeObserver(([entry]) =>
      setBounds({
        width: entry.contentRect.width,
        height: entry.contentRect.height - TASKBAR,
      }),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);
  return bounds;
}

const clock = (date: Date) =>
  [date.getHours(), date.getMinutes()]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");

/**
 * The desktop of TheoCloud OS, shown on the CRT when the terminal is closed
 * or minimized: a dithered phosphor wallpaper, icons for the apps, windows
 * that can be dragged, focused, minimized, maximized and closed, and a
 * taskbar with a start menu, the open windows, the clock and a button to
 * stand up from the desk. Alt+` (and Alt+Tab where the system lets it
 * through) cycles the windows, Escape closes the menu.
 */
export function Desktop({
  desk,
  setDesk,
  terminalMinimized,
  onOpenTerminal,
  onRun,
  onStandUp,
  focusRef,
  inlineProjectScreens,
  processes,
}: DesktopProps) {
  const [area, setArea] = useState<HTMLElement | null>(null);
  const [menu, setMenu] = useState(false);
  const bounds = useBounds(area);
  useElapsed(30000);
  const top = topWindow(desk);
  const open = (app: AppId | "terminal", payload?: string) => {
    setMenu(false);
    if (app === "terminal") {
      onOpenTerminal();
    } else {
      setDesk((current) => openWindow(current, app, bounds, payload));
    }
  };
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.altKey && (event.key === "Tab" || event.code === "Backquote")) {
      event.preventDefault();
      setDesk(cycleFocus);
    } else if (event.key === "Escape" && menu) {
      event.preventDefault();
      event.stopPropagation();
      setMenu(false);
    }
  };
  return (
    <section
      ref={setArea}
      aria-label="desktop"
      className="desk"
      onKeyDown={onKeyDown}
    >
      <ul className="desk-icons" aria-label="apps">
        {LAUNCHERS.map((launcher) => (
          <li key={launcher.app}>
            <button
              ref={launcher.app === "terminal" ? focusRef : undefined}
              type="button"
              className="desk-icon"
              onClick={() => open(launcher.app)}
            >
              <PixelIcon name={launcher.icon} />
              <span>{launcher.label}</span>
            </button>
          </li>
        ))}
      </ul>
      {desk.windows.map((window) => (
        <AppWindow
          key={window.id}
          window={window}
          title={windowTitle(window.app, window.payload)}
          focused={window.id === top?.id}
          onFocus={() => {
            if (window.id !== top?.id) {
              setDesk((current) => focusWindow(current, window.id));
            }
          }}
          onMove={(dx, dy) =>
            setDesk((current) => moveWindow(current, window.id, dx, dy, bounds))
          }
          onMinimize={() =>
            setDesk((current) => minimizeWindow(current, window.id))
          }
          onToggleMaximize={() =>
            setDesk((current) => toggleMaximize(current, window.id))
          }
          onClose={() => setDesk((current) => closeWindow(current, window.id))}
        >
          <AppContent
            app={window.app}
            payload={window.payload}
            onRun={onRun}
            onOpen={open}
            inlineProjectScreens={inlineProjectScreens}
            onClose={() =>
              setDesk((current) => closeWindow(current, window.id))
            }
            processes={processes}
          />
        </AppWindow>
      ))}
      {menu ? (
        <nav className="desk-menu" aria-label="start menu">
          {LAUNCHERS.map((launcher) => (
            <button
              key={launcher.app}
              type="button"
              onClick={() => open(launcher.app)}
            >
              <PixelIcon name={launcher.icon} />
              {launcher.label}
            </button>
          ))}
          {onStandUp ? (
            <button
              type="button"
              onClick={() => {
                setMenu(false);
                onStandUp();
              }}
            >
              <PixelIcon name="stand" />
              Stand up
            </button>
          ) : null}
        </nav>
      ) : null}
      <footer className="desk-taskbar">
        <button
          type="button"
          className="desk-start"
          aria-expanded={menu}
          onClick={() => setMenu((shown) => !shown)}
        >
          TheoCloud
        </button>
        <span className="desk-tasks">
          {terminalMinimized ? (
            <button type="button" onClick={onOpenTerminal}>
              terminal
            </button>
          ) : null}
          {desk.windows.map((window) => (
            <button
              key={window.id}
              type="button"
              aria-pressed={window.id === top?.id}
              onClick={() =>
                setDesk((current) =>
                  window.id === top?.id
                    ? minimizeWindow(current, window.id)
                    : focusWindow(current, window.id),
                )
              }
            >
              {windowTitle(window.app, window.payload)}
            </button>
          ))}
        </span>
        <span className="desk-tray">
          {onStandUp ? (
            <button
              type="button"
              className="desk-stand"
              aria-label="stand up from the desk"
              onClick={onStandUp}
            >
              <PixelIcon name="stand" />
            </button>
          ) : null}
          <span className="crt-led" aria-hidden="true" />
          <time>{clock(new Date())}</time>
        </span>
      </footer>
    </section>
  );
}
