/** One phase of the fake intrusion and how long it lasts. */
export interface HackPhase {
  name:
    "scan" | "dump" | "crack" | "firewall" | "upload" | "glitch" | "granted";
  ms: number;
}

/** The phases of `hack`, in order. */
export const HACK_PHASES: readonly HackPhase[] = [
  { name: "scan", ms: 4000 },
  { name: "dump", ms: 3500 },
  { name: "crack", ms: 4500 },
  { name: "firewall", ms: 3000 },
  { name: "upload", ms: 2500 },
  { name: "glitch", ms: 700 },
  { name: "granted", ms: 3200 },
];

/** How long a whole hack takes. */
export const HACK_DURATION_MS = HACK_PHASES.reduce(
  (sum, phase) => sum + phase.ms,
  0,
);

/** What Ctrl+C or q leaves in the log. */
export const HACK_ABORT: readonly string[] = ["^C", "connection reset by peer"];

/** How a hack of a target ends. */
export interface HackEnding {
  title: string;
  twist: string[];
}

/** One frame of the hack: its lines, whether the screen flashes, and if done. */
export interface HackFrame {
  lines: string[];
  flash: boolean;
  done: boolean;
}

const VISIBLE_LINES = 12;
const PASSWORD = "c0ff33-1337-r4ck";
const GLYPHS = "!#$%&*+=?@0123456789abcdefABCDEF";
const BANNER = [
  "+--------------------------------+",
  "|                                |",
  "|   >>>   ACCESS GRANTED   <<<   |",
  "|                                |",
  "+--------------------------------+",
];

function noise(seed: number, step: number): number {
  const value = Math.sin(seed * 12.9898 + step * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

const pick = (seed: number, step: number, from: string) =>
  from[Math.floor(noise(seed, step) * from.length)];

/** The phase running `ms` after the start, and how far into it. */
export function hackPhaseAt(
  ms: number,
): (HackPhase & { elapsed: number; index: number }) | undefined {
  let start = 0;
  for (const [index, phase] of HACK_PHASES.entries()) {
    if (ms < start + phase.ms) {
      return { ...phase, elapsed: ms - start, index };
    }
    start += phase.ms;
  }
  return undefined;
}

/** The ending of a hack of `target`, with hidden endings for some targets. */
export function hackEnding(target: string): HackEnding {
  switch (target) {
    case "gibson":
      return {
        title: "the Gibson",
        twist: [
          "You found the hidden ending.",
          "Hack the planet! Hack the planet!",
        ],
      };
    case "localhost":
    case "127.0.0.1":
    case "theocloud":
      return {
        title: "localhost",
        twist: [
          "Wait. That's this machine.",
          "Congratulations, you hacked yourself. Your password was 'guest'.",
        ],
      };
    case "rack-01":
      return {
        title: "rack-01",
        twist: [
          "You are already inside rack-01. You have been all along.",
          "The rack thanks you for your visit.",
        ],
      };
    case "coffee":
    case "coffee-machine":
      return {
        title: "the coffee machine",
        twist: ["You went straight for it. Respect.", "Brewing espresso ..."],
      };
    default:
      return {
        title: target,
        twist: [
          `Plot twist: "${target}" was Theo's coffee machine all along.`,
          "It is now brewing espresso. You're welcome.",
        ],
      };
  }
}

/** What stays in the log after a finished hack. */
export function hackSummary(target: string): string[] {
  return [`ACCESS GRANTED: ${target}`, ...hackEnding(target).twist];
}

function scan(target: string, elapsed: number): string[] {
  const hosts = Math.floor(elapsed / 110);
  return Array.from({ length: hosts }, (_, host) => {
    const address = `10.${Math.floor(noise(host, 1) * 255)}.${Math.floor(noise(host, 2) * 255)}.${Math.floor(noise(host, 3) * 255)}`;
    const port = [22, 80, 443, 3270, 8080][host % 5];
    return noise(host, 4) > 0.7
      ? `scanning ${address} ... port ${port} open`
      : `scanning ${address} ... filtered`;
  })
    .slice(-VISIBLE_LINES)
    .concat(hosts === 0 ? [`resolving ${target} ...`] : []);
}

function dump(elapsed: number): string[] {
  const rows = Math.floor(elapsed / 90);
  return Array.from({ length: rows }, (_, row) => {
    const bytes = Array.from({ length: 12 }, (_, byte) =>
      Math.floor(noise(row, byte) * 256)
        .toString(16)
        .padStart(2, "0"),
    ).join(" ");
    return `0x${(row * 12).toString(16).padStart(6, "0")}: ${bytes}`;
  }).slice(-VISIBLE_LINES);
}

function crack(elapsed: number, ms: number): string[] {
  const locked = Math.min(
    PASSWORD.length,
    Math.floor((elapsed / ms) * (PASSWORD.length + 1)),
  );
  const step = Math.floor(elapsed / 60);
  const guess = [...PASSWORD]
    .map((char, index) => (index < locked ? char : pick(index, step, GLYPHS)))
    .join("");
  return [
    "cracking password hash ...",
    "",
    `  > ${guess}`,
    "",
    `locked ${locked}/${PASSWORD.length}`,
  ];
}

function bar(share: number, width = 30): string {
  const full = Math.round(share * width);
  return `[${"#".repeat(full)}${".".repeat(width - full)}] ${Math.round(share * 100)}%`;
}

function staticSummary(index: number, target: string): string[] {
  const done = [
    "[ok] port scan: 3 open ports",
    "[ok] memory dump: 4.2 MiB",
    "[ok] password cracked",
    "[ok] firewall down",
    "[ok] payload uploaded",
    "[ok] connection stable",
  ];
  const running = [
    "[..] port scan",
    "[..] memory dump",
    "[..] cracking password",
    "[..] firewall",
    "[..] uploading payload",
    "[..] stabilising connection",
  ];
  return [
    `hacking ${target}`,
    "",
    ...done.slice(0, index),
    ...(index < running.length ? [running[index]] : []),
  ];
}

/**
 * The frame of a hack of `target`, `ms` after it started: a scrolling port
 * scan, a hex dump, a password locking in character by character, a
 * breaking firewall, an upload, a glitch flash and a big ACCESS GRANTED with
 * the target's ending. With reduced motion every phase is a calm checklist
 * and nothing flashes.
 */
export function hackFrame(
  target: string,
  ms: number,
  reducedMotion: boolean,
): HackFrame {
  const phase = hackPhaseAt(ms);
  const ending = hackEnding(target);
  if (phase === undefined || phase.name === "granted") {
    return {
      lines: [
        "",
        ...BANNER,
        "",
        `  connected to ${ending.title}`,
        "",
        ...ending.twist.map((line) => `  ${line}`),
      ],
      flash: false,
      done: phase === undefined,
    };
  }
  if (reducedMotion) {
    return {
      lines: staticSummary(Math.min(phase.index, 5), target),
      flash: false,
      done: false,
    };
  }
  switch (phase.name) {
    case "scan":
      return { lines: scan(target, phase.elapsed), flash: false, done: false };
    case "dump":
      return { lines: dump(phase.elapsed), flash: false, done: false };
    case "crack":
      return {
        lines: crack(phase.elapsed, phase.ms),
        flash: false,
        done: false,
      };
    case "firewall":
      return {
        lines: [
          "breaching firewall ...",
          "",
          `integrity ${bar(1 - phase.elapsed / phase.ms)}`,
        ],
        flash: false,
        done: false,
      };
    case "upload":
      return {
        lines: ["uploading payload.bin ...", "", bar(phase.elapsed / phase.ms)],
        flash: false,
        done: false,
      };
    case "glitch":
      return {
        lines: Array.from({ length: VISIBLE_LINES }, (_, row) =>
          Array.from({ length: 48 }, (_, col) =>
            pick(row * 48 + col, Math.floor(phase.elapsed / 50), GLYPHS),
          ).join(""),
        ),
        flash: true,
        done: false,
      };
  }
}
