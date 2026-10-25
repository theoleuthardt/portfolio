import type { DirNode } from "./fs";

/** One line of terminal output. */
export type TerminalLine =
  | { kind: "text" | "muted" | "error"; text: string }
  | { kind: "chips"; commands: readonly string[] }
  | { kind: "command"; name: string; usage: string; description: string }
  | { kind: "project"; id: string; tagline: string; fork: boolean }
  | { kind: "dir"; name: string; command: string }
  | { kind: "link"; label: string; url: string };

/** A working directory as the prompt shows it, e.g. `~/projects`. */
export type Cwd = string;

/** Something the UI or the scene has to do after a command line. */
export type TerminalAction =
  | { type: "open"; projectId: string }
  | { type: "close" }
  | { type: "clear" }
  | { type: "visit"; url: string }
  | { type: "program"; name: "top" };

/** A change of the shell's own state requested by a builtin. */
export type ShellChange =
  | { type: "cd"; cwd: Cwd }
  | { type: "env"; set?: Readonly<Record<string, string>>; unset?: string[] }
  | { type: "kill"; pids: readonly number[] };

/** Output, exit status and requested change of one command. */
export interface CommandResult {
  lines: TerminalLine[];
  /** Exit status; 0 if absent. */
  status?: number;
  actions?: readonly (TerminalAction | ShellChange)[];
}

/** Everything a command may read besides its arguments. */
export interface Invocation {
  cwd: Cwd;
  oldpwd?: Cwd;
  env: Readonly<Record<string, string>>;
  history: readonly string[];
  now: Date;
  /** When the session started, for `uptime` and the process times. */
  startedAt: Date;
  fs: DirNode;
  /** Lines piped in from the previous command, if any. */
  stdin?: readonly string[];
  /** Processes killed in this session. */
  killed: readonly number[];
}

/** How a command runs: its arguments and the invocation context. */
export type Run = (args: string[], call: Invocation) => CommandResult;

/** A builtin command. */
export interface Command {
  /** How the command is typed, with its arguments. */
  usage: string;
  /** What the command does, shown by `help`. */
  description: string;
  run: Run;
}

/** Plain output lines. */
export const text = (...lines: string[]): CommandResult => ({
  lines: lines.map((line) => ({ kind: "text", text: line })),
});

/** One error line with exit status 1 (or `status`). */
export const error = (message: string, status = 1): CommandResult => ({
  lines: [{ kind: "error", text: message }],
  status,
});

/** A "did you mean" hint offering `command` as a clickable chip. */
export function didYouMean(command: string): TerminalLine[] {
  return [
    { kind: "muted", text: "did you mean:" },
    { kind: "chips", commands: [command] },
  ];
}

/** A line as plain text, the way it travels through a pipe. */
export function asText(line: TerminalLine): string {
  switch (line.kind) {
    case "text":
    case "muted":
    case "error":
      return line.text;
    case "chips":
      return line.commands.join("  ");
    case "command":
      return `${line.usage}  ${line.description}`;
    case "project":
      return line.id;
    case "dir":
      return line.name.replace(/\/$/, "");
    case "link":
      return line.url;
  }
}
