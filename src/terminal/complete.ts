import { absolute, buildFileSystem, list } from "./fs";
import type { Cwd } from "./output";

/** Result of a tab completion: the new input and the matching options. */
export interface Completion {
  input: string;
  options: string[];
}

const FILE_SYSTEM = buildFileSystem();
const PATH_COMMANDS = new Set([
  "ls",
  "cat",
  "tree",
  "head",
  "tail",
  "wc",
  "grep",
  "sort",
]);

function commonPrefix(words: readonly string[]): string {
  return words.reduce((prefix, word) => {
    let length = 0;
    while (length < prefix.length && prefix[length] === word[length]) {
      length++;
    }
    return prefix.slice(0, length);
  });
}

/** Completes `partial` from `candidates`; a unique match gets `suffix`. */
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
 * Completes `partial` as a path from `cwd` like bash: the directory part
 * stays, the last name completes from that directory's entries (directories
 * with a trailing slash, files with a space when unique, hidden ones only
 * for names starting with a dot), and the options show the names.
 */
function completePath(
  before: string,
  partial: string,
  cwd: Cwd,
  directoriesOnly: boolean,
): Completion {
  const slash = partial.lastIndexOf("/");
  const directory = partial.slice(0, slash + 1);
  const name = partial.slice(slash + 1);
  const entries = (
    list(FILE_SYSTEM, absolute(directory || ".", cwd)) ?? []
  ).filter(
    (entry) =>
      entry.name.startsWith(name) &&
      (name.startsWith(".") || !entry.name.startsWith(".")) &&
      (!directoriesOnly || entry.node.kind === "dir"),
  );
  const options = entries.map(
    (entry) => entry.name + (entry.node.kind === "dir" ? "/" : ""),
  );
  if (options.length === 0) {
    return { input: before + partial, options };
  }
  if (options.length === 1) {
    const [only] = options;
    return {
      input: before + directory + only + (only.endsWith("/") ? "" : " "),
      options,
    };
  }
  return { input: before + directory + commonPrefix(options), options };
}

/**
 * Tab completion like a shell: the first word completes to a command name
 * (with a trailing space when unique). The last word completes per command:
 * paths through the file system after `ls`, `cat`, `tree`, `head`, `tail`,
 * `wc`, `grep` and `sort`, directories after `cd`, projects and friends'
 * sites (or project paths) after `open`, command names after `man`. Options
 * are sorted alphabetically.
 */
export function complete(
  input: string,
  commands: readonly string[],
  projectIds: readonly string[],
  cwd: Cwd = "~",
  friendIds: readonly string[] = [],
): Completion {
  const argument = /^(\s*(\S+)\s+(?:.*\s)?)(\S*)$/.exec(input);
  if (argument) {
    const [, before, raw, partial] = argument;
    const command = raw.toLowerCase();
    if (command === "cd") {
      return completePath(before, partial, cwd, true);
    }
    if (PATH_COMMANDS.has(command)) {
      return completePath(before, partial, cwd, false);
    }
    if (command === "open") {
      return partial.includes("/") || partial.startsWith(".")
        ? completePath(before, partial, cwd, true)
        : completeWord(before, partial, [...projectIds, ...friendIds], "");
    }
    if (command === "man") {
      return completeWord(before, partial, commands, "");
    }
    return { input, options: [] };
  }
  const firstWord = /^(\s*)(\S*)$/.exec(input);
  if (firstWord) {
    return completeWord(firstWord[1], firstWord[2], commands, " ");
  }
  return { input, options: [] };
}
