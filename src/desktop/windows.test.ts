import { describe, expect, it } from "vitest";
import {
  closeWindow,
  cycleFocus,
  emptyDesk,
  focusWindow,
  minimizeWindow,
  moveWindow,
  openWindow,
  topWindow,
  toggleMaximize,
  type Bounds,
} from "./windows";

const bounds: Bounds = { width: 640, height: 400 };

describe("openWindow", () => {
  it("opens an app in a new window on top, cascaded from the last one", () => {
    const one = openWindow(emptyDesk, "projects", bounds);
    const two = openWindow(one, "map", bounds);
    expect(two.windows.map((window) => window.app)).toEqual([
      "projects",
      "map",
    ]);
    expect(topWindow(two)?.app).toBe("map");
    expect(two.windows[1].x).toBeGreaterThan(two.windows[0].x);
    expect(two.windows[1].y).toBeGreaterThan(two.windows[0].y);
  });

  it("brings an app that is already open to the front instead of opening it twice", () => {
    let desk = openWindow(emptyDesk, "projects", bounds);
    desk = openWindow(desk, "map", bounds);
    desk = minimizeWindow(desk, desk.windows[0].id);
    desk = openWindow(desk, "projects", bounds);
    expect(desk.windows).toHaveLength(2);
    expect(topWindow(desk)?.app).toBe("projects");
    expect(topWindow(desk)?.minimized).toBe(false);
  });

  it("opens a viewer per file", () => {
    let desk = openWindow(emptyDesk, "viewer", bounds, "~/todo.txt");
    desk = openWindow(desk, "viewer", bounds, "~/notes/ideas.txt");
    desk = openWindow(desk, "viewer", bounds, "~/todo.txt");
    expect(desk.windows.map((window) => window.payload)).toEqual([
      "~/notes/ideas.txt",
      "~/todo.txt",
    ]);
  });

  it("opens windows maximized on small screens", () => {
    const desk = openWindow(emptyDesk, "projects", { width: 360, height: 600 });
    expect(desk.windows[0].maximized).toBe(true);
  });

  it("opens real windows on the screen at the desk, inside the desktop", () => {
    const screen = { width: 428, height: 281 };
    const desk = openWindow(emptyDesk, "projects", screen);
    const [window] = desk.windows;
    expect(window.maximized).toBe(false);
    expect(window.x + window.width).toBeLessThanOrEqual(screen.width);
    expect(window.y + window.height).toBeLessThanOrEqual(screen.height);
    expect(window.width).toBeGreaterThanOrEqual(320);
  });
});

describe("focus and z-order", () => {
  it("raises a window to the top and restores it from the taskbar", () => {
    let desk = openWindow(emptyDesk, "projects", bounds);
    desk = openWindow(desk, "map", bounds);
    const projects = desk.windows[0].id;
    desk = minimizeWindow(desk, projects);
    expect(topWindow(desk)?.app).toBe("map");
    desk = focusWindow(desk, projects);
    expect(topWindow(desk)?.id).toBe(projects);
    expect(topWindow(desk)?.minimized).toBe(false);
  });

  it("cycles the focus through the open windows like Alt+Tab", () => {
    let desk = openWindow(emptyDesk, "projects", bounds);
    desk = openWindow(desk, "map", bounds);
    desk = openWindow(desk, "about", bounds);
    desk = cycleFocus(desk);
    expect(topWindow(desk)?.app).toBe("projects");
    desk = cycleFocus(desk);
    expect(topWindow(desk)?.app).toBe("map");
  });

  it("closes a window and focuses the next one below", () => {
    let desk = openWindow(emptyDesk, "projects", bounds);
    desk = openWindow(desk, "map", bounds);
    desk = closeWindow(desk, topWindow(desk)?.id ?? "");
    expect(desk.windows.map((window) => window.app)).toEqual(["projects"]);
    expect(topWindow(desk)?.app).toBe("projects");
    expect(topWindow(closeWindow(desk, desk.windows[0].id))).toBeUndefined();
  });
});

describe("moving and maximizing", () => {
  it("moves a window but keeps its title bar on the screen", () => {
    let desk = openWindow(emptyDesk, "projects", bounds);
    const id = desk.windows[0].id;
    desk = moveWindow(desk, id, 50, 30, bounds);
    const moved = desk.windows[0];
    desk = moveWindow(desk, id, -5000, -5000, bounds);
    expect(desk.windows[0].y).toBe(0);
    expect(desk.windows[0].x + desk.windows[0].width).toBeGreaterThan(0);
    desk = moveWindow(desk, id, 9000, 9000, bounds);
    expect(desk.windows[0].x).toBeLessThan(bounds.width);
    expect(desk.windows[0].y).toBeLessThan(bounds.height);
    expect(moved.x).toBeGreaterThan(0);
  });

  it("maximizes and restores the previous size", () => {
    let desk = openWindow(emptyDesk, "projects", bounds);
    const id = desk.windows[0].id;
    const before = desk.windows[0];
    desk = toggleMaximize(desk, id);
    expect(desk.windows[0].maximized).toBe(true);
    desk = toggleMaximize(desk, id);
    expect(desk.windows[0]).toMatchObject({
      maximized: false,
      x: before.x,
      width: before.width,
    });
  });
});
