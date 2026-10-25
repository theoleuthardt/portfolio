import type { IconName } from "./icons";
import type { AppId } from "./windows";

/** A desktop icon and what it opens. */
export interface Launcher {
  /** `terminal` returns to the terminal, the rest open desktop apps. */
  app: AppId | "terminal";
  label: string;
  icon: IconName;
}

/** The icons on the desktop, top to bottom. */
export const LAUNCHERS: readonly Launcher[] = [
  { app: "terminal", label: "Terminal", icon: "terminal" },
  { app: "projects", label: "Projects", icon: "folder" },
  { app: "map", label: "World map", icon: "globe" },
  { app: "processes", label: "Processes", icon: "gauge" },
  { app: "notes", label: "Notes", icon: "note" },
  { app: "about", label: "About", icon: "person" },
  { app: "trash", label: "Trash", icon: "trash" },
];

/** Files in the trash, with what they say when opened. */
export const TRASH: Readonly<Record<string, readonly string[]>> = {
  "old-portfolio.html": [
    "<marquee>Welcome to my homepage!</marquee>",
    "<blink>under construction</blink>",
    "",
    "(the portfolio before this one. we do not talk about it.)",
  ],
  "bugs.txt": [
    "99 little bugs in the code,",
    "99 little bugs.",
    "Take one down, patch it around,",
    "127 little bugs in the code.",
  ],
  "sleep.exe": ["sleep.exe: permission denied", "(not during the night shift)"],
};

/** The files the Notes app lists, as paths in the file system. */
export const NOTES: readonly string[] = [
  "~/todo.txt",
  "~/notes/meeting.txt",
  "~/notes/ideas.txt",
];

/** The title of a window of `app` showing `payload`. */
export function windowTitle(app: AppId, payload?: string): string {
  switch (app) {
    case "projects":
      return "Projects";
    case "about":
      return "About";
    case "map":
      return "World map";
    case "processes":
      return "Processes";
    case "notes":
      return "Notes";
    case "trash":
      return "Trash";
    case "viewer":
      return payload?.replace(/^trash:/, "") ?? "Viewer";
  }
}
