/** A command line split into its lowercase name and its arguments. */
export interface ParsedCommand {
  name: string;
  args: string[];
}

/**
 * Splits terminal input into words, keeping double-quoted text together.
 * An unterminated quote runs to the end of the input. Returns `undefined`
 * for blank input.
 */
export function parseCommand(input: string): ParsedCommand | undefined {
  const words = [...input.matchAll(/"([^"]*)"?|(\S+)/g)].map(
    (match) => match[1] ?? match[2],
  );
  const [name, ...args] = words;
  if (name === undefined) {
    return undefined;
  }
  return { name: name.toLowerCase(), args };
}
