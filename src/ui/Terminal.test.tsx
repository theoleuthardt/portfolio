import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { createRef, type ReactElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bootSteps } from "../terminal/boot";
import { HACK_DURATION_MS } from "../terminal/hack";
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

  it("starts over with Tab after a command was run", () => {
    renderBooted(<Terminal />);
    fireEvent.keyDown(input(), { key: "Tab" });
    fireEvent.keyDown(input(), { key: "Enter" });
    expect(fireEvent.keyDown(input(), { key: "Tab" })).toBe(false);
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

describe("Terminal tab title", () => {
  it("follows the boot and the open project", () => {
    render(<Terminal />);
    expect(document.title).toBe("TheoCloud OS · booting 100%");
    act(() => {
      vi.advanceTimersByTime(BOOT_REDUCED_HOLD_MS);
    });
    expect(document.title).toBe("guest@theocloud:~$ █");
    type("open flashi");
    expect(document.title).toBe("guest@theocloud:~$ open flashi");
  });

  it("loses the signal while the tab is hidden", () => {
    renderBooted(<Terminal />);
    vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(document.title).toBe("▓ signal lost · theocloud");
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

describe("Terminal links to friends", () => {
  it("opens a friend's site in a new tab", () => {
    const open = vi.fn();
    vi.stubGlobal("open", open);
    renderBooted(<Terminal />);
    type("open domifolio");
    expect(open).toHaveBeenCalledWith(
      "https://diewilhelms.de/",
      "_blank",
      "noopener,noreferrer",
    );
    expect(
      within(log()).getByText("> opening DomiFolio in a new tab ..."),
    ).toBeInTheDocument();
  });

  it("shows the site as a link that opens in a new tab", () => {
    renderBooted(<Terminal />);
    type("domi");
    const link = within(log()).getByRole("link", { name: /DomiFolio/ });
    expect(link).toHaveAttribute("href", "https://diewilhelms.de/");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("completes the site after open with Tab", () => {
    renderBooted(<Terminal />);
    fireEvent.change(input(), { target: { value: "open dom" } });
    fireEvent.keyDown(input(), { key: "Tab" });
    expect(input()).toHaveValue("open domifolio");
  });
});

describe("Terminal shell", () => {
  it("shows the working directory in the prompt after cd", () => {
    renderBooted(<Terminal />);
    type("cd projects/flashi");
    expect(
      screen.getByText("guest@theocloud:~/projects/flashi$"),
    ).toBeInTheDocument();
  });

  it("searches the history backwards with Ctrl+R and runs the hit with Enter", () => {
    renderBooted(<Terminal />);
    type("open flashi");
    type("close");
    type("pwd");
    fireEvent.keyDown(input(), { key: "r", ctrlKey: true });
    fireEvent.change(input(), { target: { value: "fla" } });
    expect(screen.getByText("(reverse-i-search)`fla':")).toBeInTheDocument();
    expect(
      screen.getByText("open flashi", { selector: ".crt-search-hit" }),
    ).toBeInTheDocument();
    fireEvent.keyDown(input(), { key: "Enter" });
    expect(within(log()).getAllByText("open flashi")).toHaveLength(2);
  });

  it("goes further back with another Ctrl+R and gives up with Escape", () => {
    renderBooted(<Terminal />);
    type("open flashi");
    type("open dinogame");
    fireEvent.keyDown(input(), { key: "r", ctrlKey: true });
    fireEvent.change(input(), { target: { value: "open" } });
    expect(
      screen.getByText("open dinogame", { selector: ".crt-search-hit" }),
    ).toBeInTheDocument();
    fireEvent.keyDown(input(), { key: "r", ctrlKey: true });
    expect(
      screen.getByText("open flashi", { selector: ".crt-search-hit" }),
    ).toBeInTheDocument();
    fireEvent.keyDown(input(), { key: "Escape" });
    expect(screen.queryByText(/reverse-i-search/)).toBeNull();
    expect(input()).toHaveValue("open flashi");
  });
});

describe("Terminal top", () => {
  it("shows the live process view and returns to the prompt with q", () => {
    renderBooted(<Terminal />);
    type("top");
    const view = screen.getByRole("region", { name: "top" });
    expect(within(view).getByText(/PID USER/)).toBeInTheDocument();
    expect(within(view).getByText(/coffee-daemon/)).toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: "terminal input" }),
    ).toBeNull();
    fireEvent.keyDown(view, { key: "q" });
    expect(screen.queryByRole("region", { name: "top" })).toBeNull();
    expect(input()).toHaveFocus();
  });

  it("refreshes every second without reduced motion and quits with Ctrl+C", () => {
    mockReducedMotion(false);
    renderBooted(<Terminal />);
    act(() => {
      fireEvent.keyDown(window, { key: "x" });
    });
    type("top");
    const view = screen.getByRole("region", { name: "top" });
    const first = view.textContent;
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(view.textContent).not.toBe(first);
    fireEvent.keyDown(view, { key: "c", ctrlKey: true });
    expect(screen.queryByRole("region", { name: "top" })).toBeNull();
  });

  it("no longer lists a killed daemon", () => {
    renderBooted(<Terminal />);
    type("killall coffee-daemon");
    type("top");
    expect(
      within(screen.getByRole("region", { name: "top" })).queryByText(
        /coffee-daemon/,
      ),
    ).toBeNull();
  });
});

describe("Terminal browser shortcuts", () => {
  it("leaves Ctrl+Shift shortcuts like the hard reload to the browser", () => {
    renderBooted(<Terminal />);
    for (const key of ["R", "K", "L"]) {
      expect(
        fireEvent.keyDown(input(), { key, ctrlKey: true, shiftKey: true }),
      ).toBe(true);
    }
    expect(screen.queryByText(/reverse-i-search/)).toBeNull();
  });
});

describe("Terminal programs", () => {
  it("runs a hack, reports it and aborts it with Ctrl+C", () => {
    const onProgramChange = vi.fn();
    renderBooted(<Terminal onProgramChange={onProgramChange} />);
    type("hack nasa");
    const view = screen.getByRole("region", { name: "hack" });
    expect(onProgramChange).toHaveBeenLastCalledWith({
      name: "hack",
      target: "nasa",
    });
    expect(
      screen.queryByRole("textbox", { name: "terminal input" }),
    ).toBeNull();
    fireEvent.keyDown(view, { key: "c", ctrlKey: true });
    expect(screen.queryByRole("region", { name: "hack" })).toBeNull();
    expect(within(log()).getByText("^C")).toBeInTheDocument();
    expect(
      within(log()).getByText("connection reset by peer"),
    ).toBeInTheDocument();
    expect(onProgramChange).toHaveBeenLastCalledWith(undefined);
    expect(input()).toHaveFocus();
  });

  it("finishes a hack on its own and leaves the ending in the log", () => {
    renderBooted(<Terminal />);
    type("hack gibson");
    act(() => {
      vi.advanceTimersByTime(HACK_DURATION_MS + 1000);
    });
    expect(screen.queryByRole("region", { name: "hack" })).toBeNull();
    expect(
      within(log()).getByText("ACCESS GRANTED: gibson"),
    ).toBeInTheDocument();
    expect(
      within(log()).getByText("Hack the planet! Hack the planet!"),
    ).toBeInTheDocument();
  });

  it("shows the matrix until q", () => {
    const onProgramChange = vi.fn();
    renderBooted(<Terminal onProgramChange={onProgramChange} />);
    type("matrix");
    expect(onProgramChange).toHaveBeenLastCalledWith({ name: "matrix" });
    const view = screen.getByRole("region", { name: "matrix" });
    fireEvent.keyDown(view, { key: "q" });
    expect(onProgramChange).toHaveBeenLastCalledWith(undefined);
    expect(screen.queryByRole("region", { name: "matrix" })).toBeNull();
    expect(input()).toHaveFocus();
  });

  it("plays dino: space jumps, q quits", () => {
    const onProgramChange = vi.fn();
    renderBooted(<Terminal onProgramChange={onProgramChange} />);
    type("play dino");
    expect(onProgramChange).toHaveBeenLastCalledWith({ name: "dino" });
    const view = screen.getByRole("region", { name: "dino game" });
    const before = view.textContent;
    fireEvent.keyDown(view, { key: " " });
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(view.textContent).not.toBe(before);
    fireEvent.keyDown(view, { key: "q" });
    expect(screen.queryByRole("region", { name: "dino game" })).toBeNull();
  });

  it("keeps a program's output under the line that started it", () => {
    const ref = createRef<TerminalHandle>();
    renderBooted(<Terminal ref={ref} />);
    type("hack nasa");
    act(() => ref.current?.run("open flashi"));
    fireEvent.keyDown(screen.getByRole("region", { name: "hack" }), {
      key: "c",
      ctrlKey: true,
    });
    const text = log().textContent ?? "";
    expect(text.indexOf("^C")).toBeGreaterThan(text.indexOf("hack nasa"));
    expect(text.indexOf("^C")).toBeLessThan(text.indexOf("open flashi"));
  });
});

describe("Terminal world map", () => {
  const world = {
    land: [[-100, 0, 100, 0]],
    borders: [],
    countries: [["Testland", 0, 0, 1]],
    cities: [],
  };

  it("opens the map, pans and zooms with the keyboard and quits with q", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => world })),
    );
    renderBooted(<Terminal />);
    vi.useRealTimers();
    type("map");
    const view = await screen.findByRole("region", { name: "world map" });
    expect(
      await within(view).findByText("center: 20.00, 0.00 zoom: 1"),
    ).toBeInTheDocument();
    fireEvent.keyDown(view, { key: "+" });
    expect(within(view).getByText(/zoom: 2$/)).toBeInTheDocument();
    fireEvent.keyDown(view, { key: "ArrowRight" });
    expect(within(view).queryByText(/center: 20.00, 0.00/)).toBeNull();
    expect(within(view).getByText(/World map centred on/)).toBeInTheDocument();
    fireEvent.keyDown(view, { key: "q" });
    expect(screen.queryByRole("region", { name: "world map" })).toBeNull();
    expect(input()).toHaveFocus();
  });

  it("explains when the world data cannot load", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, json: async () => ({}) })),
    );
    renderBooted(<Terminal />);
    vi.useRealTimers();
    type("map");
    const view = await screen.findByRole("region", { name: "world map" });
    expect(
      await within(view).findByText("map: cannot load the world data"),
    ).toBeInTheDocument();
  });
});

describe("Terminal desktop", () => {
  const desktop = () => screen.getByRole("region", { name: "desktop" });
  const icon = (name: string) =>
    fireEvent.click(
      within(within(desktop()).getByRole("list", { name: "apps" })).getByRole(
        "button",
        { name },
      ),
    );
  const taskbarButton = (name: string) =>
    within(desktop().querySelector("footer") ?? desktop()).getByRole("button", {
      name,
    });

  function closeTerminal(ui: ReactElement = <Terminal />) {
    const result = renderBooted(ui);
    fireEvent.click(screen.getByRole("button", { name: "close terminal" }));
    vi.useRealTimers();
    return result;
  }

  it("opens a project from the Projects app and tells the page", () => {
    const onOpenProjectChange = vi.fn();
    closeTerminal(<Terminal onOpenProjectChange={onOpenProjectChange} />);
    icon("Projects");
    const projects = screen.getByRole("region", { name: "Projects" });
    fireEvent.click(within(projects).getByRole("button", { name: "flashi" }));
    expect(
      within(projects).getByRole("heading", { name: "Flashi" }),
    ).toBeInTheDocument();
    expect(onOpenProjectChange).toHaveBeenLastCalledWith("flashi");
  });

  it("leaves the project screen to the page where it shows projects itself", () => {
    closeTerminal(<Terminal inlineProjectScreens={false} />);
    icon("Projects");
    const projects = screen.getByRole("region", { name: "Projects" });
    fireEvent.click(within(projects).getByRole("button", { name: "flashi" }));
    expect(within(projects).queryByRole("heading")).toBeNull();
  });

  it("opens a note in a viewer window", () => {
    closeTerminal();
    icon("Notes");
    fireEvent.click(
      within(screen.getByRole("list", { name: "notes" })).getByRole("button", {
        name: "todo.txt",
      }),
    );
    expect(
      within(screen.getByRole("region", { name: "~/todo.txt" })).getByText(
        /\[ \] sleep/,
      ),
    ).toBeInTheDocument();
  });

  it("keeps the trash full and opens what is in it", () => {
    closeTerminal();
    icon("Trash");
    const trash = screen.getByRole("region", { name: "Trash" });
    fireEvent.click(within(trash).getByRole("button", { name: "empty trash" }));
    expect(within(trash).getByRole("status")).toHaveTextContent(
      "the lab keeps everything. nice try.",
    );
    fireEvent.click(within(trash).getByRole("button", { name: "sleep.exe" }));
    expect(
      within(screen.getByRole("region", { name: "sleep.exe" })).getByText(
        /permission denied/,
      ),
    ).toBeInTheDocument();
  });

  it("minimizes, restores, cycles and closes windows", () => {
    closeTerminal();
    icon("About");
    icon("Processes");
    expect(taskbarButton("Processes")).toHaveAttribute("aria-pressed", "true");
    fireEvent.keyDown(desktop(), { key: "Tab", altKey: true });
    expect(taskbarButton("About")).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "minimize About" }));
    expect(screen.queryByRole("region", { name: "About" })).toBeNull();
    expect(taskbarButton("Processes")).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(taskbarButton("About"));
    expect(screen.getByRole("region", { name: "About" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "close About" }));
    expect(screen.queryByRole("region", { name: "About" })).toBeNull();
    expect(
      within(desktop().querySelector("footer") ?? desktop()).queryByRole(
        "button",
        { name: "About" },
      ),
    ).toBeNull();
  });

  it("opens and closes the start menu, which has no stand up without a desk", () => {
    closeTerminal();
    const start = screen.getByRole("button", { name: "TheoCloud" });
    fireEvent.click(start);
    expect(start).toHaveAttribute("aria-expanded", "true");
    const menu = screen.getByRole("navigation", { name: "start menu" });
    expect(within(menu).queryByRole("button", { name: "Stand up" })).toBeNull();
    expect(
      screen.queryByRole("button", { name: "stand up from the desk" }),
    ).toBeNull();
    fireEvent.keyDown(menu, { key: "Escape" });
    expect(start).toHaveAttribute("aria-expanded", "false");
  });

  it("returns to the terminal with its session from a minimized one", () => {
    renderBooted(<Terminal />);
    type("cd projects");
    fireEvent.click(screen.getByRole("button", { name: "minimize terminal" }));
    vi.useRealTimers();
    fireEvent.click(taskbarButton("terminal"));
    expect(input()).toHaveFocus();
    expect(screen.getByText("guest@theocloud: ~/projects")).toBeInTheDocument();
  });

  it("ends a running program with a hangup when the terminal leaves the screen", () => {
    const onProgramChange = vi.fn();
    renderBooted(<Terminal onProgramChange={onProgramChange} />);
    type("hack mainframe");
    expect(onProgramChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ name: "hack" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "minimize terminal" }));
    expect(onProgramChange).toHaveBeenLastCalledWith(undefined);
    vi.useRealTimers();
    fireEvent.click(taskbarButton("terminal"));
    expect(input()).toHaveFocus();
    expect(within(log()).getByText("Hangup")).toBeInTheDocument();
  });

  it("scrolls the log to its end when the terminal comes back", () => {
    const scrollTo = vi.fn();
    HTMLElement.prototype.scrollTo = scrollTo;
    try {
      renderBooted(<Terminal />);
      fireEvent.click(
        screen.getByRole("button", { name: "minimize terminal" }),
      );
      vi.useRealTimers();
      scrollTo.mockClear();
      fireEvent.click(taskbarButton("terminal"));
      expect(scrollTo).toHaveBeenCalled();
    } finally {
      Reflect.deleteProperty(HTMLElement.prototype, "scrollTo");
    }
  });

  it("cycles windows with Alt+Backquote, which browsers let through", () => {
    closeTerminal();
    icon("About");
    icon("Processes");
    fireEvent.keyDown(desktop(), { key: "`", code: "Backquote", altKey: true });
    expect(taskbarButton("About")).toHaveAttribute("aria-pressed", "true");
  });

  it("closes the start menu when standing up from it", () => {
    closeTerminal(<Terminal onStandUp={vi.fn()} />);
    const start = screen.getByRole("button", { name: "TheoCloud" });
    fireEvent.click(start);
    fireEvent.click(
      within(screen.getByRole("navigation", { name: "start menu" })).getByRole(
        "button",
        { name: "Stand up" },
      ),
    );
    expect(start).toHaveAttribute("aria-expanded", "false");
  });

  it("lists the friends' sites in About", () => {
    closeTerminal();
    icon("About");
    expect(
      within(
        within(screen.getByRole("region", { name: "About" })).getByRole(
          "list",
          { name: "friends" },
        ),
      ).getByRole("link", { name: /DomiFolio/ }),
    ).toHaveAttribute("href", "https://diewilhelms.de/");
  });

  it("brings the terminal back when a command comes from outside", () => {
    const ref = createRef<TerminalHandle>();
    closeTerminal(<Terminal ref={ref} />);
    act(() => ref.current?.run("open flashi"));
    expect(input()).toBeInTheDocument();
    expect(within(log()).getByText("open flashi")).toBeInTheDocument();
  });
});
