import { run, type TerminalAction, type TerminalLine } from "./commands";
import { bootLines } from "./boot";
import { emptyHistory, record, type History } from "./history";

/** One block of the terminal log: a prompt with its output. */
export interface LogEntry {
  id: number;
  /** The typed command; absent for the boot output. */
  command?: string;
  lines: readonly TerminalLine[];
  /** Set when this entry opened a project, whose screen is shown below it. */
  projectId?: string;
}

/** Everything the terminal shows and remembers. */
export interface Session {
  log: readonly LogEntry[];
  history: History;
  openProjectId?: string;
  nextId: number;
}

/** A submitted command's new session and the action for the scene, if any. */
export interface Submission {
  session: Session;
  action?: TerminalAction;
}

/** A new session whose log holds the boot output. */
export function createSession(): Session {
  return {
    log: [{ id: 0, lines: bootLines }],
    history: emptyHistory,
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

/** Runs `input`, records it and appends the result to the log. */
export function submit(session: Session, input: string): Submission {
  const history = record(session.history, input);
  const { lines, action } = run(input, { history: history.entries });
  const entry: LogEntry = {
    id: session.nextId,
    command: input.trim(),
    lines,
    ...(action?.type === "open" ? { projectId: action.projectId } : {}),
  };
  return {
    session: {
      log: action?.type === "clear" ? [] : [...session.log, entry],
      history,
      openProjectId: openProjectAfter(session.openProjectId, action),
      nextId: session.nextId + 1,
    },
    action,
  };
}
