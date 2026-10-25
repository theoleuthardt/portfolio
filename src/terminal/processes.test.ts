import { describe, expect, it } from "vitest";
import { projects } from "../content/projects";
import { run, type CommandContext } from "./commands";
import { COFFEE_PID, processTable, topScreen } from "./processes";

const startedAt = new Date(Date.UTC(2026, 9, 24, 18, 0, 0));
const now = new Date(Date.UTC(2026, 9, 24, 18, 5, 9));
const context: CommandContext = { history: [], now, startedAt };
const texts = (input: string, extra: Partial<CommandContext> = {}) =>
  run(input, { ...context, ...extra }).lines.map((line) =>
    "text" in line ? line.text : line.kind,
  );
const pidOf = (name: string) =>
  processTable([], 0).find((process) => process.name === name)?.pid;

describe("processTable", () => {
  it("runs the system, the lab's daemons and one process per project", () => {
    const names = processTable([], 0).map((process) => process.name);
    for (const name of [
      "systemd",
      "bash",
      "coffee-daemon",
      "procrastinatord",
      "rgb-lighting",
      "dino",
    ]) {
      expect(names).toContain(name);
    }
    for (const project of projects) {
      expect(names).toContain(project.id);
    }
    const pids = processTable([], 0).map((process) => process.pid);
    expect(new Set(pids).size).toBe(pids.length);
  });

  it("leaves out killed processes and moves the load a little over time", () => {
    expect(processTable([COFFEE_PID], 0).map((p) => p.pid)).not.toContain(
      COFFEE_PID,
    );
    const cpu = (seconds: number) =>
      processTable([], seconds).find((p) => p.pid === COFFEE_PID)?.cpu;
    expect(cpu(1)).not.toBe(cpu(2));
  });
});

describe("ps", () => {
  it("shows the shell's processes, and everything with aux", () => {
    expect(texts("ps")[0]).toBe("    PID TTY          TIME CMD");
    expect(texts("ps").some((line) => line.endsWith(" bash"))).toBe(true);
    const all = texts("ps aux");
    expect(all[0]).toMatch(/^USER +PID +%CPU +%MEM .*COMMAND$/);
    expect(all.some((line) => line.includes("coffee-daemon"))).toBe(true);
    expect(all.some((line) => line.includes(projects[0].id))).toBe(true);
  });
});

describe("kill", () => {
  it("stops a daemon, which disappears from the table", () => {
    const result = run(`kill ${COFFEE_PID}`, context);
    expect(result.state.killed).toEqual([COFFEE_PID]);
    expect(result.lines[0]).toMatchObject({ kind: "muted" });
    expect(
      texts("ps aux", { killed: result.state.killed }).some((line) =>
        line.includes("coffee-daemon"),
      ),
    ).toBe(false);
  });

  it("ejects a project's module instead of killing it", () => {
    const result = run(`kill ${pidOf(projects[1].id)}`, context);
    expect(result.actions).toEqual([
      { type: "open", projectId: projects[1].id },
    ]);
    expect(result.state.killed).toEqual([]);
  });

  it("refuses init, keeps procrastinating and reports bad ids like bash", () => {
    expect(texts("kill 1")).toEqual([
      "bash: kill: (1) - Operation not permitted",
    ]);
    expect(texts("kill 99999")).toEqual([
      "bash: kill: (99999) - No such process",
    ]);
    expect(texts("kill abc")).toEqual([
      "bash: kill: abc: arguments must be process or job IDs",
    ]);
    expect(texts("kill")).toEqual([
      "kill: usage: kill [-s sigspec | -n signum | -sigspec] pid | jobspec ... or kill -l [sigspec]",
    ]);
    const lazy = run(`kill -9 ${pidOf("procrastinatord")}`, context);
    expect(lazy.state.killed).toEqual([]);
  });

  it("kills by name with killall", () => {
    expect(run("killall coffee-daemon", context).state.killed).toEqual([
      COFFEE_PID,
    ]);
    expect(texts("killall nope")).toEqual(["nope: no process found"]);
  });
});

describe("uptime and free", () => {
  it("prints the uptime since the session started and the load", () => {
    expect(texts("uptime")[0]).toMatch(
      /^ 18:05:09 up 5 min, {2}1 user, {2}load average: \d\.\d\d, \d\.\d\d, \d\.\d\d$/,
    );
  });

  it("prints the memory, -h in human units", () => {
    const human = texts("free -h");
    expect(human[0]).toMatch(/total +used +free/);
    expect(human[1]).toMatch(/^Mem: +16Gi/);
    expect(human[2]).toMatch(/^Swap:/);
  });
});

describe("top", () => {
  it("starts the live process view", () => {
    expect(run("top", context).actions).toEqual([
      { type: "program", name: "top" },
    ]);
    expect(run("htop", context).actions).toEqual([
      { type: "program", name: "top" },
    ]);
  });

  it("draws a header and the processes sorted by CPU", () => {
    const screen = topScreen({ killed: [], now, startedAt });
    expect(screen[0]).toMatch(
      /^top - 18:05:09 up 5 min, {2}1 user, {2}load average:/,
    );
    expect(screen[1]).toMatch(/^Tasks: +\d+ total/);
    const header = screen.findIndex((line) =>
      line.trimStart().startsWith("PID"),
    );
    expect(header).toBeGreaterThan(2);
    const cpus = screen
      .slice(header + 1)
      .map((line) => Number(line.trim().split(/\s+/)[8]));
    expect(cpus).toEqual([...cpus].sort((a, b) => b - a));
  });

  it("gets calmer once the coffee daemon is gone", () => {
    const load = (killed: number[]) =>
      Number(
        /load average: (\d\.\d\d)/.exec(
          topScreen({ killed, now, startedAt })[0],
        )?.[1],
      );
    expect(load([COFFEE_PID])).toBeLessThan(load([]));
  });
});

describe("kill with several pids", () => {
  it("handles every pid, also when one of them is a project", () => {
    const result = run(
      `kill 99999 ${COFFEE_PID} ${pidOf(projects[0].id)}`,
      context,
    );
    expect(result.lines.map((line) => line.kind)).toEqual([
      "error",
      "muted",
      "muted",
    ]);
    expect(result.state.killed).toEqual([COFFEE_PID]);
    expect(result.actions).toEqual([
      { type: "open", projectId: projects[0].id },
    ]);
    expect(result.state.status).toBe(1);
  });
});
