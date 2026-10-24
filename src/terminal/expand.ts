/** Result of history expansion: the expanded input or a bash-style error. */
export type Expansion = { input: string; expanded?: true } | { error: string };

/**
 * Bash history expansion at the start of a line: `!!` is the last command,
 * `!n` the n-th entry (from 1). The rest of the line is kept.
 */
export function expandHistory(
  input: string,
  history: readonly string[],
): Expansion {
  const match = /^\s*!(!|\d+)(.*)$/.exec(input);
  if (match === null) {
    return { input };
  }
  const [, event, rest] = match;
  const entry =
    event === "!" ? history[history.length - 1] : history[Number(event) - 1];
  if (entry === undefined) {
    return { error: `!${event}: event not found` };
  }
  return { input: entry + rest, expanded: true };
}
