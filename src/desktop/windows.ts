/** The apps of the desktop. */
export type AppId =
  "projects" | "about" | "map" | "processes" | "notes" | "viewer" | "trash";

/** A window on the desktop, in pixels of the desktop area. */
export interface DesktopWindow {
  id: string;
  app: AppId;
  /** What the window shows, e.g. the file of a viewer. */
  payload?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minimized: boolean;
  maximized: boolean;
}

/** The desktop's windows, bottom to top. */
export interface Desk {
  windows: readonly DesktopWindow[];
  nextId: number;
}

/** The size of the desktop area. */
export interface Bounds {
  width: number;
  height: number;
}

/** A desktop without windows. */
export const emptyDesk: Desk = { windows: [], nextId: 1 };

const SMALL_SCREEN = 400;
const CASCADE = 24;
const TITLE_BAR = 22;

const update = (
  desk: Desk,
  id: string,
  change: (window: DesktopWindow) => DesktopWindow,
): Desk => ({
  ...desk,
  windows: desk.windows.map((window) =>
    window.id === id ? change(window) : window,
  ),
});

/** The window on top that is not minimized, if any. */
export function topWindow(desk: Desk): DesktopWindow | undefined {
  return [...desk.windows].reverse().find((window) => !window.minimized);
}

/** Raises a window to the top and restores it if it was minimized. */
export function focusWindow(desk: Desk, id: string): Desk {
  const window = desk.windows.find((candidate) => candidate.id === id);
  if (window === undefined) {
    return desk;
  }
  return {
    ...desk,
    windows: [
      ...desk.windows.filter((candidate) => candidate.id !== id),
      { ...window, minimized: false },
    ],
  };
}

/**
 * Opens `app` (with `payload` for apps that show something specific): an
 * app that is already open with the same payload comes to the front, any
 * other opens in a new window cascaded from the top one; on small screens
 * windows open maximized.
 */
export function openWindow(
  desk: Desk,
  app: AppId,
  bounds: Bounds,
  payload?: string,
): Desk {
  const open = desk.windows.find(
    (window) => window.app === app && window.payload === payload,
  );
  if (open) {
    return focusWindow(desk, open.id);
  }
  const width = Math.min(Math.round(bounds.width * 0.8), 560);
  const height = Math.min(Math.round(bounds.height * 0.8), 380);
  const offset = (desk.windows.length % 6) * CASCADE;
  const window: DesktopWindow = {
    id: `window-${desk.nextId}`,
    app,
    ...(payload === undefined ? {} : { payload }),
    x: Math.min(32 + offset, Math.max(0, bounds.width - width)),
    y: Math.min(16 + offset, Math.max(0, bounds.height - height)),
    width,
    height,
    minimized: false,
    maximized: bounds.width < SMALL_SCREEN,
  };
  return { windows: [...desk.windows, window], nextId: desk.nextId + 1 };
}

/** Closes a window; the next one below gets the focus. */
export function closeWindow(desk: Desk, id: string): Desk {
  return {
    ...desk,
    windows: desk.windows.filter((window) => window.id !== id),
  };
}

/** Minimizes a window to the taskbar. */
export function minimizeWindow(desk: Desk, id: string): Desk {
  return update(desk, id, (window) => ({ ...window, minimized: true }));
}

/** Maximizes a window, or restores its size if it is maximized. */
export function toggleMaximize(desk: Desk, id: string): Desk {
  return update(desk, id, (window) => ({
    ...window,
    maximized: !window.maximized,
  }));
}

/**
 * Moves a window by `dx`/`dy`, keeping its title bar on the screen so it
 * can always be grabbed again.
 */
export function moveWindow(
  desk: Desk,
  id: string,
  dx: number,
  dy: number,
  bounds: Bounds,
): Desk {
  return update(desk, id, (window) => ({
    ...window,
    x: Math.min(
      bounds.width - TITLE_BAR * 2,
      Math.max(TITLE_BAR * 2 - window.width, window.x + dx),
    ),
    y: Math.min(bounds.height - TITLE_BAR, Math.max(0, window.y + dy)),
  }));
}

/** Alt+Tab: the bottom window that is not minimized comes to the top. */
export function cycleFocus(desk: Desk): Desk {
  const visible = desk.windows.filter((window) => !window.minimized);
  return visible.length < 2 ? desk : focusWindow(desk, visible[0].id);
}
