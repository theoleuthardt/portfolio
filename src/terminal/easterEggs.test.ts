import { describe, expect, it } from "vitest";
import { projects } from "../content/projects";
import { run, type CommandContext } from "./commands";
import { FORTUNES } from "./easterEggs";

const startedAt = new Date(Date.UTC(2026, 9, 24, 18, 0, 0));
const now = new Date(Date.UTC(2026, 9, 24, 18, 5, 9));
const home: CommandContext = { history: [], now, startedAt };
const texts = (input: string, context = home) =>
  run(input, context).lines.map((line) =>
    "text" in line ? line.text : line.kind,
  );

describe("neofetch", () => {
  it("shows the logo next to the system facts and the stack", () => {
    const lines = texts("neofetch");
    expect(lines.some((line) => line.includes("guest@theocloud"))).toBe(true);
    expect(lines.some((line) => line.includes("OS: TheoCloud OS 2.6"))).toBe(
      true,
    );
    expect(lines.some((line) => line.includes("Uptime: 5 mins"))).toBe(true);
    expect(
      lines.some((line) => line.includes(`Projects: ${projects.length}`)),
    ).toBe(true);
    expect(lines.some((line) => line.includes("TypeScript"))).toBe(true);
  });
});

describe("sudo", () => {
  it("refuses politely, and makes the sandwich", () => {
    expect(texts("sudo ls")).toEqual([
      "[sudo] password for guest: ",
      "guest is not in the sudoers file. This incident will be reported.",
      "(it was reported to the coffee machine)",
    ]);
    expect(run("sudo ls", home).state.status).toBe(1);
    expect(texts("sudo make me a sandwich")).toEqual(["okay."]);
    expect(texts("sudo")).toEqual(["usage: sudo command"]);
  });
});

describe("rm", () => {
  it("refuses to delete anything, with a special answer for the root", () => {
    expect(texts("rm todo.txt")).toEqual([
      "rm: cannot remove 'todo.txt': Read-only file system",
      "the lab keeps everything. nice try.",
    ]);
    expect(texts("rm -rf /")).toEqual([
      "rm: it is dangerous to operate recursively on '/'",
      "rm: use --no-preserve-root to override this failsafe",
      "(please don't)",
    ]);
    expect(texts("rm")).toEqual(["rm: missing operand"]);
  });
});

describe("fortune and cowsay", () => {
  it("tells one of the fortunes", () => {
    const [line] = texts("fortune");
    expect(FORTUNES).toContain(line);
  });

  it("puts the text in a speech bubble above a cow, also from a pipe", () => {
    const lines = texts("cowsay moo");
    expect(lines[0]).toBe(" _____");
    expect(lines[1]).toBe("< moo >");
    expect(lines[2]).toBe(" -----");
    expect(lines.some((line) => line.includes("(oo)"))).toBe(true);
    const piped = texts("echo hi there | cowsay");
    expect(piped[1]).toBe("< hi there >");
  });

  it("wraps long text into a multi-line bubble", () => {
    const lines = texts(`cowsay ${"word ".repeat(20).trim()}`);
    expect(lines[1].startsWith("/ ")).toBe(true);
    expect(lines.some((line) => line.startsWith("\\ "))).toBe(true);
  });
});

describe("programs", () => {
  it("starts the matrix, the dino game and a hack", () => {
    expect(run("matrix", home).actions).toEqual([
      { type: "program", name: "matrix" },
    ]);
    expect(run("play dino", home).actions).toEqual([
      { type: "program", name: "dino" },
    ]);
    expect(run("hack nasa", home).actions).toEqual([
      { type: "program", name: "hack", target: "nasa" },
    ]);
    expect(texts("play chess")).toEqual([
      "play: chess: no such game (try: play dino)",
    ]);
    expect(texts("hack")).toEqual(["usage: hack <target>"]);
  });
});

describe("fun files", () => {
  it("hides a scavenger hunt in the file system", () => {
    const secret = texts("cat .secret");
    expect(secret.some((line) => line.includes("dinogame"))).toBe(true);
    const score = texts("cat projects/dinogame/highscore.txt");
    expect(score.some((line) => line.includes("~/notes"))).toBe(true);
    expect(texts("ls notes")).not.toContain(".last-note");
    const last = texts("cat notes/.last-note");
    expect(last.some((line) => line.includes("hack gibson"))).toBe(true);
    expect(texts("cat todo.txt")[0]).toMatch(/^\[x\] /);
  });

  it("points at the hidden files in the readme", () => {
    expect(texts("cat README.md").some((line) => line.includes("ls -a"))).toBe(
      true,
    );
  });
});
