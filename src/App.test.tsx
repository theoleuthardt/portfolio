import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App, { SCENE_TIMEOUT_MS, SEAT_TIMEOUT_MS } from "./App";
import type { ScreenPlacement as Placement } from "./scene/monitor/CrtMonitor";
import { BOOT_REDUCED_HOLD_MS } from "./ui/useBootSequence";

/** The window around the terminal, which the page moves onto the 3D screen. */
const terminalWindow = () => {
  const window = screen
    .getByRole("textbox", { name: "terminal input" })
    .closest<HTMLElement>("[data-terminal-window]");
  if (window === null) {
    throw new Error("terminal window missing");
  }
  return window;
};

const sceneMock = vi.hoisted(() => ({
  hangs: false,
  fails: false,
  promptAnchor: undefined as (() => DOMRect | undefined) | undefined,
  place: undefined as ((placement: Placement | undefined) => void) | undefined,
  monitorPose: undefined as string | undefined,
  reportsSeat: true,
  seat: undefined as (() => void) | undefined,
}));

vi.mock("./scene/Scene", async () => {
  const { useEffect } = await import("react");
  return {
    default: function SceneMock({
      onReady,
      onSelectProject,
      promptAnchor,
      onScreenPlacement,
      monitorPose,
      onSeatedChange,
    }: {
      onReady: () => void;
      onSelectProject: (id: string) => void;
      promptAnchor: () => DOMRect | undefined;
      onScreenPlacement?: (placement: Placement | undefined) => void;
      monitorPose?: string;
      onSeatedChange?: (seated: boolean) => void;
    }) {
      if (sceneMock.fails) {
        throw new Error("WebGL context lost");
      }
      sceneMock.promptAnchor = promptAnchor;
      sceneMock.place = onScreenPlacement;
      sceneMock.monitorPose = monitorPose;
      const atScreen = monitorPose === "seated" || monitorPose === "close";
      sceneMock.seat = () => onSeatedChange?.(atScreen);
      useEffect(() => {
        if (!atScreen || sceneMock.reportsSeat) {
          onSeatedChange?.(atScreen);
        }
      }, [atScreen, onSeatedChange]);
      useEffect(() => {
        if (!sceneMock.hangs) {
          onReady();
        }
      }, [onReady]);
      return (
        <button
          type="button"
          data-testid="scene"
          onClick={() => onSelectProject("flashi")}
        >
          rack module flashi
        </button>
      );
    },
  };
});

vi.mock("./scene/device", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./scene/device")>()),
  supportsWebGL: () => true,
}));

function viewport(width: number, coarsePointer = false) {
  vi.stubGlobal("innerWidth", width);
  vi.stubGlobal("innerHeight", 900);
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches:
        query.includes("prefers-reduced-motion") ||
        (coarsePointer && query.includes("pointer: coarse")),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

function type(command: string) {
  const input = screen.getByRole("textbox", { name: "terminal input" });
  fireEvent.change(input, { target: { value: command } });
  fireEvent.keyDown(input, { key: "Enter" });
}

beforeEach(() => sessionStorage.clear());
afterEach(() => {
  sceneMock.hangs = false;
  sceneMock.fails = false;
  sceneMock.place = undefined;
  sceneMock.monitorPose = undefined;
  sceneMock.reportsSeat = true;
  vi.restoreAllMocks();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("App", () => {
  it("shows an opened project as a side panel on wide screens", async () => {
    viewport(1440);
    render(<App />);
    expect(
      await screen.findByText(/Welcome, guest/, {}, { timeout: 3000 }),
    ).toBeInTheDocument();
    type("open trust-issues");
    const panel = screen.getByRole("complementary", { name: "project" });
    expect(
      within(panel).getByRole("heading", { name: "Trust Issues" }),
    ).toBeInTheDocument();
    expect(within(screen.getByRole("log")).queryByRole("region")).toBeNull();
    type("close");
    expect(screen.queryByRole("complementary", { name: "project" })).toBeNull();
  });

  it("keeps project screens inside the terminal below 1024 px", async () => {
    viewport(800);
    render(<App />);
    expect(
      await screen.findByText(/Welcome, guest/, {}, { timeout: 3000 }),
    ).toBeInTheDocument();
    type("open trust-issues");
    expect(screen.queryByRole("complementary", { name: "project" })).toBeNull();
    expect(
      within(screen.getByRole("log")).getByRole("region", {
        name: /^Trust Issues/,
      }),
    ).toBeInTheDocument();
  });

  it("does not hold the boot on phones, where no scene loads", async () => {
    viewport(390);
    render(<App />);
    expect(
      await screen.findByText(/Welcome, guest/, {}, { timeout: 3000 }),
    ).toBeInTheDocument();
  });

  it("closes the panel with Escape while focus is inside it", async () => {
    viewport(1440);
    render(<App />);
    expect(
      await screen.findByText(/Welcome, guest/, {}, { timeout: 3000 }),
    ).toBeInTheDocument();
    type("open flashi");
    const link = within(
      screen.getByRole("complementary", { name: "project" }),
    ).getByRole("link", { name: /repository/ });
    link.focus();
    fireEvent.keyDown(link, { key: "Escape" });
    expect(screen.queryByRole("complementary", { name: "project" })).toBeNull();
  });

  it("does not wait forever for a scene that never loads", async () => {
    vi.useFakeTimers();
    viewport(1440);
    sceneMock.hangs = true;
    render(<App />);
    expect(screen.queryByText(/Welcome, guest/)).toBeNull();
    await act(async () => {
      vi.advanceTimersByTime(SCENE_TIMEOUT_MS);
    });
    await act(async () => {
      vi.advanceTimersByTime(BOOT_REDUCED_HOLD_MS);
    });
    expect(screen.getByText(/Welcome, guest/)).toBeInTheDocument();
  });

  it("shows no scene on touch tablets", async () => {
    viewport(820, true);
    render(<App />);
    expect(screen.queryByTestId("scene")).toBeNull();
    expect(
      await screen.findByText(/Welcome, guest/, {}, { timeout: 3000 }),
    ).toBeInTheDocument();
  });

  it("shows the scene on wide desktop screens", async () => {
    viewport(1440);
    render(<App />);
    expect(await screen.findByTestId("scene")).toBeInTheDocument();
  });

  it("opens a project through the terminal when its rack module is clicked", async () => {
    viewport(1440);
    render(<App />);
    fireEvent.click(await screen.findByTestId("scene"));
    expect(
      within(screen.getByRole("complementary", { name: "project" })).getByRole(
        "heading",
        { name: "Flashi" },
      ),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("log")).getByText("open flashi"),
    ).toBeInTheDocument();
  });

  it("hints at the clickable rack only where the scene is shown", async () => {
    viewport(1440);
    const { unmount } = render(<App />);
    expect(
      await screen.findByText(
        /click a module in the server rack/,
        {},
        { timeout: 3000 },
      ),
    ).toBeInTheDocument();
    unmount();
    viewport(390);
    render(<App />);
    expect(
      await screen.findByText(/Welcome, guest/, {}, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/server rack/)).toBeNull();
  });
});

describe("terminal window", () => {
  const booted = () =>
    screen.findByRole("textbox", { name: "terminal input" }, { timeout: 3000 });

  it("offers minimize and close only where the scene is shown", async () => {
    viewport(1440);
    const { unmount } = render(<App />);
    await booted();
    expect(
      screen.getByRole("button", { name: "minimize terminal" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "close terminal" }),
    ).toBeInTheDocument();
    unmount();
    viewport(390);
    render(<App />);
    await booted();
    expect(screen.queryByRole("button", { name: /terminal$/ })).toBeNull();
  });

  it("minimizes the terminal into a bar that restores it", async () => {
    viewport(1440);
    render(<App />);
    await booted();
    fireEvent.click(screen.getByRole("button", { name: "minimize terminal" }));
    expect(
      screen.queryByRole("textbox", { name: "terminal input" }),
    ).toBeNull();
    const restore = screen.getByRole("button", { name: "restore terminal" });
    expect(restore).toHaveFocus();
    fireEvent.click(restore);
    expect(
      screen.getByRole("textbox", { name: "terminal input" }),
    ).toHaveFocus();
    expect(
      screen.queryByRole("button", { name: "restore terminal" }),
    ).toBeNull();
  });

  it("closes the terminal behind a button that opens it with its session", async () => {
    viewport(1440);
    render(<App />);
    await booted();
    type("pwd");
    fireEvent.click(screen.getByRole("button", { name: "close terminal" }));
    expect(
      screen.queryByRole("textbox", { name: "terminal input" }),
    ).toBeNull();
    const reopen = screen.getByRole("button", { name: "open terminal" });
    expect(reopen).toHaveFocus();
    fireEvent.click(reopen);
    expect(
      screen.getByRole("textbox", { name: "terminal input" }),
    ).toHaveFocus();
    expect(
      within(screen.getByRole("log")).getByText("/home/guest"),
    ).toBeInTheDocument();
  });

  it("names the window after the working directory", async () => {
    viewport(390);
    render(<App />);
    await booted();
    expect(screen.getByText("guest@theocloud: ~")).toBeInTheDocument();
    type("cd projects");
    expect(screen.getByText("guest@theocloud: ~/projects")).toBeInTheDocument();
  });

  it("maximizes the window and brings it back to its size", async () => {
    viewport(1440);
    render(<App />);
    await booted();
    const maximize = screen.getByRole("button", { name: "maximize terminal" });
    expect(maximize).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(maximize);
    expect(maximize).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(maximize);
    expect(maximize).toHaveAttribute("aria-pressed", "false");
  });

  it("draws no HUD line to a prompt that is folded away", async () => {
    viewport(1440);
    render(<App />);
    await booted();
    type("open flashi");
    expect(sceneMock.promptAnchor?.()).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "minimize terminal" }));
    expect(sceneMock.promptAnchor?.()).toBeUndefined();
  });

  it("brings the terminal back when a rack module opens a project", async () => {
    viewport(1440);
    render(<App />);
    await booted();
    fireEvent.click(screen.getByRole("button", { name: "minimize terminal" }));
    fireEvent.click(screen.getByTestId("scene"));
    expect(
      screen.getByRole("textbox", { name: "terminal input" }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("log")).getByText("open flashi"),
    ).toBeInTheDocument();
  });
});

describe("3D monitor", () => {
  const booted = () =>
    screen.findByRole("textbox", { name: "terminal input" }, { timeout: 3000 });

  it("hands the screen to the 3D monitor once the scene is ready", async () => {
    viewport(1440);
    render(<App />);
    await booted();
    expect(sceneMock.monitorPose).toBe("seated");
    expect(screen.queryByText("THEO-TERM 3270")).toBeNull();
  });

  it("maps the HTML screen onto the 3D terminal's screen", async () => {
    viewport(1440);
    render(<App />);
    await booted();
    act(() =>
      sceneMock.place?.({
        quad: [
          [100, 80],
          [520, 100],
          [510, 420],
          [90, 400],
        ],
        width: 400,
        height: 300,
      }),
    );
    const window = terminalWindow();
    expect(window.style.transform).toMatch(/^matrix3d\(/);
    expect(window.style.width).toBe("400px");
    expect(window.style.height).toBe("300px");
  });

  it("drops the mapping when the scene goes away while the screen is mapped", async () => {
    viewport(1440);
    render(<App />);
    await booted();
    act(() =>
      sceneMock.place?.({
        quad: [
          [0, 0],
          [400, 0],
          [400, 300],
          [0, 300],
        ],
        width: 400,
        height: 300,
      }),
    );
    viewport(390);
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    expect(terminalWindow().style.transform).toBe("");
    expect(terminalWindow().style.position).toBe("");
  });

  it("returns the screen to the page layout when the 3D screen is gone", async () => {
    viewport(1440);
    render(<App />);
    await booted();
    act(() =>
      sceneMock.place?.({
        quad: [
          [0, 0],
          [400, 0],
          [400, 300],
          [0, 300],
        ],
        width: 400,
        height: 300,
      }),
    );
    act(() => sceneMock.place?.(undefined));
    expect(terminalWindow().style.transform).toBe("");
    expect(terminalWindow().style.width).toBe("");
  });

  it("keeps the 2D housing on phones and while the scene never loads", async () => {
    viewport(390);
    const { unmount } = render(<App />);
    await booted();
    expect(screen.getByText("THEO-TERM 3270")).toBeInTheDocument();
    unmount();
    vi.useFakeTimers();
    sceneMock.hangs = true;
    viewport(1440);
    render(<App />);
    await act(() => vi.advanceTimersByTimeAsync(SCENE_TIMEOUT_MS + 5000));
    expect(screen.getByText("THEO-TERM 3270")).toBeInTheDocument();
    expect(sceneMock.monitorPose).toBe("off");
  });

  it("keeps the 2D housing below 1024 px, where the 3D screen would be too small", async () => {
    viewport(800);
    render(<App />);
    await booted();
    expect(screen.getByText("THEO-TERM 3270")).toBeInTheDocument();
    expect(sceneMock.monitorPose).toBe("off");
  });

  it("keeps the 2D housing when the scene fails", async () => {
    viewport(1440);
    sceneMock.fails = true;
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(<App />);
    await booted();
    expect(screen.getByText("THEO-TERM 3270")).toBeInTheDocument();
  });

  it("leans in to the screen when the window is maximized at the desk", async () => {
    viewport(1440);
    render(<App />);
    await booted();
    fireEvent.click(screen.getByRole("button", { name: "maximize terminal" }));
    expect(sceneMock.monitorPose).toBe("close");
    expect(screen.queryByText("THEO-TERM 3270")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "maximize terminal" }));
    expect(sceneMock.monitorPose).toBe("seated");
  });

  it("stands up from the desk while the terminal is folded away", async () => {
    viewport(1440);
    render(<App />);
    await booted();
    expect(sceneMock.monitorPose).toBe("seated");
    fireEvent.click(screen.getByRole("button", { name: "minimize terminal" }));
    expect(sceneMock.monitorPose).toBe("standing");
    fireEvent.click(screen.getByRole("button", { name: "restore terminal" }));
    expect(sceneMock.monitorPose).toBe("seated");
    fireEvent.click(screen.getByRole("button", { name: "close terminal" }));
    expect(sceneMock.monitorPose).toBe("standing");
  });

  it("shows the screen only once the 3D terminal is seated around it", async () => {
    viewport(1440);
    render(<App />);
    await booted();
    sceneMock.reportsSeat = false;
    fireEvent.click(screen.getByRole("button", { name: "minimize terminal" }));
    fireEvent.click(screen.getByRole("button", { name: "restore terminal" }));
    expect(
      screen.queryByRole("textbox", { name: "terminal input" }),
    ).toBeNull();
    act(() => sceneMock.seat?.());
    expect(
      screen.getByRole("textbox", { name: "terminal input" }),
    ).toHaveFocus();
  });

  it("shows the screen anyway if the 3D terminal never reports", async () => {
    viewport(1440);
    render(<App />);
    await booted();
    sceneMock.reportsSeat = false;
    vi.useFakeTimers();
    fireEvent.click(screen.getByRole("button", { name: "minimize terminal" }));
    fireEvent.click(screen.getByRole("button", { name: "restore terminal" }));
    await act(() => vi.advanceTimersByTimeAsync(SEAT_TIMEOUT_MS));
    expect(
      screen.getByRole("textbox", { name: "terminal input" }),
    ).toBeInTheDocument();
  });

  it("maximizes the 2D terminal below 1024 px", async () => {
    viewport(800);
    render(<App />);
    await booted();
    fireEvent.click(screen.getByRole("button", { name: "maximize terminal" }));
    expect(sceneMock.monitorPose).toBe("off");
    expect(screen.getByText("THEO-TERM 3270")).toBeInTheDocument();
  });
});
