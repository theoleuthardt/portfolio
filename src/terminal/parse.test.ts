import { describe, expect, it } from "vitest";
import { parseCommand } from "./parse";

describe("parseCommand", () => {
  it("returns undefined for empty or blank input", () => {
    expect(parseCommand("")).toBeUndefined();
    expect(parseCommand("   ")).toBeUndefined();
  });

  it("splits the command name from its arguments", () => {
    expect(parseCommand("open trust-issues")).toEqual({
      name: "open",
      args: ["trust-issues"],
    });
  });

  it("lowercases the command name but keeps arguments as typed", () => {
    expect(parseCommand("OPEN Flashi")).toEqual({
      name: "open",
      args: ["Flashi"],
    });
  });

  it("collapses repeated whitespace and trims", () => {
    expect(parseCommand("  ls   projects  ")).toEqual({
      name: "ls",
      args: ["projects"],
    });
  });

  it("keeps quoted arguments together", () => {
    expect(parseCommand('echo "hello world" again')).toEqual({
      name: "echo",
      args: ["hello world", "again"],
    });
  });

  it("treats an unterminated quote as running to the end", () => {
    expect(parseCommand('echo "hello world')).toEqual({
      name: "echo",
      args: ["hello world"],
    });
  });
});
