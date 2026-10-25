import { findProject, projects } from "../content/projects";
import {
  absolute,
  display,
  HOME,
  list,
  lookup,
  type DirEntry,
  type FsNode,
} from "./fs";
import {
  didYouMean,
  error,
  text,
  type Command,
  type CommandResult,
  type Invocation,
  type TerminalLine,
} from "./output";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const PROJECTS_DIR = `${HOME}/projects`;

/** Splits `-la -n 3` style options from operands; `--` ends the options. */
function options(args: string[]): { flags: string; operands: string[] } {
  const operands: string[] = [];
  let flags = "";
  let ended = false;
  for (const arg of args) {
    if (!ended && arg === "--") {
      ended = true;
    } else if (!ended && arg.startsWith("-") && arg.length > 1) {
      flags += arg.slice(1);
    } else {
      operands.push(arg);
    }
  }
  return { flags, operands };
}

/**
 * The count of `-n N`, `-nN` or `-N` for head and tail (10 if absent) and
 * the other operands, or the error `tool` prints for a bad count.
 */
function lineCount(
  tool: string,
  args: string[],
): { count: number; operands: string[] } | CommandResult {
  const operands: string[] = [];
  let count = 10;
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    let raw: string | undefined;
    if (arg === "-n") {
      raw = args[index + 1];
      index += 1;
      if (raw === undefined) {
        return error(`${tool}: option requires an argument -- 'n'`);
      }
    } else if (/^-n.+/.test(arg)) {
      raw = arg.slice(2);
    } else if (/^-\d+$/.test(arg)) {
      raw = arg.slice(1);
    } else {
      operands.push(arg);
      continue;
    }
    if (!/^\d+$/.test(raw)) {
      return error(`${tool}: invalid number of lines: '${raw}'`);
    }
    count = Number(raw);
  }
  return { count, operands };
}

const size = (node: FsNode) =>
  node.kind === "dir" ? 4096 : node.lines.join("\n").length + 1;

function longLine(name: string, node: FsNode, now: Date): string {
  const mode = node.kind === "dir" ? "drwxr-xr-x" : "-rw-r--r--";
  const links =
    node.kind === "dir"
      ? 2 +
        [...node.entries.values()].filter((entry) => entry.kind === "dir")
          .length
      : 1;
  const time = [now.getUTCHours(), now.getUTCMinutes()]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
  const date = `${MONTHS[now.getUTCMonth()]} ${String(now.getUTCDate()).padStart(2)} ${time}`;
  return `${mode} ${links} guest lab ${String(size(node)).padStart(5)} ${date} ${name}`;
}

/** The lines of a file operand, or an error result in the style of `tool`. */
function readOperand(
  tool: string,
  operand: string,
  call: Invocation,
): readonly string[] | CommandResult {
  const node = lookup(call.fs, absolute(operand, call.cwd));
  if (node === undefined) {
    return error(`${tool}: ${operand}: No such file or directory`);
  }
  if (node.kind === "dir") {
    return error(`${tool}: ${operand}: Is a directory`);
  }
  return node.lines;
}

/** The input of a text tool: its file operands, or the piped lines. */
function input(
  tool: string,
  operands: string[],
  call: Invocation,
): { lines: string[]; errors: TerminalLine[] } {
  if (operands.length === 0) {
    return { lines: [...(call.stdin ?? [])], errors: [] };
  }
  const lines: string[] = [];
  const errors: TerminalLine[] = [];
  for (const operand of operands) {
    const read = readOperand(tool, operand, call);
    if ("lines" in read) {
      errors.push(...read.lines);
    } else {
      lines.push(...read);
    }
  }
  return { lines, errors };
}

function listing(
  entries: DirEntry[],
  path: string,
  cwd: string,
): TerminalLine[] {
  if (path === PROJECTS_DIR) {
    return entries.map(({ name }) => {
      const project = findProject(name);
      return project
        ? {
            kind: "project",
            id: project.id,
            tagline: project.tagline,
            fork: project.fork !== undefined,
          }
        : { kind: "text", text: name };
    });
  }
  const here = path === absolute(cwd, "/");
  return entries.map(({ name, node }): TerminalLine =>
    node.kind === "dir"
      ? {
          kind: "dir",
          name: `${name}/`,
          command: here ? `cd ${name}` : `cd ${display(absolute(name, path))}`,
        }
      : { kind: "text", text: name },
  );
}

const ls: Command = {
  usage: "ls [-la] [path...]",
  description: "lists directories: -a shows hidden files, -l the long format",
  run: (args, call) => {
    const { flags, operands } = options(args);
    const invalid = [...flags].find((flag) => !"la1".includes(flag));
    if (invalid !== undefined) {
      return error(`ls: invalid option -- '${invalid}'`, 2);
    }
    const all = flags.includes("a");
    const long = flags.includes("l");
    const targets = operands.length > 0 ? operands : ["."];
    const lines: TerminalLine[] = [];
    let status = 0;
    const blocks: TerminalLine[][] = [];
    for (const target of targets) {
      const path = absolute(target, call.cwd);
      const node = lookup(call.fs, path);
      if (node === undefined) {
        lines.push({
          kind: "error",
          text: `ls: cannot access '${target}': No such file or directory`,
        });
        status = 2;
        continue;
      }
      if (node.kind === "file") {
        blocks.push([
          {
            kind: "text",
            text: long ? longLine(target, node, call.now) : target,
          },
        ]);
        continue;
      }
      const entries = (list(call.fs, path) ?? []).filter(
        ({ name }) => all || !name.startsWith("."),
      );
      const shown: DirEntry[] = all
        ? [
            { name: ".", node },
            { name: "..", node: lookup(call.fs, absolute("..", path)) ?? node },
            ...entries,
          ]
        : entries;
      const body: TerminalLine[] = long
        ? [
            { kind: "text", text: `total ${shown.length * 4}` },
            ...shown.map(({ name, node: entry }): TerminalLine => ({
              kind: "text",
              text: longLine(name, entry, call.now),
            })),
          ]
        : listing(shown, path, call.cwd);
      blocks.push(
        targets.length > 1
          ? [{ kind: "text", text: `${target}:` }, ...body]
          : body,
      );
    }
    blocks.forEach((block, index) => {
      if (index > 0) {
        lines.push({ kind: "text", text: "" });
      }
      lines.push(...block);
    });
    return { lines, status };
  },
};

const cd: Command = {
  usage: "cd [dir]",
  description: "changes the working directory; cd - goes back",
  run: ([target, extra], call) => {
    if (extra !== undefined) {
      return error("bash: cd: too many arguments");
    }
    if (target === "-") {
      if (call.oldpwd === undefined) {
        return error("bash: cd: OLDPWD not set");
      }
      return {
        lines: [{ kind: "text", text: absolute(call.oldpwd, "/") }],
        actions: [{ type: "cd", cwd: call.oldpwd }],
      };
    }
    const path = absolute(target ?? "~", call.cwd);
    const node = lookup(call.fs, path);
    if (node === undefined) {
      return error(`bash: cd: ${target}: No such file or directory`);
    }
    if (node.kind === "file") {
      return error(`bash: cd: ${target}: Not a directory`);
    }
    return { lines: [], actions: [{ type: "cd", cwd: display(path) }] };
  },
};

const pwd: Command = {
  usage: "pwd",
  description: "prints the working directory",
  run: (_, call) => text(absolute(call.cwd, "/")),
};

/** The shortest way to name a project's README from `cwd`. */
function readmePath(id: string, cwd: string): string {
  const path = `${PROJECTS_DIR}/${id}/README.md`;
  const base = absolute(cwd, "/");
  return path.startsWith(`${base}/`)
    ? path.slice(base.length + 1)
    : display(path);
}

const cat: Command = {
  usage: "cat <file...>",
  description: "prints files, e.g. cat projects/flashi/README.md",
  run: (args, call) => {
    if (args.length === 0) {
      return call.stdin
        ? text(...call.stdin)
        : error("cat: missing file operand");
    }
    const lines: TerminalLine[] = [];
    let status = 0;
    for (const operand of args) {
      const read = readOperand("cat", operand, call);
      if ("lines" in read) {
        lines.push(...read.lines);
        status = 1;
        const project = findProject(operand.replace(/\/$/, ""));
        if (
          project &&
          lookup(call.fs, absolute(operand, call.cwd)) === undefined
        ) {
          lines.push(...didYouMean(`cat ${readmePath(project.id, call.cwd)}`));
        }
      } else {
        lines.push(
          ...read.map((line): TerminalLine => ({ kind: "text", text: line })),
        );
      }
    }
    return { lines, status };
  },
};

function treeLines(
  node: FsNode,
  prefix: string,
): {
  lines: string[];
  dirs: number;
  files: number;
} {
  if (node.kind === "file") {
    return { lines: [], dirs: 0, files: 0 };
  }
  const entries = [...node.entries]
    .filter(([name]) => !name.startsWith("."))
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const result = { lines: [] as string[], dirs: 0, files: 0 };
  entries.forEach(([name, child], index) => {
    const last = index === entries.length - 1;
    result.lines.push(`${prefix}${last ? "└── " : "├── "}${name}`);
    if (child.kind === "dir") {
      result.dirs += 1;
      const inner = treeLines(child, `${prefix}${last ? "    " : "│   "}`);
      result.lines.push(...inner.lines);
      result.dirs += inner.dirs;
      result.files += inner.files;
    } else {
      result.files += 1;
    }
  });
  return result;
}

const tree: Command = {
  usage: "tree [dir]",
  description: "draws a directory as a tree",
  run: ([target = "."], call) => {
    const node = lookup(call.fs, absolute(target, call.cwd));
    if (node?.kind !== "dir") {
      return {
        lines: [
          { kind: "error", text: `${target} [error opening dir]` },
          ...text("", "0 directories, 0 files").lines,
        ],
        status: 2,
      };
    }
    const drawn = treeLines(node, "");
    const { dirs, files } = drawn;
    return text(
      target,
      ...drawn.lines,
      "",
      `${dirs} director${dirs === 1 ? "y" : "ies"}, ${files} file${files === 1 ? "" : "s"}`,
    );
  },
};

const head: Command = {
  usage: "head [-n N] [file]",
  description: "prints the first lines of a file or of piped input",
  run: (args, call) => {
    const parsed = lineCount("head", args);
    if ("lines" in parsed) {
      return parsed;
    }
    const { count, operands } = parsed;
    const read = input("head", operands, call);
    return {
      lines: [...read.errors, ...text(...read.lines.slice(0, count)).lines],
      status: read.errors.length > 0 ? 1 : 0,
    };
  },
};

const tail: Command = {
  usage: "tail [-n N] [file]",
  description: "prints the last lines of a file or of piped input",
  run: (args, call) => {
    const parsed = lineCount("tail", args);
    if ("lines" in parsed) {
      return parsed;
    }
    const { count, operands } = parsed;
    const read = input("tail", operands, call);
    return {
      lines: [
        ...read.errors,
        ...text(...(count === 0 ? [] : read.lines.slice(-count))).lines,
      ],
      status: read.errors.length > 0 ? 1 : 0,
    };
  },
};

/** The numbers of a `wc` row for `lines`, in the order l, w, c. */
function wcRow(lines: readonly string[], flags: string): string {
  const counts = {
    l: lines.length,
    w: lines.join(" ").split(/\s+/).filter(Boolean).length,
    c: lines.reduce((sum, line) => sum + line.length + 1, 0),
  };
  const numbers = [..."lwc"]
    .filter((flag) => (flags === "" ? "lwc" : flags).includes(flag))
    .map((flag) => counts[flag as keyof typeof counts]);
  return numbers.length === 1
    ? String(numbers[0])
    : numbers.map((value) => String(value).padStart(7)).join("");
}

const wc: Command = {
  usage: "wc [-lwc] [file...]",
  description: "counts lines, words and characters",
  run: (args, call) => {
    const { flags, operands } = options(args);
    if (operands.length === 0) {
      return text(wcRow(call.stdin ?? [], flags));
    }
    const lines: TerminalLine[] = [];
    const all: string[] = [];
    let status = 0;
    for (const operand of operands) {
      const read = readOperand("wc", operand, call);
      if ("lines" in read) {
        lines.push(...read.lines);
        status = 1;
      } else {
        all.push(...read);
        lines.push({ kind: "text", text: `${wcRow(read, flags)} ${operand}` });
      }
    }
    if (operands.length > 1) {
      lines.push({ kind: "text", text: `${wcRow(all, flags)} total` });
    }
    return { lines, status };
  },
};

const grep: Command = {
  usage: "grep [-ivn] <pattern> [file...]",
  description: "prints the lines that match a pattern",
  run: (args, call) => {
    const { flags, operands } = options(args);
    const [pattern, ...files] = operands;
    if (pattern === undefined) {
      return error("Usage: grep [OPTION]... PATTERNS [FILE]...", 2);
    }
    let matcher: RegExp;
    try {
      matcher = new RegExp(pattern, flags.includes("i") ? "i" : "");
    } catch {
      matcher = new RegExp(
        pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        flags.includes("i") ? "i" : "",
      );
    }
    const sources: { name: string; read: readonly string[] | CommandResult }[] =
      files.length === 0
        ? [{ name: "", read: call.stdin ?? [] }]
        : files.map((name) => ({
            name,
            read: readOperand("grep", name, call),
          }));
    const output: TerminalLine[] = [];
    let matched = false;
    let failed = false;
    for (const { name, read } of sources) {
      if ("lines" in read) {
        output.push(...read.lines);
        failed = true;
        continue;
      }
      const prefix = files.length > 1 ? `${name}:` : "";
      read.forEach((line, index) => {
        if (matcher.test(line) !== flags.includes("v")) {
          matched = true;
          output.push({
            kind: "text",
            text: `${prefix}${flags.includes("n") ? `${index + 1}:` : ""}${line}`,
          });
        }
      });
    }
    return { lines: output, status: failed ? 2 : matched ? 0 : 1 };
  },
};

const sort: Command = {
  usage: "sort [-r] [file]",
  description: "sorts lines alphabetically, -r in reverse",
  run: (args, call) => {
    const { flags, operands } = options(args);
    const read = input("sort", operands, call);
    const sorted = [...read.lines].sort((a, b) =>
      a.localeCompare(b, "en", { sensitivity: "base" }),
    );
    return {
      lines: [
        ...read.errors,
        ...text(...(flags.includes("r") ? sorted.reverse() : sorted)).lines,
      ],
      status: read.errors.length > 0 ? 2 : 0,
    };
  },
};

/** The project whose directory `target` is, seen from `cwd`. */
export function projectAt(target: string, cwd: string): string | undefined {
  const path = absolute(target, cwd);
  const match = /^\/home\/guest\/projects\/([^/]+)$/.exec(path);
  return match ? findProject(match[1])?.id : undefined;
}

/** All project ids, for `open` and the did-you-mean hints. */
export const projectIds = projects.map((project) => project.id);

/** The commands that work with files and text. */
export const fileCommands: Record<string, Command> = {
  ls,
  cd,
  pwd,
  cat,
  tree,
  head,
  tail,
  wc,
  grep,
  sort,
};
