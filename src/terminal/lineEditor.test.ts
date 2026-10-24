import { describe, expect, it } from "vitest";
import {
  deleteWordBefore,
  killToEnd,
  killToStart,
  type Line,
} from "./lineEditor";

const line = (text: string, cursor = text.length): Line => ({ text, cursor });

describe("killToStart (Ctrl+U)", () => {
  it("deletes everything before the cursor", () => {
    expect(killToStart(line("open flashi", 5))).toEqual(line("flashi", 0));
  });
});

describe("killToEnd (Ctrl+K)", () => {
  it("deletes everything after the cursor", () => {
    expect(killToEnd(line("open flashi", 4))).toEqual(line("open", 4));
  });
});

describe("deleteWordBefore (Ctrl+W)", () => {
  it("deletes the word before the cursor and the spaces after it", () => {
    expect(deleteWordBefore(line("open flashi "))).toEqual(line("open ", 5));
  });

  it("deletes only up to the cursor", () => {
    expect(deleteWordBefore(line("open flashi", 4))).toEqual(
      line(" flashi", 0),
    );
  });

  it("does nothing at the start of the line", () => {
    expect(deleteWordBefore(line("ls", 0))).toEqual(line("ls", 0));
  });
});
