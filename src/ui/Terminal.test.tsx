import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { createRef, type ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bootSteps } from "../terminal/boot";
import {
  BOOT_GLIDE_MS,
  BOOT_HOLD_MS,
  BOOT_REDUCED_HOLD_MS,
  BOOT_STEP_MS,
} from "./useBootSequence";
import { Terminal, type TerminalHandle } from "./Terminal";

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

function phase() {
  return document
    .querySelector("[data-boot-phase]")
    ?.getAttribute("data-boot-phase");
}

function renderBooted(ui: ReactElement) {
  const result = render(ui);
  act(() => {
    vi.advanceTimersByTime(BOOT_REDUCED_HOLD_MS);
  });
  return result;
}

beforeEach(() => {
  vi.useFakeTimers();
  mockReducedMotion(true);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Terminal", () => {
  it("with reduced motion skips the static splash on a click", () => {
    render(<Terminal />);
    act(() => {
      fireEvent.pointerDown(window);
    });
    expect(within(log()).getByText(/Welcome, guest/)).toBeInTheDocument();
    expect(input()).toHaveFocus();
  });

  it("with reduced motion shows the splash briefly, then the prompt without gliding", () => {
    render(<Terminal />);
    expect(phase()).toBe("splash");
    expect(
      within(log()).getByRole("img", { name: "TheoCloud OS" }),
    ).toBeInTheDocument();
    expect(within(log()).getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "100",
    );
    expect(
      screen.queryByRole("textbox", { name: "terminal input" }),
    ).toBeNull();
    act(() => {
      vi.advanceTimersByTime(BOOT_REDUCED_HOLD_MS);
    });
    expect(phase()).toBe("ready");
    expect(within(log()).getByText(/Welcome, guest/)).toBeInTheDocument();
  });

  it("focuses the input", () => {
    renderBooted(<Terminal />);
    expect(input()).toHaveFocus();
  });

  it("runs a typed command on Enter and echoes the prompt", () => {
    renderBooted(<Terminal />);
    type("projects");
    expect(
      within(log()).getAllByText("projects", { selector: "p > span" }),
    ).toHaveLength(1);
    expect(
      within(log()).getByRole("button", { name: /^trust-issues/ }),
    ).toBeInTheDocument();
    expect(input()).toHaveValue("");
  });

  it("runs a command chip on click", () => {
    renderBooted(<Terminal />);
    fireEvent.click(within(log()).getByRole("button", { name: "help" }));
    expect(within(log()).getByText("available commands:")).toBeInTheDocument();
  });

  it("explains the commands in help and runs one on click", () => {
    renderBooted(<Terminal />);
    type("help");
    expect(within(log()).getByText(/opens a project/i)).toBeInTheDocument();
    const projectButtons = within(log()).getAllByRole("button", {
      name: "projects",
    });
    fireEvent.click(projectButtons[projectButtons.length - 1]);
    expect(
      within(log()).getByRole("button", { name: /^trust-issues/ }),
    ).toBeInTheDocument();
  });

  it("opens a project screen from a project row", () => {
    renderBooted(<Terminal />);
    type("projects");
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
    renderBooted(<Terminal />);
    type("open opennutritracker");
    expect(
      within(log()).getByRole("link", { name: /upstream/ }),
    ).toHaveAttribute(
      "href",
      "https://github.com/simonoppowa/OpenNutriTracker",
    );
  });

  it("recalls the previous command with the up arrow", () => {
    renderBooted(<Terminal />);
    type("ls");
    fireEvent.keyDown(input(), { key: "ArrowUp" });
    expect(input()).toHaveValue("ls");
    fireEvent.keyDown(input(), { key: "ArrowDown" });
    expect(input()).toHaveValue("");
  });

  it("restores the unsubmitted input after browsing the history", () => {
    renderBooted(<Terminal />);
    type("ls");
    fireEvent.change(input(), { target: { value: "dra" } });
    fireEvent.keyDown(input(), { key: "ArrowUp" });
    expect(input()).toHaveValue("ls");
    fireEvent.keyDown(input(), { key: "ArrowDown" });
    expect(input()).toHaveValue("dra");
  });

  it("keeps a text selection in the log instead of focusing the input", () => {
    renderBooted(<Terminal />);
    input().blur();
    vi.spyOn(window, "getSelection").mockReturnValue({
      isCollapsed: false,
    } as Selection);
    fireEvent.click(log());
    expect(input()).not.toHaveFocus();
  });

  it("completes with Tab and lists ambiguous options", () => {
    renderBooted(<Terminal />);
    fireEvent.change(input(), { target: { value: "hel" } });
    fireEvent.keyDown(input(), { key: "Tab" });
    expect(input()).toHaveValue("help ");
    fireEvent.change(input(), { target: { value: "cl" } });
    fireEvent.keyDown(input(), { key: "Tab" });
    expect(screen.getByText("clear close")).toBeInTheDocument();
  });

  it("expands only the screen of the currently open project", () => {
    renderBooted(<Terminal />);
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
    renderBooted(<Terminal />);
    type("open flashi");
    type("close");
    expect(within(log()).queryByRole("region")).toBeNull();
  });

  it("completes with Tab like a terminal and leaves with Shift+Tab", () => {
    renderBooted(<Terminal />);
    expect(fireEvent.keyDown(input(), { key: "Tab" })).toBe(false);
    expect(screen.getByText(/^cat cd clear close/)).toBeInTheDocument();
    fireEvent.change(input(), { target: { value: "xyz" } });
    expect(fireEvent.keyDown(input(), { key: "Tab" })).toBe(false);
    expect(input()).toHaveValue("xyz");
    expect(fireEvent.keyDown(input(), { key: "Tab", shiftKey: true })).toBe(
      true,
    );
  });

  it("lets a second Tab without anything new move focus on", () => {
    renderBooted(<Terminal />);
    expect(fireEvent.keyDown(input(), { key: "Tab" })).toBe(false);
    expect(fireEvent.keyDown(input(), { key: "Tab" })).toBe(true);
    fireEvent.change(input(), { target: { value: "hel" } });
    expect(fireEvent.keyDown(input(), { key: "Tab" })).toBe(false);
    expect(input()).toHaveValue("help ");
  });

  it("shows projects/ at home and changes into it on click", () => {
    renderBooted(<Terminal />);
    type("ls");
    fireEvent.click(within(log()).getByRole("button", { name: "projects/" }));
    expect(
      screen.getAllByText("guest@theocloud:~/projects$").length,
    ).toBeGreaterThan(0);
  });

  it("hints that the server rack is interactive where the scene is shown", () => {
    renderBooted(<Terminal rackHint />);
    expect(
      within(log()).getByText(/click a module in the server rack/),
    ).toBeInTheDocument();
  });

  it("gives no rack hint without the scene", () => {
    renderBooted(<Terminal />);
    expect(within(log()).queryByText(/server rack/)).toBeNull();
  });

  it("does not submit while an IME composition is confirmed with Enter", () => {
    renderBooted(<Terminal />);
    fireEvent.change(input(), { target: { value: "ls" } });
    fireEvent.keyDown(input(), { key: "Enter", isComposing: true });
    expect(input()).toHaveValue("ls");
    expect(within(log()).queryByRole("button", { name: /^flashi/ })).toBeNull();
  });

  it("leaves arrow keys and Tab to the IME while composing", () => {
    renderBooted(<Terminal />);
    type("ls");
    fireEvent.change(input(), { target: { value: "he" } });
    fireEvent.keyDown(input(), { key: "ArrowUp", isComposing: true });
    fireEvent.keyDown(input(), { key: "Tab", isComposing: true });
    expect(input()).toHaveValue("he");
  });

  it("hides completion options once the input changes", () => {
    renderBooted(<Terminal />);
    fireEvent.change(input(), { target: { value: "cl" } });
    fireEvent.keyDown(input(), { key: "Tab" });
    fireEvent.change(input(), { target: { value: "cle" } });
    expect(screen.queryByText("clear close")).toBeNull();
  });

  it("reports the open project and its closing", () => {
    const onOpenProjectChange = vi.fn();
    renderBooted(<Terminal onOpenProjectChange={onOpenProjectChange} />);
    type("open flashi");
    expect(onOpenProjectChange).toHaveBeenLastCalledWith("flashi");
    type("close");
    expect(onOpenProjectChange).toHaveBeenLastCalledWith(undefined);
  });

  it("closes the open project with Escape", () => {
    const onOpenProjectChange = vi.fn();
    renderBooted(<Terminal onOpenProjectChange={onOpenProjectChange} />);
    type("open flashi");
    fireEvent.keyDown(input(), { key: "Escape" });
    expect(onOpenProjectChange).toHaveBeenLastCalledWith(undefined);
    expect(within(log()).queryByRole("region")).toBeNull();
  });

  it("leaves project screens out of the log when they are shown elsewhere", () => {
    renderBooted(<Terminal inlineProjectScreens={false} />);
    type("open flashi");
    expect(within(log()).queryByRole("region")).toBeNull();
    expect(
      within(log()).getByText(/ejecting module flashi/),
    ).toBeInTheDocument();
  });

  it("runs commands given from outside, e.g. a click on a rack module", () => {
    const ref = createRef<TerminalHandle>();
    renderBooted(<Terminal ref={ref} />);
    act(() => ref.current?.run("open flashi"));
    expect(
      within(log()).getByRole("region", { name: /^Flashi/ }),
    ).toBeInTheDocument();
    expect(within(log()).getByText("open flashi")).toBeInTheDocument();
  });

  it("tells where the prompt is, as the anchor of the HUD line", () => {
    const ref = createRef<TerminalHandle>();
    renderBooted(<Terminal ref={ref} />);
    expect(ref.current?.promptAnchor()).toEqual(
      input().getBoundingClientRect(),
    );
  });

  it("draws a block cursor on the character under the caret", () => {
    renderBooted(<Terminal />);
    fireEvent.change(input(), { target: { value: "ls" } });
    expect(document.querySelector(".crt-cursor")?.textContent).toBe(" ");
    (input() as HTMLInputElement).setSelectionRange(0, 0);
    fireEvent.select(input());
    expect(document.querySelector(".crt-cursor")?.textContent).toBe("l");
  });

  it("edits the line with readline keys", () => {
    renderBooted(<Terminal />);
    const field = input() as HTMLInputElement;
    fireEvent.change(field, { target: { value: "open flashi" } });
    field.setSelectionRange(5, 5);
    fireEvent.select(field);
    fireEvent.keyDown(field, { key: "u", ctrlKey: true });
    expect(field).toHaveValue("flashi");
    fireEvent.keyDown(field, { key: "e", ctrlKey: true });
    fireEvent.keyDown(field, { key: "w", ctrlKey: true });
    expect(field).toHaveValue("");
    fireEvent.change(field, { target: { value: "open flashi" } });
    fireEvent.keyDown(field, { key: "a", ctrlKey: true });
    fireEvent.keyDown(field, { key: "k", ctrlKey: true });
    expect(field).toHaveValue("");
  });

  it("keeps following the caret after a readline key that changes nothing", () => {
    renderBooted(<Terminal />);
    const field = input() as HTMLInputElement;
    fireEvent.change(field, { target: { value: "ls" } });
    fireEvent.keyDown(field, { key: "a", ctrlKey: true });
    fireEvent.keyDown(field, { key: "a", ctrlKey: true });
    field.setSelectionRange(2, 2);
    fireEvent.change(field, { target: { value: "lsx" } });
    expect(field.selectionStart).toBe(3);
    expect(document.querySelector(".crt-cursor")?.textContent).toBe(" ");
  });

  it("cancels the line with Ctrl+C and clears the screen with Ctrl+L", () => {
    renderBooted(<Terminal />);
    fireEvent.change(input(), { target: { value: "open fla" } });
    fireEvent.keyDown(input(), { key: "c", ctrlKey: true });
    expect(within(log()).getByText("open fla^C")).toBeInTheDocument();
    expect(input()).toHaveValue("");
    fireEvent.keyDown(input(), { key: "l", ctrlKey: true });
    expect(within(log()).queryByText("open fla^C")).toBeNull();
  });

  it("shows the working directory in the prompt", () => {
    renderBooted(<Terminal />);
    type("cd projects");
    expect(
      screen.getAllByText("guest@theocloud:~/projects$").length,
    ).toBeGreaterThan(0);
  });

  it("clears the log", () => {
    renderBooted(<Terminal />);
    type("clear");
    expect(
      within(log()).queryByRole("img", { name: "TheoCloud OS" }),
    ).toBeNull();
  });
});

describe("Terminal boot hold", () => {
  it("holds the boot at the lab sync step until the scene is ready", () => {
    const { rerender } = render(<Terminal holdBoot={true} />);
    expect(within(log()).getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      String(bootSteps[bootSteps.length - 2].percent),
    );
    expect(within(log()).queryByText(/Welcome, guest/)).toBeNull();
    rerender(<Terminal holdBoot={false} />);
    expect(within(log()).getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "100",
    );
    act(() => {
      vi.advanceTimersByTime(BOOT_REDUCED_HOLD_MS);
    });
    expect(within(log()).getByText(/Welcome, guest/)).toBeInTheDocument();
  });
});

describe("Terminal boot latch", () => {
  it("does not fall back once the boot has completed", () => {
    const { rerender } = renderBooted(<Terminal holdBoot={false} />);
    rerender(<Terminal holdBoot={true} />);
    expect(within(log()).getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "100",
    );
    expect(within(log()).getByText(/Welcome, guest/)).toBeInTheDocument();
  });

  it("ignores Escape while an IME composition is active", () => {
    const onOpenProjectChange = vi.fn();
    renderBooted(<Terminal onOpenProjectChange={onOpenProjectChange} />);
    type("open flashi");
    fireEvent.keyDown(window, { key: "Escape", isComposing: true });
    expect(onOpenProjectChange).toHaveBeenLastCalledWith("flashi");
  });
});

describe("Terminal boot sequence", () => {
  beforeEach(() => {
    mockReducedMotion(false);
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
    act(() => {
      vi.advanceTimersByTime(BOOT_HOLD_MS);
    });
    act(() => {
      vi.advanceTimersByTime(BOOT_GLIDE_MS);
    });
    expect(within(log()).getByText(/Welcome, guest/)).toBeInTheDocument();
  });

  it("shows only the centred boot splash while booting, without a prompt", () => {
    render(<Terminal />);
    expect(document.querySelector("[data-boot-phase]")).toHaveAttribute(
      "data-boot-phase",
      "splash",
    );
    expect(
      screen.queryByRole("textbox", { name: "terminal input" }),
    ).toBeNull();
  });

  it("glides the splash up and then shows the ready prompt", () => {
    render(<Terminal />);
    act(() => {
      vi.advanceTimersByTime(BOOT_STEP_MS * bootSteps.length);
    });
    expect(phase()).toBe("splash");
    expect(within(log()).getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "100",
    );
    act(() => {
      vi.advanceTimersByTime(BOOT_HOLD_MS);
    });
    expect(phase()).toBe("glide");
    act(() => {
      vi.advanceTimersByTime(BOOT_GLIDE_MS);
    });
    expect(document.querySelector("[data-boot-phase]")).toHaveAttribute(
      "data-boot-phase",
      "ready",
    );
    expect(input()).toHaveFocus();
  });

  it("skips the boot sequence on a key press", () => {
    render(<Terminal />);
    act(() => {
      fireEvent.keyDown(window, { key: "x" });
    });
    expect(phase()).toBe("ready");
    expect(within(log()).getByText(/Welcome, guest/)).toBeInTheDocument();
  });

  it("boots again for returning visitors", () => {
    const first = render(<Terminal />);
    act(() => {
      vi.advanceTimersByTime(
        BOOT_STEP_MS * bootSteps.length + BOOT_HOLD_MS + BOOT_GLIDE_MS,
      );
    });
    first.unmount();
    render(<Terminal />);
    expect(phase()).toBe("splash");
  });
});
