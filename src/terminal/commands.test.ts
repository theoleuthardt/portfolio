import { describe, expect, it } from "vitest";
import { projects } from "../content/projects";
import { commandNames, run } from "./commands";

const context = { history: ["ls", "open flashi"] };

describe("run", () => {
  it("returns nothing for blank input", () => {
    const result = run("   ", context);
    expect(result.lines).toEqual([]);
    expect(result.actions).toEqual([]);
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

  it("shows the readme and the projects directory for ls at home", () => {
    expect(run("ls", context).lines).toEqual([
      { kind: "text", text: "README.md" },
      { kind: "dir", name: "projects/", command: "cd projects" },
    ]);
  });

  it("lists every project with its tagline: in rack order for projects, sorted for ls in projects/", () => {
    const ids = (input: string, cwd = "~") =>
      run(input, { ...context, cwd })
        .lines.filter((line) => line.kind === "project")
        .map((line) => line.kind === "project" && line.id);
    const rackOrder = projects.map((project) => project.id);
    expect(ids("projects")).toEqual(rackOrder);
    expect(ids("ls", "~/projects")).toEqual([...rackOrder].sort());
  });

  it("opens a known project and returns an open action", () => {
    const result = run("open Trust-Issues", context);
    expect(result.actions).toEqual([
      { type: "open", projectId: "trust-issues" },
    ]);
    expect(result.lines[0]).toEqual({
      kind: "muted",
      text: "> ejecting module trust-issues ... camera locked",
    });
  });

  it("offers the projects as a question when open has no argument", () => {
    const result = run("open", context);
    expect(result.actions).toEqual([]);
    expect(result.lines).toEqual([
      { kind: "text", text: "open which project?" },
      { kind: "chips", commands: projects.map((p) => `open ${p.id}`) },
    ]);
  });

  it("suggests the closest project for a misspelled name", () => {
    const result = run("open flahsi", context);
    expect(result.actions).toEqual([]);
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
    expect(run("close", context).actions).toEqual([{ type: "close" }]);
  });

  it("clears the screen", () => {
    const result = run("clear", context);
    expect(result.lines).toEqual([]);
    expect(result.actions).toEqual([{ type: "clear" }]);
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
      { kind: "error", text: "bash: hlep: command not found" },
      { kind: "muted", text: "did you mean:" },
      { kind: "chips", commands: ["help"] },
    ]);
  });

  it("reports unknown commands without a suggestion when nothing is close", () => {
    expect(run("xyzzy -rf /", context).lines).toEqual([
      { kind: "error", text: "bash: xyzzy: command not found" },
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
        text: `bash: ${name}: command not found`,
      });
    }
  });
});
