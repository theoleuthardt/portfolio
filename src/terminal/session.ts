import {
  DEFAULT_ENV,
  run,
  type Cwd,
  type ShellState,
  type TerminalAction,
  type TerminalLine,
} from "./commands";
import { bootLines } from "./boot";
import { expandHistory } from "./expand";
import { emptyHistory, record, type History } from "./history";

/** One block of the terminal log: a prompt with its output. */
export interface LogEntry {
  id: number;
  /** The typed command; absent for the boot output. */
  command?: string;
  /** Working directory shown in this entry's prompt. */
  cwd?: Cwd;
  lines: readonly TerminalLine[];
  /** Set when this entry opened a project, whose screen is shown below it. */
  projectId?: string;
}

/** Everything the terminal shows and remembers, including the shell. */
export interface Session extends ShellState {
  log: readonly LogEntry[];
  history: History;
  openProjectId?: string;
  nextId: number;
  /** When the session started, for `uptime` and `top`. */
  startedAt: Date;
}

/** A submitted line's new session and the actions for the UI, in order. */
export interface Submission {
  session: Session;
  actions: TerminalAction[];
}

/** A new session in the home directory whose log holds the boot output. */
export function createSession(startedAt: Date = new Date()): Session {
  return {
    log: [{ id: 0, lines: bootLines }],
    history: emptyHistory,
    cwd: "~",
    env: DEFAULT_ENV,
    status: 0,
    killed: [],
    nextId: 1,
    startedAt,
  };
}

function openProjectAfter(
  current: string | undefined,
  actions: readonly TerminalAction[],
): string | undefined {
  return actions.reduce<string | undefined>(
    (open, action) =>
      action.type === "open"
        ? action.projectId
        : action.type === "close" || action.type === "clear"
          ? undefined
          : open,
    current,
  );
}

function append(session: Session, entry: Omit<LogEntry, "id">): Session {
  return {
    ...session,
    log: [...session.log, { id: session.nextId, ...entry }],
    nextId: session.nextId + 1,
  };
}

/**
 * Runs `input` like bash: expands `!!` and `!n` (echoing the expanded
 * command), records it, runs it in the working directory and appends the
 * result to the log.
 */
export function submit(
  session: Session,
  input: string,
  now: Date = new Date(),
): Submission {
  const command = input.trim();
  const expansion = expandHistory(input, session.history.entries);
  if ("error" in expansion) {
    return {
      session: append(
        { ...session, status: 1 },
        {
          command,
          cwd: session.cwd,
          lines: [{ kind: "error", text: expansion.error }],
        },
      ),
      actions: [],
    };
  }
  const history = record(session.history, expansion.input);
  const { lines, actions, state } = run(expansion.input, {
    history: history.entries,
    cwd: session.cwd,
    oldpwd: session.oldpwd,
    env: session.env,
    status: session.status,
    killed: session.killed,
    startedAt: session.startedAt,
    now,
  });
  const echoed: TerminalLine[] = expansion.expanded
    ? [{ kind: "muted", text: expansion.input.trim() }, ...lines]
    : lines;
  const openProjectId = openProjectAfter(session.openProjectId, actions);
  const opened = actions.some((action) => action.type === "open");
  const next = append(
    { ...session, history },
    {
      command,
      cwd: session.cwd,
      lines: echoed,
      ...(opened && openProjectId ? { projectId: openProjectId } : {}),
    },
  );
  return {
    session: {
      ...next,
      ...state,
      log: actions.some((action) => action.type === "clear") ? [] : next.log,
      openProjectId,
    },
    actions,
  };
}

/** Ctrl+C: shows the abandoned line with `^C`, without recording it. */
export function cancel(session: Session, input: string): Session {
  return append(session, {
    command: `${input}^C`,
    cwd: session.cwd,
    lines: [],
  });
}

/** Ctrl+L: clears the screen and keeps history, directory and open project. */
export function clearScreen(session: Session): Session {
  return { ...session, log: [] };
}

/**
 * Adds output to the log entry `entryId` (the newest one if absent), e.g.
 * what a program leaves behind under the line that started it.
 */
export function appendOutput(
  session: Session,
  lines: readonly TerminalLine[],
  entryId: number | undefined = session.log[session.log.length - 1]?.id,
): Session {
  return {
    ...session,
    log: session.log.map((entry) =>
      entry.id === entryId
        ? { ...entry, lines: [...entry.lines, ...lines] }
        : entry,
    ),
  };
}
