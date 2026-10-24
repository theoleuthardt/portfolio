import { describe, expect, it } from "vitest";
import { bootLines } from "./boot";
import { createSession, submit } from "./session";

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
