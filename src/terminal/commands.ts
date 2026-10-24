import { findProject, projects } from "../content/projects";
import { parseCommand } from "./parse";
import { closestMatch } from "./suggest";

/** One line of terminal output. */
export type TerminalLine =
  | { kind: "text" | "muted" | "error"; text: string }
  | { kind: "chips"; commands: readonly string[] }
  | { kind: "command"; name: string; usage: string; description: string }
  | { kind: "project"; id: string; tagline: string; fork: boolean };

/** Something the UI or the scene has to do after a command. */
export type TerminalAction =
  { type: "open"; projectId: string } | { type: "close" } | { type: "clear" };

/** Output and optional action of one command. */
export interface CommandResult {
  lines: TerminalLine[];
  action?: TerminalAction;
}

/** What a command may read besides its arguments. */
export interface CommandContext {
  history: readonly string[];
}

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

const listProjects: Run = () => ({
  lines: projects.map((project) => ({
    kind: "project",
    id: project.id,
    tagline: project.tagline,
    fork: project.fork !== undefined,
  })),
});

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
      usage: "ls",
      description: "lists the projects in the rack",
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
