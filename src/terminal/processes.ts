import { projects } from "../content/projects";
import {
  error,
  text,
  type Command,
  type CommandResult,
  type Invocation,
  type TerminalLine,
} from "./output";

/** One process of the lab's machine. */
export interface Process {
  pid: number;
  user: "root" | "guest";
  name: string;
  command: string;
  /** Average CPU share in percent. */
  cpu: number;
  /** Memory share in percent. */
  mem: number;
  /** Set for the processes that are a project's module. */
  project?: string;
}

/** The coffee daemon, which burns most of the CPU. */
export const COFFEE_PID = 204;
const SHELL_PID = 133;
const LAZY_PID = 233;
const MEMORY_MIB = 16384;
const SWAP_MIB = 2048;

const SYSTEM: readonly Process[] = [
  {
    pid: 1,
    user: "root",
    name: "systemd",
    command: "/sbin/init",
    cpu: 0.1,
    mem: 0.1,
  },
  {
    pid: 2,
    user: "root",
    name: "kthreadd",
    command: "[kthreadd]",
    cpu: 0,
    mem: 0,
  },
  {
    pid: 101,
    user: "root",
    name: "sshd",
    command: "sshd: /usr/sbin/sshd -D",
    cpu: 0,
    mem: 0.1,
  },
  {
    pid: SHELL_PID,
    user: "guest",
    name: "bash",
    command: "-bash",
    cpu: 0.2,
    mem: 0.1,
  },
  {
    pid: COFFEE_PID,
    user: "root",
    name: "coffee-daemon",
    command: "/usr/sbin/coffee-daemon --strength=espresso --refills=infinite",
    cpu: 38.4,
    mem: 4.2,
  },
  {
    pid: LAZY_PID,
    user: "guest",
    name: "procrastinatord",
    command: "procrastinatord --until=tomorrow",
    cpu: 0.4,
    mem: 1.1,
  },
  {
    pid: 255,
    user: "root",
    name: "rgb-lighting",
    command: "rgb-lighting --mode=phosphor --brightness=11",
    cpu: 6.6,
    mem: 0.8,
  },
  {
    pid: 271,
    user: "root",
    name: "fan-control",
    command: "fan-control --curve=jet-engine",
    cpu: 1.2,
    mem: 0.2,
  },
  {
    pid: 302,
    user: "guest",
    name: "dino",
    command: "dino --jump --highscore=1337",
    cpu: 3.1,
    mem: 0.6,
  },
];

const PROJECT_PROCESSES: readonly Process[] = projects.map(
  (project, index) => ({
    pid: 400 + index * 11,
    user: "guest",
    name: project.id,
    command: `/srv/rack-01/${project.id} --rack-units=${project.units}`,
    cpu: 1.5 + ((index * 7) % 5) * 0.9,
    mem: 2 + ((index * 3) % 4) * 1.4,
    project: project.id,
  }),
);

/** What happens when a process is killed: a message, and whether it dies. */
const REACTIONS = new Map<number, { message: string; dies: boolean }>([
  [
    COFFEE_PID,
    {
      message: "coffee-daemon terminated. CPU load drops. So does morale.",
      dies: true,
    },
  ],
  [LAZY_PID, { message: "procrastinatord: will exit tomorrow.", dies: false }],
  [
    255,
    {
      message:
        "rgb-lighting terminated. The rack is still green. It always is.",
      dies: true,
    },
  ],
  [
    271,
    {
      message: "fan-control terminated. It is getting warm in here.",
      dies: true,
    },
  ],
  [302, { message: "dino jumped over your signal.", dies: false }],
  [
    SHELL_PID,
    {
      message: "bash: you cannot kill the shell you are standing in.",
      dies: false,
    },
  ],
  [2, { message: "kthreadd shrugs. Kernel threads do not die.", dies: false }],
  [
    101,
    {
      message:
        "sshd terminated. Good thing you are not connected over ssh. Are you?",
      dies: true,
    },
  ],
]);

function noise(seed: number, step: number): number {
  const value = Math.sin(seed * 12.9898 + step * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

/**
 * The processes at `seconds` after the session started, without the killed
 * ones; their CPU shares wander a little from second to second.
 */
export function processTable(
  killed: readonly number[],
  seconds: number,
): Process[] {
  const tick = Math.floor(seconds);
  return [...SYSTEM, ...PROJECT_PROCESSES]
    .filter((process) => !killed.includes(process.pid))
    .map((process) => ({
      ...process,
      cpu:
        process.cpu === 0
          ? 0
          : Math.max(
              0,
              Math.round(
                process.cpu * (0.8 + 0.4 * noise(process.pid, tick)) * 10,
              ) / 10,
            ),
    }));
}

const minutesUp = (call: Pick<Invocation, "now" | "startedAt">) =>
  Math.max(
    0,
    Math.floor((call.now.getTime() - call.startedAt.getTime()) / 60000),
  );

const clock = (date: Date) =>
  [date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");

function load(table: Process[]): string {
  const total = table.reduce((sum, process) => sum + process.cpu, 0) / 100;
  return [total, total * 0.9, total * 0.8]
    .map((value) => value.toFixed(2))
    .join(", ");
}

function uptimeLine(
  call: Pick<Invocation, "now" | "startedAt">,
  table: Process[],
): string {
  return `${clock(call.now)} up ${minutesUp(call)} min,  1 user,  load average: ${load(table)}`;
}

function memory(table: Process[]) {
  const used = Math.round(
    (table.reduce((sum, process) => sum + process.mem, 0) / 100) * MEMORY_MIB,
  );
  const cache = 2048;
  return { used, cache, free: MEMORY_MIB - used - cache };
}

const seconds = (call: Pick<Invocation, "now" | "startedAt">) =>
  (call.now.getTime() - call.startedAt.getTime()) / 1000;

/** The state `top` draws from. */
export interface TopState {
  killed: readonly number[];
  now: Date;
  startedAt: Date;
}

/** The lines of one `top` screen: the header and the processes by CPU. */
export function topScreen(state: TopState): string[] {
  const table = processTable(state.killed, seconds(state)).sort(
    (a, b) => b.cpu - a.cpu || a.pid - b.pid,
  );
  const busy = Math.min(
    99.9,
    table.reduce((sum, process) => sum + process.cpu, 0),
  );
  const { used, cache, free } = memory(table);
  const mib = (value: number) => value.toFixed(1).padStart(8);
  return [
    `top - ${uptimeLine(state, table)}`,
    `Tasks: ${String(table.length).padStart(3)} total,   1 running, ${String(table.length - 1).padStart(3)} sleeping,   0 stopped,   0 zombie`,
    `%Cpu(s): ${busy.toFixed(1).padStart(4)} us,  1.2 sy,  0.0 ni, ${(100 - busy).toFixed(1).padStart(4)} id,  0.0 wa`,
    `MiB Mem : ${mib(MEMORY_MIB)} total, ${mib(free)} free, ${mib(used)} used, ${mib(cache)} buff/cache`,
    `MiB Swap: ${mib(SWAP_MIB)} total, ${mib(SWAP_MIB)} free, ${mib(0)} used. ${mib(free + cache)} avail Mem`,
    "",
    "    PID USER      PR  NI    VIRT    RES  %CPU  %MEM COMMAND",
    ...table.map((process) => {
      const res = Math.round((process.mem / 100) * MEMORY_MIB * 1024);
      return [
        String(process.pid).padStart(7),
        process.user.padEnd(8),
        "20".padStart(3),
        "0".padStart(3),
        String(res * 3).padStart(7),
        String(res).padStart(6),
        process.cpu.toFixed(1).padStart(5),
        process.mem.toFixed(1).padStart(5),
        process.name,
      ].join(" ");
    }),
  ];
}

function kill(pids: number[], call: Invocation): CommandResult {
  const table = processTable(call.killed, seconds(call));
  const lines: TerminalLine[] = [];
  const killed: number[] = [];
  let status = 0;
  for (const pid of pids) {
    const process = table.find((entry) => entry.pid === pid);
    if (pid === 1) {
      lines.push({
        kind: "error",
        text: "bash: kill: (1) - Operation not permitted",
      });
      status = 1;
    } else if (process === undefined) {
      lines.push({
        kind: "error",
        text: `bash: kill: (${pid}) - No such process`,
      });
      status = 1;
    } else if (process.project !== undefined) {
      return {
        lines: [
          {
            kind: "muted",
            text: `> ${process.project} crashed and was pulled out of the rack for inspection`,
          },
        ],
        action: { type: "open", projectId: process.project },
      };
    } else {
      const reaction = REACTIONS.get(pid) ?? { message: "", dies: true };
      if (reaction.message) {
        lines.push({ kind: "muted", text: reaction.message });
      }
      if (reaction.dies) {
        killed.push(pid);
      }
    }
  }
  return {
    lines,
    status,
    ...(killed.length > 0 ? { action: { type: "kill", pids: killed } } : {}),
  };
}

/** The process manager: ps, top, kill, killall, uptime and free. */
export const processCommands: Record<string, Command> = {
  ps: {
    usage: "ps [aux]",
    description: "lists processes; ps aux lists all of them",
    run: (args, call) => {
      const table = processTable(call.killed, seconds(call));
      if (args.some((arg) => /a|x/.test(arg))) {
        return text(
          "USER         PID %CPU %MEM STAT START   COMMAND",
          ...table.map(
            (process) =>
              `${process.user.padEnd(8)} ${String(process.pid).padStart(7)} ${process.cpu.toFixed(1).padStart(4)} ${process.mem.toFixed(1).padStart(4)} ${process.pid === SHELL_PID ? "Ss  " : "S   "} ${clock(call.startedAt).slice(0, 5)}   ${process.command}`,
          ),
        );
      }
      return text(
        "    PID TTY          TIME CMD",
        `${String(SHELL_PID).padStart(7)} pts/0    00:00:00 bash`,
        `${String(SHELL_PID + 1000).padStart(7)} pts/0    00:00:00 ps`,
      );
    },
  },
  top: {
    usage: "top",
    description: "shows the processes live; q quits",
    run: () => ({ lines: [], action: { type: "program", name: "top" } }),
  },
  htop: {
    usage: "htop",
    description: "the same as top, for people with taste",
    run: () => ({ lines: [], action: { type: "program", name: "top" } }),
  },
  kill: {
    usage: "kill [-9] <pid...>",
    description: "stops processes; try ps aux first",
    run: (args, call) => {
      const operands = args.filter((arg) => !/^-(\d+|[A-Z]+)$/.test(arg));
      if (operands.length === 0) {
        return error(
          "kill: usage: kill [-s sigspec | -n signum | -sigspec] pid | jobspec ... or kill -l [sigspec]",
          2,
        );
      }
      const invalid = operands.find((arg) => !/^\d+$/.test(arg));
      if (invalid !== undefined) {
        return error(
          `bash: kill: ${invalid}: arguments must be process or job IDs`,
        );
      }
      return kill(operands.map(Number), call);
    },
  },
  killall: {
    usage: "killall <name>",
    description: "stops every process with that name",
    run: ([name], call) => {
      if (name === undefined) {
        return error("killall: no process name specified");
      }
      const pids = processTable(call.killed, seconds(call))
        .filter((process) => process.name === name)
        .map((process) => process.pid);
      return pids.length === 0
        ? error(`${name}: no process found`)
        : kill(pids, call);
    },
  },
  uptime: {
    usage: "uptime",
    description: "prints how long the lab has been running",
    run: (_, call) =>
      text(` ${uptimeLine(call, processTable(call.killed, seconds(call)))}`),
  },
  free: {
    usage: "free [-h]",
    description: "prints the memory usage, -h in human units",
    run: (args, call) => {
      const { used, cache, free } = memory(
        processTable(call.killed, seconds(call)),
      );
      const human = args.includes("-h");
      const show = (mib: number) =>
        (human
          ? mib >= 1024
            ? `${Math.round(mib / 1024)}Gi`
            : `${mib}Mi`
          : String(mib * 1024)
        ).padStart(11);
      return text(
        `               total        used        free      shared  buff/cache   available`,
        `Mem:  ${show(MEMORY_MIB)} ${show(used)} ${show(free)} ${show(64)} ${show(cache)} ${show(free + cache)}`,
        `Swap: ${show(SWAP_MIB)} ${show(0)} ${show(SWAP_MIB)}`,
      );
    },
  },
};
