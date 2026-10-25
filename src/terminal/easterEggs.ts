import { projects } from "../content/projects";
import {
  error,
  text,
  type Command,
  type CommandResult,
  type Invocation,
} from "./output";

/** The sayings of `fortune`. */
export const FORTUNES: readonly string[] = [
  "There are 10 kinds of people: those who understand binary and those who don't.",
  "It works on my machine. Then we'll ship your machine.",
  "The rack hums in B flat. Nobody knows why.",
  "A clean build is a happy build.",
  "Weeks of coding can save you hours of planning.",
  "If it's green, it's fine. Everything here is green.",
  "There is no cloud. It's just someone else's rack.",
  "The coffee is a lie. The espresso is not.",
  "Have you tried turning it off and on again?",
  "99 little bugs in the code. Take one down, patch it around: 127 little bugs in the code.",
];

const LOGO = [
  "  .---------.  ",
  "  | .-----. |  ",
  "  | | >_  | |  ",
  "  | '-----' |  ",
  "  '---------'  ",
  "   _|_____|_   ",
  "  '---------'  ",
];

/** The technologies used by most projects, most used first. */
function topStack(count: number): string[] {
  const uses = new Map<string, number>();
  for (const project of projects) {
    for (const item of project.stack) {
      uses.set(item, (uses.get(item) ?? 0) + 1);
    }
  }
  return [...uses]
    .sort(([a, x], [b, y]) => y - x || a.localeCompare(b))
    .slice(0, count)
    .map(([item]) => item);
}

function neofetch(_: string[], call: Invocation): CommandResult {
  const minutes = Math.max(
    0,
    Math.floor((call.now.getTime() - call.startedAt.getTime()) / 60000),
  );
  const facts = [
    "guest@theocloud",
    "---------------",
    "OS: TheoCloud OS 2.6 x86_64",
    "Host: rack-01",
    "Kernel: 2.6.0-theocloud",
    `Uptime: ${minutes} min${minutes === 1 ? "" : "s"}`,
    "Shell: bash 5.2",
    "Terminal: THEO-TERM 3270",
    "CPU: phosphor-green @ 3.27 GHz",
    "Memory: enough",
    `Projects: ${projects.length}`,
    `Stack: ${topStack(8).join(", ")}`,
  ];
  return text(
    ...facts.map((fact, index) => `${(LOGO[index] ?? "").padEnd(16)} ${fact}`),
  );
}

function sudo(args: string[]): CommandResult {
  if (args.length === 0) {
    return error("usage: sudo command");
  }
  if (args.join(" ") === "make me a sandwich") {
    return text("okay.");
  }
  return {
    lines: [
      { kind: "text", text: "[sudo] password for guest: " },
      {
        kind: "error",
        text: "guest is not in the sudoers file. This incident will be reported.",
      },
      { kind: "muted", text: "(it was reported to the coffee machine)" },
    ],
    status: 1,
  };
}

function rm(args: string[]): CommandResult {
  const operands = args.filter((arg) => !arg.startsWith("-"));
  if (operands.length === 0) {
    return error("rm: missing operand");
  }
  const recursive = args.some((arg) => /^-[a-zA-Z]*[rR]/.test(arg));
  if (recursive && operands.some((operand) => /^\/+$/.test(operand))) {
    return {
      lines: [
        {
          kind: "error",
          text: "rm: it is dangerous to operate recursively on '/'",
        },
        {
          kind: "error",
          text: "rm: use --no-preserve-root to override this failsafe",
        },
        { kind: "muted", text: "(please don't)" },
      ],
      status: 1,
    };
  }
  return {
    lines: [
      ...operands.map((operand) => ({
        kind: "error" as const,
        text: `rm: cannot remove '${operand}': Read-only file system`,
      })),
      { kind: "muted", text: "the lab keeps everything. nice try." },
    ],
    status: 1,
  };
}

const BUBBLE_WIDTH = 40;

/** Breaks text into lines of at most {@link BUBBLE_WIDTH} characters. */
function wrap(words: readonly string[]): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if (line !== "" && line.length + 1 + word.length > BUBBLE_WIDTH) {
      lines.push(line);
      line = word;
    } else {
      line = line === "" ? word : `${line} ${word}`;
    }
  }
  return [...lines, line];
}

function cowsay(args: string[], call: Invocation): CommandResult {
  const said =
    args.length > 0 ? args : (call.stdin ?? []).join(" ").split(/\s+/);
  const lines = wrap(said.filter(Boolean));
  const width = Math.max(...lines.map((line) => line.length));
  const bubble =
    lines.length === 1
      ? [`< ${lines[0]} >`]
      : lines.map((line, index) => {
          const [open, close] =
            index === 0
              ? ["/", "\\"]
              : index === lines.length - 1
                ? ["\\", "/"]
                : ["|", "|"];
          return `${open} ${line.padEnd(width)} ${close}`;
        });
  return text(
    ` ${"_".repeat(width + 2)}`,
    ...bubble,
    ` ${"-".repeat(width + 2)}`,
    "        \\   ^__^",
    "         \\  (oo)\\_______",
    "            (__)\\       )\\/\\",
    "                ||----w |",
    "                ||     ||",
  );
}

/** Easter eggs: neofetch, sudo, rm, fortune, cowsay and the programs. */
export const easterEggCommands: Record<string, Command> = {
  neofetch: {
    usage: "neofetch",
    description: "shows the system with a logo",
    run: neofetch,
  },
  fortune: {
    usage: "fortune",
    description: "tells a fortune",
    run: (_, call) =>
      text(FORTUNES[Math.floor(call.now.getTime() / 1000) % FORTUNES.length]),
  },
  cowsay: {
    usage: "cowsay <text>",
    description: "lets a cow say something; try fortune | cowsay",
    run: cowsay,
  },
  sudo: {
    usage: "sudo <command>",
    description: "runs a command as root, in theory",
    run: sudo,
  },
  rm: {
    usage: "rm <file>",
    description: "removes files, in theory",
    run: rm,
  },
  matrix: {
    usage: "matrix",
    description: "follows the white rabbit; q quits",
    run: () => ({ lines: [], actions: [{ type: "program", name: "matrix" }] }),
  },
  play: {
    usage: "play dino",
    description: "plays the dino game; space jumps, q quits",
    run: ([game]) =>
      game === "dino"
        ? { lines: [], actions: [{ type: "program", name: "dino" }] }
        : error(`play: ${game ?? ""}: no such game (try: play dino)`),
  },
  hack: {
    usage: "hack <target>",
    description: "hacks into something; ctrl+c aborts",
    run: ([target]) =>
      !target
        ? error("usage: hack <target>")
        : {
            lines: [],
            actions: [
              { type: "program", name: "hack", target: target.toLowerCase() },
            ],
          },
  },
};
