import { describe, expect, it } from "vitest";
import { emptyHistory, record, stepBack, stepForward } from "./history";

describe("history", () => {
  const withTwo = record(record(emptyHistory, "ls"), "open flashi");

  it("records entries and resets the cursor", () => {
    expect(withTwo.entries).toEqual(["ls", "open flashi"]);
    expect(withTwo.cursor).toBe(2);
  });

  it("ignores blank input and immediate repeats", () => {
    expect(record(withTwo, "  ").entries).toHaveLength(2);
    expect(record(withTwo, "open flashi").entries).toHaveLength(2);
  });

  it("steps back to older entries and stops at the oldest", () => {
    const once = stepBack(withTwo);
    expect(once.value).toBe("open flashi");
    const twice = stepBack(once.history);
    expect(twice.value).toBe("ls");
    expect(stepBack(twice.history).value).toBe("ls");
  });

  it("steps forward to newer entries and ends on empty input", () => {
    const back = stepBack(stepBack(withTwo).history).history;
    const forward = stepForward(back);
    expect(forward.value).toBe("open flashi");
    expect(stepForward(forward.history).value).toBe("");
  });

  it("returns empty input when stepping back with no entries", () => {
    expect(stepBack(emptyHistory).value).toBe("");
  });
});
