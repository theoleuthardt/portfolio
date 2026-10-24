import { describe, expect, it } from "vitest";
import { projects } from "../content/projects";
import { run, type CommandContext } from "./commands";

const now = new Date(Date.UTC(2026, 9, 24, 18, 5, 9));
const home: CommandContext = { history: [], cwd: "~", now };
const inProjects: CommandContext = { ...home, cwd: "~/projects" };
const texts = (input: string, context = home) =>
  run(input, context).lines.map((line) =>
    "text" in line ? line.text : line.kind,
  );

describe("pwd", () => {
  it("prints the working directory", () => {
    expect(texts("pwd")).toEqual(["/home/guest"]);
    expect(texts("pwd", inProjects)).toEqual(["/home/guest/projects"]);
  });
});

describe("echo", () => {
  it("prints its arguments", () => {
    expect(texts('echo hello   "big world"')).toEqual(["hello big world"]);
  });
});

describe("date", () => {
  it("prints the date like date(1) in UTC", () => {
    expect(texts("date")).toEqual(["Sat Oct 24 18:05:09 UTC 2026"]);
  });
});

describe("uname", () => {
  it("prints the system name, and everything with -a", () => {
    expect(texts("uname")).toEqual(["TheoCloud"]);
    expect(texts("uname -a")).toEqual([
      "TheoCloud rack-01 2.6.0 TheoCloud-OS x86_64 GNU/Linux",
    ]);
  });
});

describe("cd", () => {
  it("changes into projects and back", () => {
    expect(run("cd projects", home).action).toEqual({
      type: "cd",
      cwd: "~/projects",
    });
    expect(run("cd ..", inProjects).action).toEqual({ type: "cd", cwd: "~" });
    expect(run("cd", inProjects).action).toEqual({ type: "cd", cwd: "~" });
    expect(run("cd ~", inProjects).action).toEqual({ type: "cd", cwd: "~" });
  });

  it("reports missing directories and files like bash", () => {
    expect(texts("cd nowhere")).toEqual([
      "cd: nowhere: No such file or directory",
    ]);
    expect(texts("cd projects/flashi")).toEqual([
      "cd: projects/flashi: Not a directory",
    ]);
  });
});

describe("ls", () => {
  it("lists projects in the long format with -l", () => {
    const lines = texts("ls -l");
    expect(lines).toHaveLength(projects.length);
    projects.forEach((project, index) => {
      expect(lines[index]).toMatch(new RegExp(`${project.id}$`));
      expect(lines[index]).toMatch(/^-[rwx-]{9} /);
    });
  });

  it("lists the projects directory and rejects unknown paths and options", () => {
    expect(run("ls projects", home).lines).toEqual(run("ls", home).lines);
    expect(texts("ls nowhere")).toEqual([
      "ls: cannot access 'nowhere': No such file or directory",
    ]);
    expect(texts("ls -x")).toEqual(["ls: invalid option -- 'x'"]);
  });
});

describe("cat", () => {
  it("prints a project's summary, also by path", () => {
    const flashi = projects.find((project) => project.id === "flashi");
    expect(texts("cat flashi")).toContain(flashi?.summary);
    expect(texts("cat projects/flashi")).toEqual(texts("cat flashi"));
  });

  it("reports unknown files and a missing operand", () => {
    expect(texts("cat nope")).toEqual(["cat: nope: No such file or directory"]);
    expect(texts("cat")).toEqual(["cat: missing file operand"]);
  });
});

describe("man", () => {
  it("shows the manual of a command", () => {
    const lines = texts("man open");
    expect(lines[0]).toBe("NAME");
    expect(lines).toContain(
      "    open - opens a project and ejects its module from the rack",
    );
    expect(lines).toContain("    open <project>");
  });

  it("reports unknown pages and a missing argument", () => {
    expect(texts("man nope")).toEqual(["No manual entry for nope"]);
    expect(texts("man")).toEqual(["What manual page do you want?"]);
  });
});

describe("path handling", () => {
  it("normalises . and .. inside paths", () => {
    expect(run("cd projects/..", home).action).toEqual({
      type: "cd",
      cwd: "~",
    });
    expect(run("cd ./projects/.", home).action).toEqual({
      type: "cd",
      cwd: "~/projects",
    });
    expect(texts("cat projects/../projects/flashi")).toEqual(
      texts("cat flashi"),
    );
    expect(run("cd ../..", inProjects).action).toEqual({
      type: "cd",
      cwd: "~",
    });
  });

  it("lists a single project when ls is given one", () => {
    expect(texts("ls projects/flashi")).toEqual(["flashi"]);
    expect(texts("ls flashi", inProjects)).toEqual(["flashi"]);
    const long = texts("ls -l projects/flashi");
    expect(long).toHaveLength(1);
    expect(long[0]).toMatch(/ flashi$/);
  });
});
