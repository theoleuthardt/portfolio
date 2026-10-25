import { about, contacts } from "../content/about";
import { findFriend, friends } from "../content/friends";
import { findProject, projects } from "../content/projects";
import { fileCommands, projectAt, projectIds } from "./fileCommands";
import { absolute, buildFileSystem, HOME } from "./fs";
import {
  asText,
  didYouMean,
  error,
  text,
  type Command,
  type CommandResult,
  type Cwd,
  type Invocation,
  type ShellChange,
  type TerminalAction,
  type TerminalLine,
} from "./output";
import { easterEggCommands } from "./easterEggs";
import { processCommands } from "./processes";
import { expandWord, parseLine, type Pipeline } from "./shell";
import { closestMatch } from "./suggest";

export type { Cwd, TerminalAction, TerminalLine } from "./output";

/** The environment of a fresh session. */
export const DEFAULT_ENV: Readonly<Record<string, string>> = {
  HOME,
  USER: "guest",
  LOGNAME: "guest",
  SHELL: "/bin/bash",
  HOSTNAME: "theocloud",
  TERM: "xterm-256color",
  LANG: "en_US.UTF-8",
  EDITOR: "vim",
  PATH: "/usr/local/bin:/usr/bin:/bin",
};

/** What the shell remembers between command lines. */
export interface ShellState {
  cwd: Cwd;
  oldpwd?: Cwd;
  env: Readonly<Record<string, string>>;
  /** Exit status of the last command, `$?`. */
  status: number;
  /** Processes killed in this session. */
  killed: readonly number[];
}

/** What a command line may read; everything but the history is optional. */
export interface CommandContext {
  history: readonly string[];
  /** Working directory; home if absent. */
  cwd?: Cwd;
  oldpwd?: Cwd;
  /** The environment; {@link DEFAULT_ENV} if absent. */
  env?: Readonly<Record<string, string>>;
  status?: number;
  /** Current time for `date` and `uptime`; the real clock if absent. */
  now?: Date;
  /** When the session started; `now` if absent. */
  startedAt?: Date;
  killed?: readonly number[];
}

/** Output of a command line, the actions for the UI and the new state. */
export interface LineResult {
  lines: TerminalLine[];
  actions: TerminalAction[];
  state: ShellState;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
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
const ASSIGNMENT = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/s;
const FILE_SYSTEM = buildFileSystem();

function formatDate(date: Date): string {
  const time = [date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
  const day = String(date.getUTCDate()).padStart(2, " ");
  return `${DAYS[date.getUTCDay()]} ${MONTHS[date.getUTCMonth()]} ${day} ${time} UTC ${date.getUTCFullYear()}`;
}

const projectRows = (): CommandResult => ({
  lines: projects.map((project) => ({
    kind: "project",
    id: project.id,
    tagline: project.tagline,
    fork: project.fork !== undefined,
  })),
});

/** `about`: who Theo is; ejects the about server. */
const aboutTheo = (): CommandResult => ({
  lines: [
    { kind: "text", text: `${about.name} // ${about.role}` },
    ...about.paragraphs.map((paragraph): TerminalLine => ({
      kind: "text",
      text: paragraph,
    })),
    { kind: "chips", commands: ["contact", "projects"] },
  ],
  actions: [{ type: "open", projectId: "about" }],
});

/** `contact`: the public channels; lights up the patch panel. */
const contactLinks = (): CommandResult => ({
  lines: [
    { kind: "text", text: "reach Theo at:" },
    ...contacts.map((contact): TerminalLine => ({
      kind: "link",
      label: contact.label,
      url: contact.url,
    })),
  ],
  actions: [{ type: "open", projectId: "contact" }],
});

function open([name]: string[], call: Invocation): CommandResult {
  if (name === undefined) {
    return {
      lines: [
        { kind: "text", text: "open which project?" },
        { kind: "chips", commands: projects.map((p) => `open ${p.id}`) },
      ],
    };
  }
  if (name === "about") {
    return aboutTheo();
  }
  if (name === "contact") {
    return contactLinks();
  }
  const friend = findFriend(name);
  if (friend !== undefined) {
    return {
      lines: [
        { kind: "muted", text: `> opening ${friend.site} in a new tab ...` },
      ],
      actions: [{ type: "visit", url: friend.url }],
    };
  }
  const byPath = name.includes("/") || name.startsWith(".");
  const id = byPath ? projectAt(name, call.cwd) : findProject(name)?.id;
  if (id === undefined) {
    if (byPath) {
      return error(`open: ${name}: not a project directory`);
    }
    const suggestion = closestMatch(name, [
      ...projectIds,
      ...friends.map((friend) => friend.id),
    ]);
    return {
      lines: [
        { kind: "error", text: `open: no such project: ${name}` },
        ...(suggestion === undefined ? [] : didYouMean(`open ${suggestion}`)),
      ],
      status: 1,
    };
  }
  return {
    lines: [
      { kind: "muted", text: `> ejecting module ${id} ... camera locked` },
    ],
    actions: [{ type: "open", projectId: id }],
  };
}

function exportVariables(args: string[], call: Invocation): CommandResult {
  if (args.length === 0) {
    return text(
      ...Object.entries(call.env)
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([name, value]) => `declare -x ${name}="${value}"`),
    );
  }
  const set: Record<string, string> = {};
  for (const arg of args) {
    const assignment = ASSIGNMENT.exec(arg);
    if (assignment) {
      set[assignment[1]] = assignment[2];
    } else if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(arg)) {
      return error(`bash: export: \`${arg}': not a valid identifier`);
    }
  }
  return { lines: [], actions: [{ type: "env", set }] };
}

const general: Record<string, Command> = {
  projects: {
    usage: "projects",
    description: "lists the projects from anywhere",
    run: projectRows,
  },
  open: {
    usage: "open <project>",
    description: "opens a project and ejects its module from the rack",
    run: open,
  },
  close: {
    usage: "close",
    description: "closes the open project (or press Esc)",
    run: () => ({
      lines: [{ kind: "muted", text: "> module retracted" }],
      actions: [{ type: "close" }],
    }),
  },
  about: {
    usage: "about",
    description: "tells who Theo is and ejects the about server",
    run: aboutTheo,
  },
  contact: {
    usage: "contact",
    description: "lists where to reach Theo and lights up the patch panel",
    run: contactLinks,
  },
  friends: {
    usage: "friends",
    description: "lists the sites of friends of the lab (open <site>)",
    run: (): CommandResult => ({
      lines: [
        { kind: "text", text: "friends of the lab:" },
        ...friends.flatMap((friend): TerminalLine[] => [
          { kind: "link", label: friend.site, url: friend.url },
          { kind: "muted", text: `  ${friend.about}` },
        ]),
        {
          kind: "chips",
          commands: friends.map((friend) => `open ${friend.id}`),
        },
      ],
    }),
  },
  domi: {
    usage: "domi",
    description: "says who Domi is and links DomiFolio",
    run: (): CommandResult => {
      const domi = friends[0];
      return {
        lines: [
          { kind: "text", text: `${domi.site}: ${domi.about}.` },
          { kind: "link", label: domi.site, url: domi.url },
          { kind: "chips", commands: [`open ${domi.id}`] },
        ],
      };
    },
  },
  history: {
    usage: "history",
    description: "shows the commands you typed",
    run: (_, { history }) =>
      text(
        ...history.map(
          (entry, index) => `${String(index + 1).padStart(3)}  ${entry}`,
        ),
      ),
  },
  echo: {
    usage: "echo [text]",
    description: "prints its arguments, e.g. echo $HOME",
    run: (args) => text(args.join(" ")),
  },
  env: {
    usage: "env",
    description: "prints the environment variables",
    run: (_, call) =>
      text(
        ...Object.entries(call.env)
          .sort(([a], [b]) => (a < b ? -1 : 1))
          .map(([name, value]) => `${name}=${value}`),
      ),
  },
  export: {
    usage: "export [NAME=value]",
    description: "sets environment variables",
    run: exportVariables,
  },
  unset: {
    usage: "unset <NAME>",
    description: "removes environment variables",
    run: (args) => ({ lines: [], actions: [{ type: "env", unset: args }] }),
  },
  whoami: {
    usage: "whoami",
    description: "prints your user name",
    run: (_, call) => text(call.env.USER ?? "guest"),
  },
  hostname: {
    usage: "hostname",
    description: "prints the name of this machine",
    run: () => text("theocloud"),
  },
  uname: {
    usage: "uname [-a]",
    description: "prints the name of the system",
    run: ([flag]) =>
      text(
        flag === "-a"
          ? "TheoCloud rack-01 2.6.0 TheoCloud-OS x86_64 GNU/Linux"
          : "TheoCloud",
      ),
  },
  date: {
    usage: "date",
    description: "prints the current date and time in UTC",
    run: (_, { now }) => text(formatDate(now)),
  },
  clear: {
    usage: "clear",
    description: "clears the screen",
    run: () => ({ lines: [], actions: [{ type: "clear" }] }),
  },
  exit: {
    usage: "exit",
    description: "tries to leave",
    run: (): CommandResult => ({
      lines: [
        { kind: "text", text: "logout" },
        { kind: "muted", text: "There is no escape. The rack needs you." },
      ],
    }),
  },
};

const registry = new Map<string, Command>([
  [
    "help",
    {
      usage: "help",
      description: "lists all commands with what they do",
      run: (): CommandResult => ({
        lines: [
          { kind: "text", text: "available commands:" },
          { kind: "muted", text: "click one or type it" },
          ...[...registry].map(([name, command]): TerminalLine => ({
            kind: "command",
            name,
            usage: command.usage,
            description: command.description,
          })),
          {
            kind: "muted",
            text: "pipes (|), lists (; && ||) and $VARIABLES work like in bash",
          },
          {
            kind: "muted",
            text: "tab completes, arrow keys and ctrl+r search the history, shift+tab leaves the terminal",
          },
        ],
      }),
    },
  ],
  ...Object.entries(fileCommands),
  ...Object.entries(general),
  ...Object.entries(processCommands),
  ...Object.entries(easterEggCommands),
  [
    "man",
    {
      usage: "man <command>",
      description: "shows the manual of a command",
      run: ([name]): CommandResult => {
        if (name === undefined) {
          return text("What manual page do you want?");
        }
        const command = registry.get(name);
        if (command === undefined) {
          return error(`No manual entry for ${name}`, 16);
        }
        return text(
          "NAME",
          `    ${name} - ${command.description}`,
          "",
          "SYNOPSIS",
          `    ${command.usage}`,
        );
      },
    },
  ],
]);

/** Names of all commands, in the order `help` lists them. */
export const commandNames: readonly string[] = [...registry.keys()];

function notFound(name: string): CommandResult {
  const suggestion = closestMatch(name, commandNames);
  return {
    lines: [
      { kind: "error", text: `bash: ${name}: command not found` },
      ...(suggestion === undefined
        ? [
            {
              kind: "muted",
              text: "type 'help' for a list of commands",
            } as const,
          ]
        : didYouMean(suggestion)),
    ],
    status: 127,
  };
}

function applyChange(state: ShellState, change: ShellChange): ShellState {
  switch (change.type) {
    case "cd":
      return { ...state, oldpwd: state.cwd, cwd: change.cwd };
    case "env": {
      const env = { ...state.env, ...change.set };
      for (const name of change.unset ?? []) {
        delete env[name];
      }
      return { ...state, env };
    }
    case "kill":
      return { ...state, killed: [...state.killed, ...change.pids] };
  }
}

const isUiAction = (
  action: TerminalAction | ShellChange,
): action is TerminalAction =>
  ["open", "close", "clear", "visit", "program"].includes(action.type);

type Base = Pick<Invocation, "history" | "now" | "startedAt" | "fs">;

/**
 * Runs one pipeline: each command's output is piped into the next as text,
 * error lines are shown right away, and only a pipeline of one command may
 * change the shell or act on the UI (like bash's subshells).
 */
function runPipeline(
  pipeline: Pipeline,
  state: ShellState,
  base: Base,
): { lines: TerminalLine[]; actions: TerminalAction[]; state: ShellState } {
  const lines: TerminalLine[] = [];
  const actions: TerminalAction[] = [];
  const alone = pipeline.length === 1;
  let next = state;
  let stdin: string[] | undefined;
  pipeline.forEach((words, index) => {
    const env = {
      ...state.env,
      PWD: absolute(state.cwd, "/"),
      ...(state.oldpwd ? { OLDPWD: absolute(state.oldpwd, "/") } : {}),
    };
    const expanded = words.map((word) => expandWord(word, env, state.status));
    const assignments: Record<string, string> = {};
    let first = ASSIGNMENT.exec(expanded[0] ?? "");
    while (first) {
      assignments[first[1]] = first[2];
      expanded.shift();
      first = ASSIGNMENT.exec(expanded[0] ?? "");
    }
    if (expanded.length === 0) {
      if (alone) {
        next = applyChange(next, { type: "env", set: assignments });
      }
      next = { ...next, status: 0 };
      stdin = [];
      return;
    }
    const [name, ...args] = expanded;
    const command = registry.get(name.toLowerCase());
    const result = command
      ? command.run(args, {
          ...base,
          cwd: state.cwd,
          oldpwd: state.oldpwd,
          env: { ...env, ...assignments },
          killed: state.killed,
          stdin,
        })
      : notFound(name);
    if (index === pipeline.length - 1) {
      lines.push(...result.lines);
    } else {
      lines.push(...result.lines.filter((line) => line.kind === "error"));
      stdin = result.lines.filter((line) => line.kind !== "error").map(asText);
    }
    if (alone) {
      for (const action of result.actions ?? []) {
        if (isUiAction(action)) {
          actions.push(action);
        } else {
          next = applyChange(next, action);
        }
      }
    }
    next = { ...next, status: result.status ?? 0 };
  });
  return { lines, actions, state: next };
}

/**
 * Runs one command line like bash: parses it, runs its pipelines in order
 * (`&&` only after success, `||` only after failure), threads the working
 * directory, environment and `$?` from step to step, and returns the output,
 * the actions for the UI and the shell's new state.
 */
export function run(input: string, context: CommandContext): LineResult {
  const now = context.now ?? new Date();
  let state: ShellState = {
    cwd: context.cwd ?? "~",
    oldpwd: context.oldpwd,
    env: context.env ?? DEFAULT_ENV,
    status: context.status ?? 0,
    killed: context.killed ?? [],
  };
  const parsed = parseLine(input);
  if ("error" in parsed) {
    return {
      lines: [{ kind: "error", text: parsed.error }],
      actions: [],
      state: { ...state, status: 2 },
    };
  }
  const base: Base = {
    history: context.history,
    now,
    startedAt: context.startedAt ?? now,
    fs: FILE_SYSTEM,
  };
  const lines: TerminalLine[] = [];
  const actions: TerminalAction[] = [];
  let connector: string | undefined;
  for (const step of parsed) {
    const skip =
      (connector === "&&" && state.status !== 0) ||
      (connector === "||" && state.status === 0);
    if (!skip) {
      const result = runPipeline(step.pipeline, state, base);
      lines.push(...result.lines);
      actions.push(...result.actions);
      state = result.state;
    }
    connector = step.then;
  }
  return { lines, actions, state };
}
