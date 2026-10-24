/** Entered commands, oldest first, and the position while browsing them. */
export interface History {
  entries: readonly string[];
  /** Index into `entries`; `entries.length` means "the draft". */
  cursor: number;
  /** Input typed but not submitted before browsing started. */
  draft: string;
}

/** A history step: the updated history and the input to show. */
export interface HistoryStep {
  history: History;
  value: string;
}

/** History without any entries. */
export const emptyHistory: History = { entries: [], cursor: 0, draft: "" };

/** Adds a command unless it is blank or repeats the latest entry. */
export function record(history: History, command: string): History {
  const trimmed = command.trim();
  const latest = history.entries[history.entries.length - 1];
  const entries =
    trimmed === "" || trimmed === latest
      ? history.entries
      : [...history.entries, trimmed];
  return { entries, cursor: entries.length, draft: "" };
}

function at(history: History, cursor: number): HistoryStep {
  return {
    history: { ...history, cursor },
    value:
      cursor === history.entries.length
        ? history.draft
        : history.entries[cursor],
  };
}

/**
 * Moves to the previous (older) entry, stopping at the oldest. Leaving the
 * draft position keeps `current` as the draft, like a shell does.
 */
export function stepBack(history: History, current = ""): HistoryStep {
  const draft =
    history.cursor === history.entries.length ? current : history.draft;
  return at({ ...history, draft }, Math.max(0, history.cursor - 1));
}

/**
 * Moves to the next (newer) entry, ending on the kept draft. On the draft
 * line itself it changes nothing and keeps `current`, like a shell does.
 */
export function stepForward(history: History, current = ""): HistoryStep {
  if (history.cursor === history.entries.length) {
    return { history, value: current };
  }
  return at(history, history.cursor + 1);
}
