import { describe, expect, it } from "vitest";
import { projects } from "../content/projects";
import { commandNames, run } from "./commands";

const context = { history: ["ls", "open flashi"] };

describe("run", () => {
  it("returns nothing for blank input", () => {
    expect(run("   ", context)).toEqual({ lines: [] });
  });

  it("explains every command in help", () => {
    const described = run("help", context).lines.filter(
      (line) => line.kind === "command",
    );
    expect(
      described.map((line) => line.kind === "command" && line.name),
    ).toEqual(commandNames);
    for (const line of described) {
      expect(
        line.kind === "command" && line.description.length,
      ).toBeGreaterThan(10);
    }
  });

  it("shows the arguments a command takes in help", () => {
    const open = run("help", context).lines.find(
      (line) => line.kind === "command" && line.name === "open",
    );
    expect(open).toMatchObject({ usage: "open <project>" });
  });

  it("lists every project with its tagline for ls and projects", () => {
    for (const input of ["ls", "projects"]) {
      const listed = run(input, context).lines.filter(
        (line) => line.kind === "project",
      );
      expect(listed.map((line) => line.kind === "project" && line.id)).toEqual(
        projects.map((project) => project.id),
      );
    }
  });

  it("opens a known project and returns an open action", () => {
    const result = run("open Trust-Issues", context);
    expect(result.action).toEqual({ type: "open", projectId: "trust-issues" });
    expect(result.lines[0]).toEqual({
      kind: "muted",
      text: "> ejecting module trust-issues ... camera locked",
    });
  });

  it("asks for a project name when open has no argument", () => {
    const result = run("open", context);
    expect(result.action).toBeUndefined();
    expect(result.lines[0].kind).toBe("error");
  });

  it("suggests the closest project for a misspelled name", () => {
    const result = run("open flahsi", context);
    expect(result.action).toBeUndefined();
    expect(result.lines).toContainEqual({
      kind: "error",
      text: "open: no such project: flahsi",
    });
    expect(result.lines).toContainEqual({
      kind: "chips",
      commands: ["open flashi"],
    });
  });

  it("closes the open project", () => {
    expect(run("close", context).action).toEqual({ type: "close" });
  });

  it("clears the screen", () => {
    expect(run("clear", context)).toEqual({
      lines: [],
      action: { type: "clear" },
    });
  });

  it("prints the numbered history", () => {
    expect(run("history", context).lines).toEqual([
      { kind: "text", text: "  1  ls" },
      { kind: "text", text: "  2  open flashi" },
    ]);
  });

  it("reports unknown commands and suggests the closest one", () => {
    const result = run("hlep", context);
    expect(result.lines).toEqual([
      { kind: "error", text: "command not found: hlep" },
      { kind: "muted", text: "did you mean:" },
      { kind: "chips", commands: ["help"] },
    ]);
  });

  it("reports unknown commands without a suggestion when nothing is close", () => {
    expect(run("rm -rf /", context).lines).toEqual([
      { kind: "error", text: "command not found: rm" },
      { kind: "muted", text: "type 'help' for a list of commands" },
    ]);
  });

  it("does not treat inherited object properties as commands", () => {
    for (const name of [
      "constructor",
      "toString",
      "__proto__",
      "hasOwnProperty",
    ]) {
      expect(run(name, context).lines[0]).toEqual({
        kind: "error",
        text: `command not found: ${name.toLowerCase()}`,
      });
    }
  });
});
