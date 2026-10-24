import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bootSteps } from "../terminal/boot";
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
  vi.restoreAllMocks();
});

describe("Terminal", () => {
  it("shows the whole boot output at once with reduced motion", () => {
    render(<Terminal />);
    expect(
      within(log()).getByRole("img", { name: "TheoCloud OS" }),
    ).toBeInTheDocument();
    expect(within(log()).getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "100",
    );
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

  it("restores the unsubmitted input after browsing the history", () => {
    render(<Terminal />);
    type("ls");
    fireEvent.change(input(), { target: { value: "dra" } });
    fireEvent.keyDown(input(), { key: "ArrowUp" });
    expect(input()).toHaveValue("ls");
    fireEvent.keyDown(input(), { key: "ArrowDown" });
    expect(input()).toHaveValue("dra");
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

  it("expands only the screen of the currently open project", () => {
    render(<Terminal />);
    type("open flashi");
    type("open trust-issues");
    expect(within(log()).queryByRole("region", { name: /^Flashi/ })).toBeNull();
    expect(
      within(log()).getByRole("region", { name: /^Trust Issues/ }),
    ).toBeInTheDocument();
    const ids = [...document.querySelectorAll("[id]")].map((node) => node.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("collapses the project screen on close", () => {
    render(<Terminal />);
    type("open flashi");
    type("close");
    expect(within(log()).queryByRole("region")).toBeNull();
  });

  it("lets Tab and Shift+Tab move focus when there is nothing to complete", () => {
    render(<Terminal />);
    const empty = fireEvent.keyDown(input(), { key: "Tab" });
    expect(empty).toBe(true);
    fireEvent.change(input(), { target: { value: "xyz" } });
    expect(fireEvent.keyDown(input(), { key: "Tab" })).toBe(true);
    fireEvent.change(input(), { target: { value: "hel" } });
    expect(fireEvent.keyDown(input(), { key: "Tab", shiftKey: true })).toBe(
      true,
    );
    expect(input()).toHaveValue("hel");
  });

  it("does not submit while an IME composition is confirmed with Enter", () => {
    render(<Terminal />);
    fireEvent.change(input(), { target: { value: "ls" } });
    fireEvent.keyDown(input(), { key: "Enter", isComposing: true });
    expect(input()).toHaveValue("ls");
    expect(within(log()).queryByRole("button", { name: /^flashi/ })).toBeNull();
  });

  it("leaves arrow keys and Tab to the IME while composing", () => {
    render(<Terminal />);
    type("ls");
    fireEvent.change(input(), { target: { value: "he" } });
    fireEvent.keyDown(input(), { key: "ArrowUp", isComposing: true });
    fireEvent.keyDown(input(), { key: "Tab", isComposing: true });
    expect(input()).toHaveValue("he");
  });

  it("hides completion options once the input changes", () => {
    render(<Terminal />);
    fireEvent.change(input(), { target: { value: "cl" } });
    fireEvent.keyDown(input(), { key: "Tab" });
    fireEvent.change(input(), { target: { value: "cle" } });
    expect(screen.queryByText("clear close")).toBeNull();
  });

  it("still works when session storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    render(<Terminal />);
    type("ls");
    expect(
      within(log()).getByRole("button", { name: /^flashi/ }),
    ).toBeInTheDocument();
  });

  it("clears the log", () => {
    render(<Terminal />);
    type("clear");
    expect(
      within(log()).queryByRole("img", { name: "TheoCloud OS" }),
    ).toBeNull();
  });
});

describe("Terminal boot sequence", () => {
  beforeEach(() => {
    mockReducedMotion(false);
    vi.useFakeTimers();
  });

  it("shows the logo at once and fills the progress bar step by step", () => {
    render(<Terminal />);
    expect(
      within(log()).getByRole("img", { name: "TheoCloud OS" }),
    ).toBeInTheDocument();
    const bar = within(log()).getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", String(bootSteps[0].percent));
    expect(within(log()).queryByText(/Welcome, guest/)).toBeNull();
    act(() => {
      vi.advanceTimersByTime(BOOT_STEP_MS);
    });
    expect(bar).toHaveAttribute("aria-valuenow", String(bootSteps[1].percent));
    act(() => {
      vi.advanceTimersByTime(BOOT_STEP_MS * bootSteps.length);
    });
    expect(bar).toHaveAttribute("aria-valuenow", "100");
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
