import { describe, expect, it } from "vitest";
import { projects } from "../content/projects";
import {
  absolute,
  buildFileSystem,
  display,
  list,
  lookup,
  readFile,
} from "./fs";

const fs = buildFileSystem();

describe("absolute", () => {
  it("resolves home, relative and absolute paths against the working directory", () => {
    expect(absolute("~", "~/projects")).toBe("/home/guest");
    expect(absolute("", "~/projects")).toBe("/home/guest");
    expect(absolute("flashi", "~/projects")).toBe(
      "/home/guest/projects/flashi",
    );
    expect(absolute("../..", "~/projects")).toBe("/home");
    expect(absolute("/etc/./hostname", "~")).toBe("/etc/hostname");
    expect(absolute("~/projects/../projects/", "/")).toBe(
      "/home/guest/projects",
    );
  });

  it("never climbs above the root", () => {
    expect(absolute("../../../../..", "~")).toBe("/");
  });
});

describe("display", () => {
  it("shows home and everything below it with a tilde", () => {
    expect(display("/home/guest")).toBe("~");
    expect(display("/home/guest/projects")).toBe("~/projects");
    expect(display("/home")).toBe("/home");
    expect(display("/")).toBe("/");
  });
});

describe("buildFileSystem", () => {
  it("has a directory per project with its README, stack and links", () => {
    for (const project of projects) {
      const names = list(fs, `/home/guest/projects/${project.id}`)?.map(
        (entry) => entry.name,
      );
      expect(names).toEqual(
        project.id === "dinogame"
          ? ["README.md", "highscore.txt", "links.txt", "stack.txt"]
          : ["README.md", "links.txt", "stack.txt"],
      );
      expect(
        readFile(fs, `/home/guest/projects/${project.id}/README.md`),
      ).toContain(project.summary);
      expect(
        readFile(fs, `/home/guest/projects/${project.id}/links.txt`),
      ).toContain(`repository  ${project.repository}`);
    }
  });

  it("has a home with dotfiles, a readme, notes, a todo list and the projects", () => {
    expect(list(fs, "/home/guest")?.map((entry) => entry.name)).toEqual([
      ".bash_history",
      ".bashrc",
      ".profile",
      ".secret",
      "README.md",
      "notes",
      "projects",
      "todo.txt",
    ]);
  });

  it("has a small root with etc, home and tmp", () => {
    expect(list(fs, "/")?.map((entry) => entry.name)).toEqual([
      "bin",
      "etc",
      "home",
      "tmp",
    ]);
    expect(readFile(fs, "/etc/hostname")).toEqual(["theocloud"]);
  });
});

describe("lookup", () => {
  it("finds directories and files and returns undefined otherwise", () => {
    expect(lookup(fs, "/home/guest/projects")?.kind).toBe("dir");
    expect(lookup(fs, "/home/guest/README.md")?.kind).toBe("file");
    expect(lookup(fs, "/home/guest/nope")).toBeUndefined();
    expect(lookup(fs, "/home/guest/README.md/x")).toBeUndefined();
  });
});
