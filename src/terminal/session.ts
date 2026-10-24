import {
  run,
  type Cwd,
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

/** Everything the terminal shows and remembers. */
export interface Session {
  log: readonly LogEntry[];
  history: History;
  cwd: Cwd;
  openProjectId?: string;
  nextId: number;
}

/** A submitted command's new session and the action for the scene, if any. */
export interface Submission {
  session: Session;
  action?: TerminalAction;
}

/** A new session in the home directory whose log holds the boot output. */
export function createSession(): Session {
  return {
    log: [{ id: 0, lines: bootLines }],
    history: emptyHistory,
    cwd: "~",
    nextId: 1,
  };
}

function openProjectAfter(
  current: string | undefined,
  action: TerminalAction | undefined,
): string | undefined {
  if (action?.type === "open") {
    return action.projectId;
  }
  return action?.type === "close" || action?.type === "clear"
    ? undefined
    : current;
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
      session: append(session, {
        command,
        cwd: session.cwd,
        lines: [{ kind: "error", text: expansion.error }],
      }),
    };
  }
  const history = record(session.history, expansion.input);
  const { lines, action } = run(expansion.input, {
    history: history.entries,
    cwd: session.cwd,
    now,
  });
  const echoed: TerminalLine[] = expansion.expanded
    ? [{ kind: "muted", text: expansion.input.trim() }, ...lines]
    : lines;
  const next = append(
    { ...session, history },
    {
      command,
      cwd: session.cwd,
      lines: echoed,
      ...(action?.type === "open" ? { projectId: action.projectId } : {}),
    },
  );
  return {
    session: {
      ...next,
      log: action?.type === "clear" ? [] : next.log,
      cwd: action?.type === "cd" ? action.cwd : session.cwd,
      openProjectId: openProjectAfter(session.openProjectId, action),
    },
    action,
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
