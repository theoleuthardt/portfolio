/** Result of a tab completion: the new input and the matching options. */
export interface Completion {
  input: string;
  options: string[];
}

function commonPrefix(words: readonly string[]): string {
  return words.reduce((prefix, word) => {
    let length = 0;
    while (length < prefix.length && prefix[length] === word[length]) {
      length++;
    }
    return prefix.slice(0, length);
  });
}

function completeWord(
  before: string,
  partial: string,
  candidates: readonly string[],
  suffix: string,
): Completion {
  const options = candidates
    .filter((candidate) => candidate.startsWith(partial.toLowerCase()))
    .sort();
  if (options.length === 0) {
    return { input: before + partial, options };
  }
  if (options.length === 1) {
    const [only] = options;
    return {
      input: before + only + (only.endsWith("/") ? "" : suffix),
      options,
    };
  }
  return { input: before + commonPrefix(options), options };
}

/**
 * Tab completion like a shell: the first word completes to a command name
 * (with a trailing space when unique); arguments complete per command:
 * project ids after `open` and `cat`, the `projects/` directory after `cd`
 * and `ls`, command names after `man`. Options are sorted alphabetically.
 */
export function complete(
  input: string,
  commands: readonly string[],
  projectIds: readonly string[],
): Completion {
  const argument = /^(\s*(\S+)\s+)(\S*)$/.exec(input);
  if (argument) {
    const [, before, command, partial] = argument;
    const candidates = new Map<string, readonly string[]>([
      ["open", projectIds],
      ["cat", projectIds],
      ["cd", ["projects/"]],
      ["ls", ["projects/"]],
      ["man", commands],
    ]);
    return completeWord(
      before,
      partial,
      candidates.get(command.toLowerCase()) ?? [],
      "",
    );
  }
  const firstWord = /^(\s*)(\S*)$/.exec(input);
  if (firstWord) {
    return completeWord(firstWord[1], firstWord[2], commands, " ");
  }
  return { input, options: [] };
}
