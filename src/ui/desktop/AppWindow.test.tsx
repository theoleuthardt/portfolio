import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { DesktopWindow } from "../../desktop/windows";
import { AppWindow } from "./AppWindow";

const notes: DesktopWindow = {
  id: "window-1",
  app: "notes",
  x: 10,
  y: 10,
  width: 300,
  height: 200,
  minimized: false,
  maximized: false,
};

function renderWindow(window: DesktopWindow = notes) {
  const handlers = {
    onFocus: vi.fn(),
    onMove: vi.fn(),
    onMinimize: vi.fn(),
    onToggleMaximize: vi.fn(),
    onClose: vi.fn(),
  };
  render(
    <AppWindow window={window} title="Notes" focused {...handlers}>
      <p>inside</p>
    </AppWindow>,
  );
  const titleBar = screen.getByText("Notes", { selector: ".desk-title" });
  return { handlers, titleBar };
}

describe("AppWindow", () => {
  it("moves by the distance the title bar is dragged and focuses on press", () => {
    const { handlers, titleBar } = renderWindow();
    fireEvent.pointerDown(titleBar, { pointerId: 1, clientX: 10, clientY: 10 });
    expect(handlers.onFocus).toHaveBeenCalled();
    fireEvent.pointerMove(titleBar, { pointerId: 1, clientX: 40, clientY: 30 });
    fireEvent.pointerMove(titleBar, { pointerId: 1, clientX: 45, clientY: 30 });
    expect(handlers.onMove.mock.calls).toEqual([
      [30, 20],
      [5, 0],
    ]);
    fireEvent.pointerUp(titleBar, { pointerId: 1 });
    fireEvent.pointerMove(titleBar, { pointerId: 1, clientX: 90, clientY: 90 });
    expect(handlers.onMove).toHaveBeenCalledTimes(2);
  });

  it("does not start a drag from the window keys", () => {
    const { handlers } = renderWindow();
    const close = screen.getByRole("button", { name: "close Notes" });
    fireEvent.pointerDown(close, { pointerId: 1, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(close, { pointerId: 1, clientX: 40, clientY: 30 });
    expect(handlers.onMove).not.toHaveBeenCalled();
    fireEvent.click(close);
    expect(handlers.onClose).toHaveBeenCalled();
  });

  it("stays put while maximized", () => {
    const { handlers, titleBar } = renderWindow({ ...notes, maximized: true });
    fireEvent.pointerDown(titleBar, { pointerId: 1, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(titleBar, { pointerId: 1, clientX: 40, clientY: 30 });
    expect(handlers.onMove).not.toHaveBeenCalled();
  });

  it("drops a drag the browser cancels", () => {
    const { handlers, titleBar } = renderWindow();
    fireEvent.pointerDown(titleBar, { pointerId: 1, clientX: 10, clientY: 10 });
    fireEvent.pointerCancel(titleBar, { pointerId: 1 });
    fireEvent.pointerMove(titleBar, { pointerId: 1, clientX: 40, clientY: 30 });
    fireEvent.pointerDown(titleBar, { pointerId: 2, clientX: 10, clientY: 10 });
    fireEvent.lostPointerCapture(titleBar, { pointerId: 2 });
    fireEvent.pointerMove(titleBar, { pointerId: 2, clientX: 40, clientY: 30 });
    expect(handlers.onMove).not.toHaveBeenCalled();
  });

  it("maximizes on a double click of the title bar and hides when minimized", () => {
    const { handlers, titleBar } = renderWindow();
    fireEvent.doubleClick(titleBar);
    expect(handlers.onToggleMaximize).toHaveBeenCalled();
    render(
      <AppWindow
        window={{ ...notes, id: "window-2", minimized: true }}
        title="Trash"
        focused={false}
        {...handlers}
      >
        <p>trash</p>
      </AppWindow>,
    );
    expect(screen.queryByRole("region", { name: "Trash" })).toBeNull();
  });
});
