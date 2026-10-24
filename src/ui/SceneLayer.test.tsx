import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SceneLayer } from "./SceneLayer";

const sceneMock = vi.hoisted(() => ({ fails: false }));

vi.mock("../scene/Scene", () => ({
  default: () => {
    if (sceneMock.fails) {
      throw new Error("WebGL context lost");
    }
    return <div data-testid="scene" />;
  },
}));

afterEach(() => {
  sceneMock.fails = false;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function viewport(width: number, height: number, coarsePointer: boolean) {
  vi.stubGlobal("innerWidth", width);
  vi.stubGlobal("innerHeight", height);
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: query.includes("pointer: coarse") ? coarsePointer : false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

describe("SceneLayer", () => {
  it("renders nothing on phones", () => {
    viewport(390, 844, true);
    const { container } = render(<SceneLayer webgl={true} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the static rack illustration without WebGL", () => {
    viewport(1280, 800, false);
    render(<SceneLayer webgl={false} />);
    expect(
      screen.getByRole("img", { name: /server rack/i }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("scene")).toBeNull();
  });

  it("loads the 3D scene on wide screens with WebGL", async () => {
    viewport(1280, 800, false);
    render(<SceneLayer webgl={true} />);
    expect(await screen.findByTestId("scene")).toBeInTheDocument();
  });

  it("falls back to the rack illustration when the scene fails", async () => {
    viewport(1280, 800, false);
    sceneMock.fails = true;
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(<SceneLayer webgl={true} />);
    expect(
      await screen.findByRole("img", { name: /server rack/i }),
    ).toBeInTheDocument();
  });

  it("reports a failed scene as ready so the boot can finish", async () => {
    viewport(1280, 800, false);
    sceneMock.fails = true;
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const onReady = vi.fn();
    render(<SceneLayer webgl={true} onReady={onReady} />);
    await screen.findByRole("img", { name: /server rack/i });
    expect(onReady).toHaveBeenCalled();
  });

  it("also reports the failure itself, so the page can drop what needs the scene", async () => {
    viewport(1280, 800, false);
    sceneMock.fails = true;
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const onFail = vi.fn();
    render(<SceneLayer webgl={true} onFail={onFail} />);
    await screen.findByRole("img", { name: /server rack/i });
    expect(onFail).toHaveBeenCalled();
  });
});
