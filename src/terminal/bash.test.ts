import { describe, expect, it } from "vitest";
import { projects } from "../content/projects";
import { run, type CommandContext } from "./commands";

const now = new Date(Date.UTC(2026, 9, 24, 18, 5, 9));
const home: CommandContext = { history: [], cwd: "~", now };
const inProjects: CommandContext = { ...home, cwd: "~/projects" };
const inFlashi: CommandContext = { ...home, cwd: "~/projects/flashi" };
const texts = (input: string, context = home) =>
  run(input, context).lines.map((line) =>
    "text" in line ? line.text : line.kind === "dir" ? line.name : line.kind,
  );
const flashi = projects.find((project) => project.id === "flashi");

describe("pwd", () => {
  it("prints the absolute working directory", () => {
    expect(texts("pwd")).toEqual(["/home/guest"]);
    expect(texts("pwd", inFlashi)).toEqual(["/home/guest/projects/flashi"]);
  });
});

describe("cd", () => {
  it("changes into directories at any depth and back", () => {
    expect(run("cd projects", home).state.cwd).toBe("~/projects");
    expect(run("cd projects/flashi", home).state.cwd).toBe("~/projects/flashi");
    expect(run("cd ..", inFlashi).state.cwd).toBe("~/projects");
    expect(run("cd", inFlashi).state.cwd).toBe("~");
    expect(run("cd /etc", home).state.cwd).toBe("/etc");
    expect(run("cd ~/projects/", home).state.cwd).toBe("~/projects");
  });

  it("goes back to the previous directory with cd - and prints it", () => {
    const result = run("cd -", { ...inProjects, oldpwd: "~/projects/flashi" });
    expect(result.state.cwd).toBe("~/projects/flashi");
    expect(result.state.oldpwd).toBe("~/projects");
    expect(texts("cd -", { ...inProjects, oldpwd: "~" })).toEqual([
      "/home/guest",
    ]);
    expect(texts("cd -")).toEqual(["bash: cd: OLDPWD not set"]);
  });

  it("reports missing directories, files and extra arguments like bash", () => {
    expect(texts("cd nowhere")).toEqual([
      "bash: cd: nowhere: No such file or directory",
    ]);
    expect(texts("cd README.md")).toEqual([
      "bash: cd: README.md: Not a directory",
    ]);
    expect(texts("cd a b")).toEqual(["bash: cd: too many arguments"]);
    expect(run("cd nowhere", home).state.status).toBe(1);
  });
});

describe("ls", () => {
  it("lists home without dotfiles, with -a including them", () => {
    expect(texts("ls")).toEqual([
      "README.md",
      "notes/",
      "projects/",
      "todo.txt",
    ]);
    expect(texts("ls -a")).toEqual([
      "./",
      "../",
      ".bash_history",
      ".bashrc",
      ".profile",
      ".secret",
      "README.md",
      "notes/",
      "projects/",
      "todo.txt",
    ]);
  });

  it("makes directories clickable and lists projects with their taglines", () => {
    expect(run("ls", home).lines).toContainEqual({
      kind: "dir",
      name: "projects/",
      command: "cd projects",
    });
    const rows = run("ls", inProjects).lines.filter(
      (line) => line.kind === "project",
    );
    expect(rows).toHaveLength(projects.length);
  });

  it("lists a project's files", () => {
    expect(texts("ls", inFlashi)).toEqual([
      "README.md",
      "links.txt",
      "stack.txt",
    ]);
    expect(texts("ls projects/flashi")).toEqual(texts("ls", inFlashi));
  });

  it("prints the long format with a total line, also combined with -a", () => {
    const long = texts("ls -l");
    expect(long[0]).toMatch(/^total \d+$/);
    expect(long[1]).toMatch(
      /^-rw-r--r-- 1 guest lab +\d+ Oct 24 18:05 README\.md$/,
    );
    expect(long).toContainEqual(
      expect.stringMatching(
        /^drwxr-xr-x \d+ guest lab +4096 Oct 24 18:05 projects$/,
      ),
    );
    expect(texts("ls -la")).toHaveLength(11);
    expect(texts("ls -al")).toEqual(texts("ls -l -a"));
  });

  it("lists several paths with headers and reports missing ones", () => {
    expect(texts("ls /etc projects/flashi")).toEqual([
      "/etc:",
      "hostname",
      "motd",
      "os-release",
      "",
      "projects/flashi:",
      "README.md",
      "links.txt",
      "stack.txt",
    ]);
    expect(texts("ls nowhere")).toEqual([
      "ls: cannot access 'nowhere': No such file or directory",
    ]);
    expect(run("ls nowhere", home).state.status).toBe(2);
    expect(texts("ls README.md")).toEqual(["README.md"]);
    expect(texts("ls -x")).toEqual(["ls: invalid option -- 'x'"]);
  });
});

describe("cat", () => {
  it("prints files, several in a row", () => {
    expect(texts("cat projects/flashi/README.md")).toContain(flashi?.summary);
    const both = texts("cat stack.txt links.txt", inFlashi);
    expect(both.slice(0, flashi?.stack.length)).toEqual(flashi?.stack);
    expect(both).toContain(`repository  ${flashi?.repository}`);
  });

  it("reports directories, missing files and suggests a project's readme", () => {
    expect(texts("cat projects")).toEqual(["cat: projects: Is a directory"]);
    const result = run("cat flashi", home);
    expect(result.lines[0]).toEqual({
      kind: "error",
      text: "cat: flashi: No such file or directory",
    });
    expect(result.lines).toContainEqual({
      kind: "chips",
      commands: ["cat projects/flashi/README.md"],
    });
    expect(texts("cat")).toEqual(["cat: missing file operand"]);
  });
});

describe("tree", () => {
  it("draws a directory tree with a summary", () => {
    const lines = texts("tree projects/flashi");
    expect(lines).toEqual([
      "projects/flashi",
      "├── README.md",
      "├── links.txt",
      "└── stack.txt",
      "",
      "0 directories, 3 files",
    ]);
    expect(texts("tree")).toContain(
      `${projects.length + 2} directories, ${projects.length * 3 + 5} files`,
    );
  });
});

describe("text tools", () => {
  it("cuts with head and tail, also from a pipe", () => {
    expect(texts("head -n 2 projects/flashi/stack.txt")).toEqual(
      flashi?.stack.slice(0, 2),
    );
    expect(texts("tail -n 1 projects/flashi/stack.txt")).toEqual(
      flashi?.stack.slice(-1),
    );
    expect(texts("cat projects/flashi/stack.txt | head -3")).toEqual(
      flashi?.stack.slice(0, 3),
    );
  });

  it("counts with wc and filters with grep and sort", () => {
    expect(texts("ls projects | wc -l")).toEqual([String(projects.length)]);
    expect(texts("wc -l projects/flashi/stack.txt")).toEqual([
      `${flashi?.stack.length} projects/flashi/stack.txt`,
    ]);
    expect(texts("cat projects/flashi/stack.txt | grep -i react")).toEqual([
      "React",
    ]);
    expect(texts("echo b a c | sort")).toEqual(["b a c"]);
    expect(
      texts("cat projects/flashi/stack.txt | sort -r | head -n 1"),
    ).toEqual([[...(flashi?.stack ?? [])].sort().reverse()[0]]);
    expect(run("grep nope projects/flashi/stack.txt", home).state.status).toBe(
      1,
    );
  });
});

describe("pipes and lists", () => {
  it("runs && only after success and || only after failure", () => {
    expect(texts("cd nowhere && pwd")).toEqual([
      "bash: cd: nowhere: No such file or directory",
    ]);
    expect(texts("cd nowhere || echo fallback")).toEqual([
      "bash: cd: nowhere: No such file or directory",
      "fallback",
    ]);
    expect(texts("cd projects; pwd")).toEqual(["/home/guest/projects"]);
    expect(run("cd projects; cd flashi", home).state.cwd).toBe(
      "~/projects/flashi",
    );
  });

  it("shows errors of a pipeline's commands but pipes only their output", () => {
    expect(texts("cat nope | wc -l")).toEqual([
      "cat: nope: No such file or directory",
      "0",
    ]);
  });

  it("reports syntax errors with status 2", () => {
    const result = run("ls |", home);
    expect(texts("ls |")).toEqual([
      "bash: syntax error near unexpected token `newline'",
    ]);
    expect(result.state.status).toBe(2);
  });
});

describe("variables", () => {
  it("knows the usual environment", () => {
    expect(texts("echo $HOME $USER $SHELL $PWD", inProjects)).toEqual([
      "/home/guest guest /bin/bash /home/guest/projects",
    ]);
  });

  it("sets variables with export and plain assignments, and unsets them", () => {
    expect(texts("export FOO=bar; echo $FOO")).toEqual(["bar"]);
    expect(texts("GREETING=hi && echo $GREETING world")).toEqual(["hi world"]);
    expect(run("export FOO=bar", home).state.env.FOO).toBe("bar");
    expect(
      run("unset FOO", { ...home, env: { FOO: "bar" } }).state.env.FOO,
    ).toBeUndefined();
  });

  it("lists the environment with env and shows the last status with $?", () => {
    expect(texts("env")).toContain("USER=guest");
    expect(texts("xyzzy; echo $?")).toEqual([
      "bash: xyzzy: command not found",
      "type 'help' for a list of commands",
      "127",
    ]);
    expect(texts("pwd; echo $?")).toEqual(["/home/guest", "0"]);
  });
});

describe("small commands", () => {
  it("answers whoami, hostname, uname and date", () => {
    expect(texts("whoami")).toEqual(["guest"]);
    expect(texts("hostname")).toEqual(["theocloud"]);
    expect(texts("uname")).toEqual(["TheoCloud"]);
    expect(texts("date")).toEqual(["Sat Oct 24 18:05:09 UTC 2026"]);
    expect(texts('echo hello   "big world"')).toEqual(["hello big world"]);
  });

  it("refuses to exit", () => {
    expect(texts("exit")).toEqual([
      "logout",
      "There is no escape. The rack needs you.",
    ]);
  });

  it("reports unknown commands like bash and still suggests the closest one", () => {
    const result = run("hlep", home);
    expect(result.lines).toEqual([
      { kind: "error", text: "bash: hlep: command not found" },
      { kind: "muted", text: "did you mean:" },
      { kind: "chips", commands: ["help"] },
    ]);
    expect(result.state.status).toBe(127);
  });
});

describe("open", () => {
  it("opens the project of the current directory with open .", () => {
    expect(run("open .", inFlashi).actions).toEqual([
      { type: "open", projectId: "flashi" },
    ]);
    expect(run("open projects/flashi", home).actions).toEqual([
      { type: "open", projectId: "flashi" },
    ]);
    expect(texts("open .")).toEqual(["open: .: not a project directory"]);
  });

  it("can follow a cd in the same line", () => {
    const result = run("cd projects/flashi && open .", home);
    expect(result.actions).toEqual([{ type: "open", projectId: "flashi" }]);
    expect(result.state.cwd).toBe("~/projects/flashi");
  });
});

describe("review follow-ups", () => {
  it("rejects invalid line counts for head and tail", () => {
    expect(texts("head -n abc projects/flashi/stack.txt")).toEqual([
      "head: invalid number of lines: 'abc'",
    ]);
    expect(texts("tail -n -x projects/flashi/stack.txt")).toEqual([
      "tail: invalid number of lines: '-x'",
    ]);
    expect(texts("head -n")).toEqual([
      "head: option requires an argument -- 'n'",
    ]);
  });

  it("counts several files separately with a total", () => {
    const stack = flashi?.stack.length ?? 0;
    expect(texts("wc -l stack.txt links.txt", inFlashi)).toEqual([
      `${stack} stack.txt`,
      "2 links.txt",
      `${stack + 2} total`,
    ]);
  });

  it("prefixes grep matches with the file name when searching several files", () => {
    expect(texts("grep -n repository links.txt stack.txt", inFlashi)).toEqual([
      `links.txt:1:repository  ${flashi?.repository}`,
    ]);
  });

  it("does not expand inherited object properties as variables", () => {
    expect(texts("echo [$constructor] [$toString]")).toEqual(["[] []"]);
  });

  it("reports a file given to tree like tree does", () => {
    expect(texts("tree README.md")).toEqual([
      "README.md [error opening dir]",
      "",
      "0 directories, 0 files",
    ]);
  });
});
