import { useRef, type PointerEvent, type ReactNode } from "react";
import type { DesktopWindow } from "../../desktop/windows";

/** Props of {@link AppWindow}. */
export interface AppWindowProps {
  window: DesktopWindow;
  title: string;
  focused: boolean;
  onFocus: () => void;
  onMove: (dx: number, dy: number) => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onClose: () => void;
  children: ReactNode;
}

/**
 * A desktop window: a title bar to drag it by (and to focus it), minimize,
 * maximize and close keys, and the app inside.
 */
export function AppWindow({
  window,
  title,
  focused,
  onFocus,
  onMove,
  onMinimize,
  onToggleMaximize,
  onClose,
  children,
}: AppWindowProps) {
  const dragging = useRef<{ x: number; y: number } | undefined>(undefined);
  const grab = (event: PointerEvent<HTMLDivElement>) => {
    if (event.target instanceof Element && event.target.closest("button")) {
      return;
    }
    dragging.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const drag = (event: PointerEvent<HTMLDivElement>) => {
    if (dragging.current === undefined || window.maximized) {
      return;
    }
    onMove(
      event.clientX - dragging.current.x,
      event.clientY - dragging.current.y,
    );
    dragging.current = { x: event.clientX, y: event.clientY };
  };
  const drop = () => {
    dragging.current = undefined;
  };
  return (
    <section
      aria-label={title}
      className={focused ? "desk-window desk-window-focused" : "desk-window"}
      style={
        window.maximized
          ? undefined
          : {
              left: window.x,
              top: window.y,
              width: window.width,
              height: window.height,
            }
      }
      data-maximized={window.maximized || undefined}
      hidden={window.minimized}
      onPointerDown={onFocus}
      onFocus={onFocus}
    >
      <div
        className="desk-titlebar"
        onPointerDown={grab}
        onPointerMove={drag}
        onPointerUp={drop}
        onPointerCancel={drop}
        onLostPointerCapture={drop}
        onDoubleClick={onToggleMaximize}
      >
        <span className="desk-title">{title}</span>
        <span className="desk-keys">
          <button
            type="button"
            aria-label={`minimize ${title}`}
            onClick={onMinimize}
          >
            _
          </button>
          <button
            type="button"
            aria-label={`maximize ${title}`}
            aria-pressed={window.maximized}
            onClick={onToggleMaximize}
          >
            □
          </button>
          <button type="button" aria-label={`close ${title}`} onClick={onClose}>
            ×
          </button>
        </span>
      </div>
      <div className="desk-content">{children}</div>
    </section>
  );
}
