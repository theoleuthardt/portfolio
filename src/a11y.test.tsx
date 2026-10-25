import { fireEvent, render, screen } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";

vi.mock("./scene/Scene", async () => {
  const { useEffect } = await import("react");
  return {
    default: function SceneMock({
      onReady,
      monitorPose,
      onSeatedChange,
    }: {
      onReady: () => void;
      monitorPose?: string;
      onSeatedChange?: (seated: boolean) => void;
    }) {
      useEffect(() => onReady(), [onReady]);
      useEffect(() => {
        onSeatedChange?.(monitorPose === "seated" || monitorPose === "close");
      }, [monitorPose, onSeatedChange]);
      return null;
    },
  };
});

vi.mock("./scene/device", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./scene/device")>()),
  supportsWebGL: () => true,
}));

/** The document as index.html serves it. */
document.documentElement.lang = "en";

function viewport(width: number) {
  vi.stubGlobal("innerWidth", width);
  vi.stubGlobal("innerHeight", 900);
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

/** Accessibility violations axe finds; contrast needs a real layout engine. */
async function violations() {
  const result = await axe.run(document, {
    rules: { "color-contrast": { enabled: false } },
  });
  return result.violations.map(
    (violation) => `${violation.id}: ${violation.nodes.length}`,
  );
}

function type(command: string) {
  const input = screen.getByRole("textbox", { name: "terminal input" });
  fireEvent.change(input, { target: { value: command } });
  fireEvent.keyDown(input, { key: "Enter" });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("accessibility", () => {
  it("names the page with a level-one heading", async () => {
    viewport(1440);
    render(<App />);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Theo Leuthardt – portfolio terminal",
      }),
    ).toBeInTheDocument();
  });

  it.each([390, 1440])("has no axe violations at %i px", async (width) => {
    viewport(width);
    render(<App />);
    await screen.findByRole(
      "textbox",
      { name: "terminal input" },
      { timeout: 3000 },
    );
    type("help");
    type("ls -la");
    type("open flashi");
    if (width >= 1024) {
      expect(
        screen.getByRole("complementary", { name: "project" }),
      ).toBeInTheDocument();
    }
    expect(await violations()).toEqual([]);
  });

  it("has no axe violations while a program runs", async () => {
    viewport(1440);
    render(<App />);
    await screen.findByRole(
      "textbox",
      { name: "terminal input" },
      { timeout: 3000 },
    );
    type("top");
    expect(await violations()).toEqual([]);
  });

  it.each([390, 1440])(
    "has no axe violations on the desktop with windows open at %i px",
    async (width) => {
      viewport(width);
      render(<App />);
      await screen.findByRole(
        "textbox",
        { name: "terminal input" },
        { timeout: 3000 },
      );
      fireEvent.click(screen.getByRole("button", { name: "close terminal" }));
      for (const app of ["Projects", "Notes", "Trash", "About"]) {
        fireEvent.click(screen.getByRole("button", { name: app }));
      }
      fireEvent.click(screen.getByRole("button", { name: "flashi" }));
      fireEvent.click(screen.getByRole("button", { name: "TheoCloud" }));
      expect(await violations()).toEqual([]);
    },
  );
});
