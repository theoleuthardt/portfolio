import { projects } from "../content/projects";
import type { TerminalLine } from "./commands";

/** Output of the boot sequence, revealed line by line on the first visit. */
export const bootLines: readonly TerminalLine[] = [
  { kind: "muted", text: "THEOCLOUD BIOS v2.6 (C) 1987-2026" },
  { kind: "muted", text: "MEM CHECK 640K ................ OK" },
  {
    kind: "muted",
    text: `MOUNT /projects ............... ${projects.length} MODULES`,
  },
  { kind: "muted", text: "RACK-01 LINK .................. UP" },
  { kind: "muted", text: "STARTING SERVICES ............. OK" },
  { kind: "text", text: "Welcome, guest. Type a command or pick one below." },
  { kind: "chips", commands: ["help", "ls", "open trust-issues"] },
];
