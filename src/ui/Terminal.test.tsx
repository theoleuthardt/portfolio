import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bootLines } from "../terminal/boot";
import { BOOT_STEP_MS, BOOTED_KEY } from "./useBootSequence";
import { Terminal } from "./Terminal";

function mockReducedMotion(reduced: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: reduced && query.includes("prefers-reduced-motion"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

function input() {
  return screen.getByRole("textbox", { name: "terminal input" });
}

function type(command: string) {
  fireEvent.change(input(), { target: { value: command } });
  fireEvent.keyDown(input(), { key: "Enter" });
}

function log() {
  return screen.getByRole("log");
}

beforeEach(() => {
  sessionStorage.clear();
  mockReducedMotion(true);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("Terminal", () => {
  it("shows the whole boot output at once with reduced motion", () => {
    render(<Terminal />);
    expect(within(log()).getByText(/THEOCLOUD BIOS/)).toBeInTheDocument();
    expect(within(log()).getByText(/Welcome, guest/)).toBeInTheDocument();
  });

  it("focuses the input", () => {
    render(<Terminal />);
    expect(input()).toHaveFocus();
  });

  it("runs a typed command on Enter and echoes the prompt", () => {
    render(<Terminal />);
    type("ls");
    expect(
      within(log()).getAllByText("ls", { selector: "p > span" }),
    ).toHaveLength(1);
    expect(
      within(log()).getByRole("button", { name: /^trust-issues/ }),
    ).toBeInTheDocument();
    expect(input()).toHaveValue("");
  });

  it("runs a command chip on click", () => {
    render(<Terminal />);
    fireEvent.click(within(log()).getByRole("button", { name: "help" }));
    expect(within(log()).getByText("available commands:")).toBeInTheDocument();
  });

  it("opens a project screen from a project row", () => {
    render(<Terminal />);
    type("ls");
    fireEvent.click(within(log()).getByRole("button", { name: /^flashi/ }));
    const screenHeading = within(log()).getByRole("heading", {
      name: "Flashi",
    });
    const projectScreen = screenHeading.closest("section");
    expect(projectScreen).not.toBeNull();
    expect(
      within(projectScreen as HTMLElement).getByRole("link", {
        name: /repository/,
      }),
    ).toHaveAttribute("href", "https://github.com/theoleuthardt/flashi");
  });

  it("names the upstream of the fork on its screen", () => {
    render(<Terminal />);
    type("open opennutritracker");
    expect(
      within(log()).getByRole("link", { name: /upstream/ }),
    ).toHaveAttribute(
      "href",
      "https://github.com/simonoppowa/OpenNutriTracker",
    );
  });

  it("recalls the previous command with the up arrow", () => {
    render(<Terminal />);
    type("ls");
    fireEvent.keyDown(input(), { key: "ArrowUp" });
    expect(input()).toHaveValue("ls");
    fireEvent.keyDown(input(), { key: "ArrowDown" });
    expect(input()).toHaveValue("");
  });

  it("completes with Tab and lists ambiguous options", () => {
    render(<Terminal />);
    fireEvent.change(input(), { target: { value: "hel" } });
    fireEvent.keyDown(input(), { key: "Tab" });
    expect(input()).toHaveValue("help ");
    fireEvent.change(input(), { target: { value: "cl" } });
    fireEvent.keyDown(input(), { key: "Tab" });
    expect(screen.getByText("clear close")).toBeInTheDocument();
  });

  it("clears the log", () => {
    render(<Terminal />);
    type("clear");
    expect(within(log()).queryByText(/THEOCLOUD BIOS/)).toBeNull();
  });
});

describe("Terminal boot sequence", () => {
  beforeEach(() => {
    mockReducedMotion(false);
    vi.useFakeTimers();
  });

  it("reveals the boot output line by line", () => {
    render(<Terminal />);
    expect(within(log()).queryByText(/Welcome, guest/)).toBeNull();
    act(() => {
      vi.advanceTimersByTime(BOOT_STEP_MS * bootLines.length);
    });
    expect(within(log()).getByText(/Welcome, guest/)).toBeInTheDocument();
    expect(sessionStorage.getItem(BOOTED_KEY)).toBe("1");
  });

  it("skips the boot sequence on a key press", () => {
    render(<Terminal />);
    act(() => {
      fireEvent.keyDown(window, { key: "x" });
    });
    expect(within(log()).getByText(/Welcome, guest/)).toBeInTheDocument();
  });

  it("skips the boot sequence for returning visitors in the session", () => {
    sessionStorage.setItem(BOOTED_KEY, "1");
    render(<Terminal />);
    expect(within(log()).getByText(/Welcome, guest/)).toBeInTheDocument();
  });
});
