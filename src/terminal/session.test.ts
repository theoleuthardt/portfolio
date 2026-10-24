import { describe, expect, it } from "vitest";
import { bootLines } from "./boot";
import { cancel, clearScreen, createSession, submit } from "./session";

describe("session", () => {
  const fresh = createSession();

  it("starts with the boot output and no open project", () => {
    expect(fresh.log).toEqual([{ id: 0, lines: bootLines }]);
    expect(fresh.openProjectId).toBeUndefined();
  });

  it("appends the command and its output to the log", () => {
    const { session } = submit(fresh, "ls");
    const entry = session.log[session.log.length - 1];
    expect(entry.command).toBe("ls");
    expect(entry.lines.length).toBeGreaterThan(0);
    expect(entry.id).toBe(1);
  });

  it("records commands in the history, including the current one", () => {
    const { session } = submit(submit(fresh, "ls").session, "history");
    expect(session.history.entries).toEqual(["ls", "history"]);
    expect(session.log[session.log.length - 1].lines).toEqual([
      { kind: "text", text: "  1  ls" },
      { kind: "text", text: "  2  history" },
    ]);
  });

  it("shows an empty prompt for blank input without recording it", () => {
    const { session } = submit(fresh, "  ");
    expect(session.log[session.log.length - 1]).toEqual({
      id: 1,
      command: "",
      cwd: "~",
      lines: [],
    });
    expect(session.history.entries).toEqual([]);
  });

  it("opens a project, shows its screen and reports the action", () => {
    const { session, action } = submit(fresh, "open flashi");
    expect(action).toEqual({ type: "open", projectId: "flashi" });
    expect(session.openProjectId).toBe("flashi");
    expect(session.log[session.log.length - 1].projectId).toBe("flashi");
  });

  it("closes the open project", () => {
    const opened = submit(fresh, "open flashi").session;
    const { session, action } = submit(opened, "close");
    expect(action).toEqual({ type: "close" });
    expect(session.openProjectId).toBeUndefined();
  });

  it("clears the log but keeps the history", () => {
    const { session } = submit(submit(fresh, "ls").session, "clear");
    expect(session.log).toEqual([]);
    expect(session.history.entries).toEqual(["ls", "clear"]);
  });

  it("keeps ids unique after clearing", () => {
    const cleared = submit(submit(fresh, "ls").session, "clear").session;
    const { session } = submit(cleared, "help");
    expect(session.log[0].id).toBe(3);
  });

  it("closes the open project when the log is cleared", () => {
    const opened = submit(fresh, "open flashi").session;
    expect(submit(opened, "clear").session.openProjectId).toBeUndefined();
  });
});

describe("session bash behaviour", () => {
  const fresh = createSession();

  it("expands !! and echoes the expanded command", () => {
    const afterLs = submit(fresh, "ls").session;
    const { session } = submit(afterLs, "!!");
    const entry = session.log[session.log.length - 1];
    expect(entry.command).toBe("!!");
    expect(entry.lines[0]).toEqual({ kind: "muted", text: "ls" });
    expect(session.history.entries).toEqual(["ls"]);
  });

  it("reports an unknown history event", () => {
    const { session } = submit(fresh, "!7");
    expect(session.log[session.log.length - 1].lines).toEqual([
      { kind: "error", text: "!7: event not found" },
    ]);
  });

  it("changes the working directory and remembers it per entry", () => {
    const { session } = submit(fresh, "cd projects");
    expect(session.cwd).toBe("~/projects");
    const next = submit(session, "pwd").session;
    expect(next.log[next.log.length - 1].cwd).toBe("~/projects");
  });

  it("cancels a line with Ctrl+C without recording it", () => {
    const session = cancel(fresh, "open fla");
    expect(session.log[session.log.length - 1].command).toBe("open fla^C");
    expect(session.history.entries).toEqual([]);
  });

  it("clears the screen with Ctrl+L and keeps the history", () => {
    const withLs = submit(fresh, "ls").session;
    expect(clearScreen(withLs).log).toEqual([]);
    expect(clearScreen(withLs).history.entries).toEqual(["ls"]);
  });
});
