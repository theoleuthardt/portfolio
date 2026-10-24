import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App, { SCENE_TIMEOUT_MS } from "./App";
import { BOOT_REDUCED_HOLD_MS } from "./ui/useBootSequence";

const sceneMock = vi.hoisted(() => ({ hangs: false }));

vi.mock("./scene/Scene", async () => {
  const { useEffect } = await import("react");
  return {
    default: function SceneMock({
      onReady,
      onSelectProject,
    }: {
      onReady: () => void;
      onSelectProject: (id: string) => void;
    }) {
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
