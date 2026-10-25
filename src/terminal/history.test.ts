import { describe, expect, it } from "vitest";
import {
  emptyHistory,
  record,
  reverseSearch,
  stepBack,
  stepForward,
} from "./history";

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

  it("keeps the unsubmitted draft and restores it past the newest entry", () => {
    const back = stepBack(withTwo, "half typed");
    expect(back.value).toBe("open flashi");
    expect(stepForward(back.history).value).toBe("half typed");
  });

  it("forgets the draft once a command is recorded", () => {
    const back = stepBack(withTwo, "half typed").history;
    expect(record(back, "help").draft).toBe("");
  });

  it("keeps the current input when stepping forward on the draft line", () => {
    const back = stepBack(withTwo, "abc").history;
    const onDraft = stepForward(back).history;
    expect(stepForward(onDraft, "abcxyz").value).toBe("abcxyz");
  });
});

describe("reverseSearch", () => {
  const entries = [
    "ls",
    "cd projects",
    "open flashi",
    "ls -l",
    "open dinogame",
  ];

  it("finds the newest entry containing the query", () => {
    expect(reverseSearch(entries, "open")).toEqual({
      index: 4,
      entry: "open dinogame",
    });
    expect(reverseSearch(entries, "ls")).toEqual({ index: 3, entry: "ls -l" });
  });

  it("continues further back from a given index", () => {
    expect(reverseSearch(entries, "open", 4)).toEqual({
      index: 2,
      entry: "open flashi",
    });
    expect(reverseSearch(entries, "open", 2)).toBeUndefined();
  });

  it("finds nothing for an unknown query and the newest entry for an empty one", () => {
    expect(reverseSearch(entries, "vim")).toBeUndefined();
    expect(reverseSearch(entries, "")).toEqual({
      index: 4,
      entry: "open dinogame",
    });
  });
});
