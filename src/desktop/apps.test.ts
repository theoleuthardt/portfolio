import { describe, expect, it } from "vitest";
import { ICONS } from "./icons";
import { LAUNCHERS, NOTES, TRASH, windowTitle } from "./apps";
import { absolute, buildFileSystem, readFile } from "../terminal/fs";

describe("desktop apps", () => {
  it("has an icon for every launcher", () => {
    for (const launcher of LAUNCHERS) {
      expect(ICONS[launcher.icon], launcher.label).toBeDefined();
    }
  });

  it("lists notes that exist in the file system", () => {
    const fs = buildFileSystem();
    for (const path of NOTES) {
      expect(readFile(fs, absolute(path, "~")), path).toBeDefined();
    }
  });

  it("titles windows by app and by the file a viewer shows", () => {
    expect(windowTitle("projects")).toBe("Projects");
    expect(windowTitle("viewer", "~/todo.txt")).toBe("~/todo.txt");
    expect(windowTitle("viewer", "trash:bugs.txt")).toBe("bugs.txt");
    expect(Object.keys(TRASH)).toContain("bugs.txt");
  });
});
