import { describe, expect, it } from "vitest";
import {
  HACK_ABORT,
  HACK_DURATION_MS,
  hackEnding,
  hackFrame,
  hackPhaseAt,
  hackSummary,
} from "./hack";

describe("hack timing", () => {
  it("lasts between 15 and 25 seconds", () => {
    expect(HACK_DURATION_MS).toBeGreaterThanOrEqual(15000);
    expect(HACK_DURATION_MS).toBeLessThanOrEqual(25000);
  });

  it("runs its phases in order and is done at the end", () => {
    const names: string[] = [];
    for (let ms = 0; ms < HACK_DURATION_MS; ms += 100) {
      const phase = hackPhaseAt(ms)?.name;
      if (phase && names[names.length - 1] !== phase) {
        names.push(phase);
      }
    }
    expect(names).toEqual([
      "scan",
      "dump",
      "crack",
      "firewall",
      "upload",
      "glitch",
      "granted",
    ]);
    expect(hackPhaseAt(HACK_DURATION_MS)).toBeUndefined();
    expect(hackFrame("nasa", HACK_DURATION_MS, false).done).toBe(true);
  });
});

describe("hackFrame", () => {
  const at = (phase: string) => {
    for (let ms = 0; ms < HACK_DURATION_MS; ms += 50) {
      if (hackPhaseAt(ms)?.name === phase) {
        return ms;
      }
    }
    throw new Error(`no ${phase}`);
  };

  it("scrolls through scanned hosts", () => {
    const early = hackFrame("nasa", at("scan") + 300, false).lines;
    const later = hackFrame("nasa", at("dump") - 50, false).lines;
    expect(later.join()).not.toBe(early.join());
    expect(later.some((line) => /port \d+ open/.test(line))).toBe(true);
  });

  it("locks in the password character by character", () => {
    const start = at("crack");
    const end = at("firewall") - 50;
    const locked = (ms: number) =>
      /locked (\d+)\/(\d+)/.exec(hackFrame("nasa", ms, false).lines.join("\n"));
    expect(Number(locked(start)?.[1])).toBe(0);
    expect(Number(locked(end)?.[1])).toBe(Number(locked(end)?.[2]));
  });

  it("flashes only in the glitch phase and never with reduced motion", () => {
    expect(hackFrame("nasa", at("glitch"), false).flash).toBe(true);
    expect(hackFrame("nasa", at("scan"), false).flash).toBe(false);
    expect(hackFrame("nasa", at("glitch"), true).flash).toBe(false);
  });

  it("shows calm summaries with reduced motion", () => {
    const lines = hackFrame("nasa", at("firewall"), true).lines;
    expect(lines).toContain("[ok] port scan: 3 open ports");
    expect(lines).toContain("[ok] password cracked");
    expect(lines.some((line) => line.startsWith("[..] firewall"))).toBe(true);
  });

  it("ends with a big ACCESS GRANTED", () => {
    const lines = hackFrame("nasa", at("granted") + 100, false).lines;
    expect(lines.join("\n")).toMatch(/ACCESS GRANTED/);
  });
});

describe("hack endings", () => {
  it("twists the ending per target", () => {
    expect(hackEnding("nasa").twist.join(" ")).toMatch(/coffee machine/);
    expect(hackEnding("gibson").twist.join(" ")).toMatch(/Hack the planet/);
    expect(hackEnding("localhost").twist.join(" ")).toMatch(/yourself/);
    expect(hackEnding("127.0.0.1")).toEqual(hackEnding("localhost"));
    expect(hackEnding("rack-01").twist.join(" ")).toMatch(/rack-01/);
    expect(hackEnding("somewhere").title).toMatch(/somewhere/);
  });

  it("leaves a summary in the log and a reset on abort", () => {
    expect(hackSummary("gibson")[0]).toBe("ACCESS GRANTED: gibson");
    expect(HACK_ABORT).toEqual(["^C", "connection reset by peer"]);
  });
});
