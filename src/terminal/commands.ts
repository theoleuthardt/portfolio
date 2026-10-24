import { findProject, projects, type Project } from "../content/projects";
import { parseCommand } from "./parse";
import { closestMatch } from "./suggest";

/** One line of terminal output. */
export type TerminalLine =
  | { kind: "text" | "muted" | "error"; text: string }
  | { kind: "chips"; commands: readonly string[] }
  | { kind: "command"; name: string; usage: string; description: string }
  | { kind: "project"; id: string; tagline: string; fork: boolean };

/** The two directories of the guest's home. */
export type Cwd = "~" | "~/projects";

/** Something the UI or the scene has to do after a command. */
export type TerminalAction =
  | { type: "open"; projectId: string }
  | { type: "close" }
  | { type: "clear" }
  | { type: "cd"; cwd: Cwd };

/** Output and optional action of one command. */
export interface CommandResult {
  lines: TerminalLine[];
  action?: TerminalAction;
}

/** What a command may read besides its arguments. */
export interface CommandContext {
  history: readonly string[];
  /** Working directory; home if absent. */
  cwd?: Cwd;
  /** Current time for `date`; the real clock if absent. */
  now?: Date;
}

const HOME = "/home/guest";
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

type Path = { dir: Cwd } | { project: Project } | undefined;

/**
 * Resolves a path argument against the working directory: home, the
 * projects directory, or a project inside it. `.` and `..` are normalised
 * (never above home); a bare project id also resolves from home, as a
 * shortcut.
 */
function resolvePath(arg: string | undefined, cwd: Cwd): Path {
  const raw = (arg ?? "~").replace(/^\/home\/guest(?=\/|$)/, "~");
  const fromHome = raw.startsWith("~");
  const segments: string[] = fromHome || cwd === "~" ? [] : ["projects"];
  for (const segment of (fromHome ? raw.slice(1) : raw).split("/")) {
    if (segment === "..") {
      segments.pop();
    } else if (segment !== "" && segment !== ".") {
      segments.push(segment);
    }
  }
  if (raw.startsWith("/") && !fromHome) {
    return undefined;
  }
  if (segments.length === 0) {
    return { dir: "~" };
  }
  if (segments.length === 1 && segments[0] === "projects") {
    return { dir: "~/projects" };
  }
  const id =
    segments.length === 2 && segments[0] === "projects"
      ? segments[1]
      : segments.length === 1 && !raw.includes("/")
        ? segments[0]
        : undefined;
  const project = id === undefined ? undefined : findProject(id);
  return project ? { project } : undefined;
}

function formatDate(date: Date): string {
  const time = [date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
  const day = String(date.getUTCDate()).padStart(2, " ");
  return `${DAYS[date.getUTCDay()]} ${MONTHS[date.getUTCMonth()]} ${day} ${time} UTC ${date.getUTCFullYear()}`;
}

const error = (text: string): CommandResult => ({
  lines: [{ kind: "error", text }],
});

const text = (...lines: string[]): CommandResult => ({
  lines: lines.map((line) => ({ kind: "text", text: line })),
});

type Run = (args: string[], context: CommandContext) => CommandResult;

interface Command {
  /** How the command is typed, with its arguments. */
  usage: string;
  /** What the command does, shown by `help`. */
  description: string;
  run: Run;
}

function didYouMean(command: string): TerminalLine[] {
  return [
    { kind: "muted", text: "did you mean:" },
    { kind: "chips", commands: [command] },
  ];
}

const listProjects: Run = (args, { cwd = "~" }) => {
  const options = args
    .filter((arg) => arg.startsWith("-"))
    .join("")
    .replace(/-/g, "");
  const invalid = [...options].find((option) => !"la".includes(option));
  if (invalid !== undefined) {
    return error(`ls: invalid option -- '${invalid}'`);
  }
  const target = args.find((arg) => !arg.startsWith("-"));
  const path = target === undefined ? undefined : resolvePath(target, cwd);
  if (target !== undefined && path === undefined) {
    return error(`ls: cannot access '${target}': No such file or directory`);
  }
  const single =
    path !== undefined && "project" in path ? path.project : undefined;
  const listed = single ? [single] : projects;
  if (options.includes("l")) {
    return text(
      ...listed.map(
        (project) =>
          `drwxr-xr-x 1 guest lab ${String(project.units).padStart(2)}U ${project.fork ? "fork" : "own "} ${project.id}`,
      ),
    );
  }
  if (single) {
    return text(single.id);
  }
  return {
    lines: projects.map((project) => ({
      kind: "project",
      id: project.id,
      tagline: project.tagline,
      fork: project.fork !== undefined,
    })),
  };
};

const registry = new Map<string, Command>(
  Object.entries({
    help: {
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
            text: "tab completes, arrow keys browse the history",
          },
        ],
      }),
    },
    ls: {
      usage: "ls [-l] [dir]",
      description: "lists the projects in the rack, -l in the long format",
      run: listProjects,
    },
    projects: {
      usage: "projects",
      description: "lists the projects, same as ls",
      run: listProjects,
    },
    open: {
      usage: "open <project>",
      description: "opens a project and ejects its module from the rack",
      run: ([name]) => {
        if (name === undefined) {
          return {
            lines: [
              { kind: "text", text: "open which project?" },
              { kind: "chips", commands: projects.map((p) => `open ${p.id}`) },
            ],
          };
        }
        const project = findProject(name);
        if (project === undefined) {
          const suggestion = closestMatch(
            name,
            projects.map((p) => p.id),
          );
          return {
            lines: [
              { kind: "error", text: `open: no such project: ${name}` },
              ...(suggestion === undefined
                ? []
                : didYouMean(`open ${suggestion}`)),
            ],
          };
        }
        return {
          lines: [
            {
              kind: "muted",
              text: `> ejecting module ${project.id} ... camera locked`,
            },
          ],
          action: { type: "open", projectId: project.id },
        };
      },
    },
    close: {
      usage: "close",
      description: "closes the open project (or press Esc)",
      run: () => ({
        lines: [{ kind: "muted", text: "> module retracted" }],
        action: { type: "close" },
      }),
    },
    history: {
      usage: "history",
      description: "shows the commands you typed",
      run: (_, { history }) => ({
        lines: history.map((entry, index) => ({
          kind: "text",
          text: `${String(index + 1).padStart(3)}  ${entry}`,
        })),
      }),
    },
    pwd: {
      usage: "pwd",
      description: "prints the working directory",
      run: (_, { cwd = "~" }) => text(cwd.replace("~", HOME)),
    },
    cd: {
      usage: "cd [dir]",
      description: "changes the working directory (home or projects)",
      run: ([target], { cwd = "~" }) => {
        const path = resolvePath(target, cwd);
        if (path === undefined) {
          return error(`cd: ${target}: No such file or directory`);
        }
        if ("project" in path) {
          return error(`cd: ${target}: Not a directory`);
        }
        return { lines: [], action: { type: "cd", cwd: path.dir } };
      },
    },
    cat: {
      usage: "cat <project>",
      description: "prints a project's summary without opening it",
      run: ([target], { cwd = "~" }) => {
        if (target === undefined) {
          return error("cat: missing file operand");
        }
        const path = resolvePath(target, cwd);
        if (path === undefined) {
          return error(`cat: ${target}: No such file or directory`);
        }
        if (!("project" in path)) {
          return error(`cat: ${target}: Is a directory`);
        }
        const { project } = path;
        return {
          lines: [
            { kind: "text", text: `${project.title} - ${project.tagline}` },
            { kind: "text", text: project.summary },
            { kind: "muted", text: `stack: ${project.stack.join(", ")}` },
          ],
        };
      },
    },
    echo: {
      usage: "echo [text]",
      description: "prints its arguments",
      run: (args) => text(args.join(" ")),
    },
    date: {
      usage: "date",
      description: "prints the current date and time in UTC",
      run: (_, { now = new Date() }) => text(formatDate(now)),
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
    man: {
      usage: "man <command>",
      description: "shows the manual of a command",
      run: ([name]): CommandResult => {
        if (name === undefined) {
          return text("What manual page do you want?");
        }
        const command = registry.get(name);
        if (command === undefined) {
          return text(`No manual entry for ${name}`);
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
    clear: {
      usage: "clear",
      description: "clears the screen",
      run: () => ({ lines: [], action: { type: "clear" } }),
    },
  } satisfies Record<string, Command>),
);

/** Names of all commands, in the order `help` lists them. */
export const commandNames: readonly string[] = [...registry.keys()];

/** Runs one line of terminal input. */
export function run(input: string, context: CommandContext): CommandResult {
  const parsed = parseCommand(input);
  if (parsed === undefined) {
    return { lines: [] };
  }
  const command = registry.get(parsed.name);
  if (command !== undefined) {
    return command.run(parsed.args, context);
  }
  const suggestion = closestMatch(parsed.name, commandNames);
  return {
    lines: [
      { kind: "error", text: `command not found: ${parsed.name}` },
      ...(suggestion === undefined
        ? [
            {
              kind: "muted",
              text: "type 'help' for a list of commands",
            } as const,
          ]
        : didYouMean(suggestion)),
    ],
  };
}
