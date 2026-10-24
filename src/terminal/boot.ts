import { projects } from "../content/projects";
import type { TerminalLine } from "./commands";

/** Name of the operating system the terminal pretends to run. */
export const OS_NAME = "TheoCloud OS";

/** Version line printed under the logo. */
export const OS_VERSION_LINE = `${OS_NAME} v2.6 // rack-01`;

/** Boot logo in ANSI Shadow letters for wide screens. */
export const LOGO_WIDE = [
  "████████╗██╗  ██╗███████╗ ██████╗  ██████╗██╗      ██████╗ ██╗   ██╗██████╗ ",
  "╚══██╔══╝██║  ██║██╔════╝██╔═══██╗██╔════╝██║     ██╔═══██╗██║   ██║██╔══██╗",
  "   ██║   ███████║█████╗  ██║   ██║██║     ██║     ██║   ██║██║   ██║██║  ██║",
  "   ██║   ██╔══██║██╔══╝  ██║   ██║██║     ██║     ██║   ██║██║   ██║██║  ██║",
  "   ██║   ██║  ██║███████╗╚██████╔╝╚██████╗███████╗╚██████╔╝╚██████╔╝██████╔╝",
  "   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝  ╚═════╝╚══════╝ ╚═════╝  ╚═════╝ ╚═════╝ ",
].join("\n");

/** Boot logo for phones: THEO above CLOUD. */
export const LOGO_COMPACT = [
  "████████╗██╗  ██╗███████╗ ██████╗ ",
  "╚══██╔══╝██║  ██║██╔════╝██╔═══██╗",
  "   ██║   ███████║█████╗  ██║   ██║",
  "   ██║   ██╔══██║██╔══╝  ██║   ██║",
  "   ██║   ██║  ██║███████╗╚██████╔╝",
  "   ╚═╝   ╚═╝  ╚═╝╚══════╝ ╚═════╝ ",
  " ██████╗██╗      ██████╗ ██╗   ██╗██████╗ ",
  "██╔════╝██║     ██╔═══██╗██║   ██║██╔══██╗",
  "██║     ██║     ██║   ██║██║   ██║██║  ██║",
  "██║     ██║     ██║   ██║██║   ██║██║  ██║",
  "╚██████╗███████╗╚██████╔╝╚██████╔╝██████╔╝",
  " ╚═════╝╚══════╝ ╚═════╝  ╚═════╝ ╚═════╝ ",
].join("\n");

/** One step of the boot progress bar. */
export interface BootStep {
  label: string;
  percent: number;
}

/** The steps the progress bar walks through, ending at 100 percent. */
export const bootSteps: readonly BootStep[] = [
  { label: "power-on self test", percent: 12 },
  { label: "mem check 640K", percent: 27 },
  { label: `mounting /projects (${projects.length} modules)`, percent: 46 },
  { label: "linking rack-01", percent: 64 },
  { label: "starting services", percent: 78 },
  { label: "syncing lab", percent: 92 },
  { label: "ready", percent: 100 },
];

const BAR_CELLS = 20;

/** A text progress bar like `[████████████░░░░░░░░]  61%`. */
export function progressBar(percent: number): string {
  const clamped = Math.min(100, Math.max(0, percent));
  const filled = Math.round((clamped / 100) * BAR_CELLS);
  return `[${"█".repeat(filled)}${"░".repeat(BAR_CELLS - filled)}] ${String(clamped).padStart(3)}%`;
}

/** Output shown below logo and progress bar once the boot is complete. */
export const bootLines: readonly TerminalLine[] = [
  {
    kind: "text",
    text: `Welcome, guest. ${OS_NAME} is ready: type a command or pick one below.`,
  },
  { kind: "chips", commands: ["help", "ls", "open trust-issues"] },
];
