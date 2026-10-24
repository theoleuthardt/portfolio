import { describe, expect, it } from "vitest";
import { tabTitle } from "./tabTitle";

const base = {
  phase: "ready" as const,
  percent: 100,
  cwd: "~" as const,
  hidden: false,
  cursorOn: true,
};

describe("tabTitle", () => {
  it("shows the boot progress while booting", () => {
    expect(tabTitle({ ...base, phase: "splash", percent: 46 })).toBe(
      "TheoCloud OS · booting 46%",
    );
    expect(tabTitle({ ...base, phase: "glide" })).toBe("TheoCloud OS · ready");
  });

  it("shows the prompt with a blinking cursor once ready", () => {
    expect(tabTitle(base)).toBe("guest@theocloud:~$ █");
    expect(tabTitle({ ...base, cursorOn: false })).toBe("guest@theocloud:~$ _");
    expect(tabTitle({ ...base, cwd: "~/projects" })).toBe(
      "guest@theocloud:~/projects$ █",
    );
  });

  it("shows the open project", () => {
    expect(tabTitle({ ...base, openProjectId: "flashi" })).toBe(
      "guest@theocloud:~$ open flashi",
    );
  });

  it("loses the signal while the tab is hidden", () => {
    expect(tabTitle({ ...base, hidden: true })).toBe(
      "▓ signal lost · theocloud",
    );
  });
});
