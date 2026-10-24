import type { Cwd } from "./commands";

/** Everything the browser tab title depends on. */
export interface TabTitleState {
  phase: "splash" | "glide" | "ready";
  percent: number;
  cwd: Cwd;
  openProjectId?: string;
  hidden: boolean;
  cursorOn: boolean;
}

/**
 * The tab title: boot progress while booting, the prompt with a blinking
 * cursor once ready, the open project while one is open, and a lost signal
 * while the tab is in the background.
 */
export function tabTitle({
  phase,
  percent,
  cwd,
  openProjectId,
  hidden,
  cursorOn,
}: TabTitleState): string {
  if (hidden) {
    return "▓ signal lost · theocloud";
  }
  if (phase === "glide") {
    return "TheoCloud OS · ready";
  }
  if (phase === "splash") {
    return `TheoCloud OS · booting ${percent}%`;
  }
  const prompt = `guest@theocloud:${cwd}$`;
  if (openProjectId !== undefined) {
    return `${prompt} open ${openProjectId}`;
  }
  return `${prompt} ${cursorOn ? "█" : "_"}`;
}
