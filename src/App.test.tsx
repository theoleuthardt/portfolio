import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

vi.mock("./scene/Scene", () => ({
  default: ({ onReady }: { onReady: () => void }) => {
    onReady();
    return null;
  },
}));

vi.mock("./scene/device", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./scene/device")>()),
  supportsWebGL: () => true,
}));

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

function type(command: string) {
  const input = screen.getByRole("textbox", { name: "terminal input" });
  fireEvent.change(input, { target: { value: command } });
  fireEvent.keyDown(input, { key: "Enter" });
}

beforeEach(() => sessionStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe("App", () => {
  it("shows an opened project as a side panel on wide screens", async () => {
    viewport(1440);
    render(<App />);
    expect(await screen.findByText(/Welcome, guest/)).toBeInTheDocument();
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
    expect(await screen.findByText(/Welcome, guest/)).toBeInTheDocument();
    type("open trust-issues");
    expect(screen.queryByRole("complementary", { name: "project" })).toBeNull();
    expect(
      within(screen.getByRole("log")).getByRole("region", {
        name: /^Trust Issues/,
      }),
    ).toBeInTheDocument();
  });

  it("does not hold the boot on phones, where no scene loads", () => {
    viewport(390);
    render(<App />);
    expect(screen.getByText(/Welcome, guest/)).toBeInTheDocument();
  });
});
