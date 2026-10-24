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

  it("does not complete arguments of other commands", () => {
    expect(complete("help tru", commands, projectIds)).toEqual({
      input: "help tru",
      options: [],
    });
  });

  it("lists ambiguous options alphabetically like a shell", () => {
    expect(complete("c", ["close", "clear"], projectIds).options).toEqual([
      "clear",
      "close",
    ]);
  });
});
