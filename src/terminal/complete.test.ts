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

  it("completes files after cat and command names after man", () => {
    expect(complete("cat projects/flashi/RE", commands, projectIds).input).toBe(
      "cat projects/flashi/README.md ",
    );
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

  it("offers only directories for cd, at home and inside projects", () => {
    expect(complete("cd ", all, ids, "~").options).toEqual(["projects/"]);
    expect(complete("cd ", all, ids, "~/projects").options).toContain(
      "flashi/",
    );
    expect(complete("cd fl", all, ids, "~/projects").input).toBe("cd flashi/");
  });

  it("completes nested paths and lists the matching names", () => {
    expect(complete("ls projects/fla", all, ids, "~").input).toBe(
      "ls projects/flashi/",
    );
    expect(complete("ls fla", all, ids, "~/projects").input).toBe("ls flashi/");
    expect(complete("cat ../../../etc/ho", all, ids, "~/projects").input).toBe(
      "cat ../../../etc/hostname ",
    );
    expect(complete("cat projects/flashi/", all, ids, "~").options).toEqual([
      "README.md",
      "links.txt",
      "stack.txt",
    ]);
  });

  it("shows hidden files only when the name starts with a dot", () => {
    expect(complete("cat .ba", all, ids, "~").options).toEqual([
      ".bash_history",
      ".bashrc",
    ]);
    expect(complete("cat ", all, ids, "~").options).toEqual([
      "README.md",
      "projects/",
    ]);
  });

  it("completes the last word, also after earlier arguments", () => {
    expect(complete("ls -l proj", all, ids, "~").input).toBe("ls -l projects/");
  });

  it("completes projects, friends and project paths after open", () => {
    expect(complete("open dom", all, ids, "~", ["domifolio"]).input).toBe(
      "open domifolio",
    );
    expect(complete("open projects/tr", all, ids, "~").input).toBe(
      "open projects/trust-issues/",
    );
  });
});

describe("complete after shell operators", () => {
  const all = ["cat", "cd", "grep", "ls", "wc"];

  it("completes a command name after a pipe or a list operator", () => {
    expect(complete("ls | gr", all, []).input).toBe("ls | grep ");
    expect(complete("cd projects && l", all, []).input).toBe(
      "cd projects && ls ",
    );
    expect(complete("pwd;c", all, []).options).toEqual(["cat", "cd"]);
  });

  it("completes paths of the command after the operator", () => {
    expect(complete("ls; cat proj", all, [], "~").input).toBe(
      "ls; cat projects/",
    );
  });
});
