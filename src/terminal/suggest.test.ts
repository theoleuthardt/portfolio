import { describe, expect, it } from "vitest";
import { closestMatch, editDistance } from "./suggest";

describe("editDistance", () => {
  it("is zero for equal words", () => {
    expect(editDistance("open", "open")).toBe(0);
  });

  it("counts insertions, deletions and substitutions", () => {
    expect(editDistance("opn", "open")).toBe(1);
    expect(editDistance("opeen", "open")).toBe(1);
    expect(editDistance("opan", "open")).toBe(1);
    expect(editDistance("kitten", "sitting")).toBe(3);
  });

  it("counts a swap of neighbouring letters as one edit", () => {
    expect(editDistance("hlep", "help")).toBe(1);
  });
});

describe("closestMatch", () => {
  const commands = ["help", "ls", "open", "clear", "close", "history"];

  it("suggests the closest candidate within the allowed distance", () => {
    expect(closestMatch("hlep", commands)).toBe("help");
    expect(closestMatch("histroy", commands)).toBe("history");
  });

  it("prefers the first candidate on a tie", () => {
    expect(closestMatch("abcd", ["abcx", "abxd"])).toBe("abcx");
  });

  it("allows one edit for short words and one more per three letters", () => {
    expect(closestMatch("rm", commands)).toBeUndefined();
    expect(closestMatch("lx", commands)).toBe("ls");
    expect(closestMatch("hstry", commands)).toBeUndefined();
    expect(closestMatch("histry", commands)).toBe("history");
  });

  it("returns undefined when nothing is close enough", () => {
    expect(closestMatch("rm -rf", commands)).toBeUndefined();
  });

  it("ignores case", () => {
    expect(closestMatch("HELP", commands)).toBe("help");
  });
});
