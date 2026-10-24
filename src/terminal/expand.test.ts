import { describe, expect, it } from "vitest";
import { expandHistory } from "./expand";

const history = ["ls", "open flashi", "help"];

describe("expandHistory", () => {
  it("leaves ordinary input alone", () => {
    expect(expandHistory("echo hi", history)).toEqual({ input: "echo hi" });
  });

  it("replaces !! with the last command", () => {
    expect(expandHistory("!!", history)).toEqual({
      input: "help",
      expanded: true,
    });
  });

  it("replaces !n with entry n, counted from 1", () => {
    expect(expandHistory("!2", history)).toEqual({
      input: "open flashi",
      expanded: true,
    });
  });

  it("keeps the rest of the line after the expansion", () => {
    expect(expandHistory("!! extra", history)).toEqual({
      input: "help extra",
      expanded: true,
    });
  });

  it("reports an event that does not exist like bash", () => {
    expect(expandHistory("!9", history)).toEqual({
      error: "!9: event not found",
    });
    expect(expandHistory("!!", [])).toEqual({ error: "!!: event not found" });
  });
});
