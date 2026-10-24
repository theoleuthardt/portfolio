import { describe, expect, it } from "vitest";
import { complete } from "./complete";

const commands = [
  "clear",
  "close",
  "help",
  "history",
  "ls",
  "open",
  "projects",
];
const projectIds = ["backlog-manager", "trust-issues", "flashi", "dinogame"];

describe("complete", () => {
  it("completes a unique command prefix with a trailing space", () => {
    expect(complete("hel", commands, projectIds)).toEqual({
      input: "help ",
      options: ["help"],
    });
  });

  it("extends to the common prefix and lists the options when ambiguous", () => {
    expect(complete("cl", commands, projectIds)).toEqual({
      input: "cl",
      options: ["clear", "close"],
    });
    expect(complete("h", commands, projectIds)).toEqual({
      input: "h",
      options: ["help", "history"],
    });
  });

  it("completes project ids after open", () => {
    expect(complete("open tru", commands, projectIds)).toEqual({
      input: "open trust-issues",
      options: ["trust-issues"],
    });
  });

  it("lists every project after open with an empty argument", () => {
    expect(complete("open ", commands, projectIds).options).toEqual(
      [...projectIds].sort(),
    );
  });

  it("leaves input unchanged when nothing matches", () => {
    expect(complete("xyz", commands, projectIds)).toEqual({
      input: "xyz",
      options: [],
    });
  });

  it("does not complete arguments of commands without arguments", () => {
    expect(complete("help tru", commands, projectIds)).toEqual({
      input: "help tru",
      options: [],
    });
  });

  it("completes the projects directory after cd and ls", () => {
    expect(complete("cd pro", commands, projectIds)).toEqual({
      input: "cd projects/",
      options: ["projects/"],
    });
    expect(complete("ls p", commands, projectIds).input).toBe("ls projects/");
  });

  it("completes project ids after cat and command names after man", () => {
    expect(complete("cat fla", commands, projectIds).input).toBe("cat flashi");
    expect(complete("man hist", commands, projectIds).input).toBe(
      "man history",
    );
  });

  it("lists every command for an empty line", () => {
    expect(complete("", commands, projectIds)).toEqual({
      input: "",
      options: [...commands].sort(),
    });
  });

  it("lists ambiguous options alphabetically like a shell", () => {
    expect(complete("c", ["close", "clear"], projectIds).options).toEqual([
      "clear",
      "close",
    ]);
  });
});

describe("complete with inherited object property names", () => {
  it("does not treat constructor or toString as commands with arguments", () => {
    expect(complete("constructor x", ["help"], ["flashi"])).toEqual({
      input: "constructor x",
      options: [],
    });
  });
});

describe("complete relative to the working directory", () => {
  const all = ["cat", "cd", "ls", "open"];
  const ids = ["flashi", "trust-issues"];

  it("offers projects/ at home and ../ inside projects for cd", () => {
    expect(complete("cd ", all, ids, "~").options).toEqual(["projects/"]);
    expect(complete("cd ", all, ids, "~/projects").options).toEqual(["../"]);
  });

  it("completes project ids for ls inside projects and at home", () => {
    expect(complete("ls fla", all, ids, "~/projects").input).toBe("ls flashi");
    expect(complete("ls fla", all, ids, "~").input).toBe("ls flashi");
  });
});
