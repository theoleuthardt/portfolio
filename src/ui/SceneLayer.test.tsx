import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SceneLayer } from "./SceneLayer";

vi.mock("../scene/Scene", () => ({
  default: () => <div data-testid="scene" />,
}));

afterEach(() => {
  vi.unstubAllGlobals();
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
});
