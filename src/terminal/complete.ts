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
  const options = candidates.filter((candidate) =>
    candidate.startsWith(partial.toLowerCase()),
  );
  if (options.length === 0) {
    return { input: before + partial, options };
  }
  if (options.length === 1) {
    return { input: before + options[0] + suffix, options };
  }
  return { input: before + commonPrefix(options), options };
}

/**
 * Tab completion: completes the command name in the first word, and project
 * ids in the argument of `open`. A unique command gets a trailing space so
 * the argument can follow; anything else extends to the common prefix.
 */
export function complete(
  input: string,
  commands: readonly string[],
  projectIds: readonly string[],
): Completion {
  const openArgument = /^(\s*open\s+)(\S*)$/i.exec(input);
  if (openArgument) {
    return completeWord(openArgument[1], openArgument[2], projectIds, "");
  }
  const firstWord = /^(\s*)(\S*)$/.exec(input);
  if (firstWord) {
    return completeWord(firstWord[1], firstWord[2], commands, " ");
  }
  return { input, options: [] };
}
