import { friends } from "../content/friends";
import { projects, type Project } from "../content/projects";

/** A file with its lines of text. */
export interface FileNode {
  kind: "file";
  lines: readonly string[];
}

/** A directory with its entries by name. */
export interface DirNode {
  kind: "dir";
  entries: ReadonlyMap<string, FsNode>;
}

/** A node of the virtual file system. */
export type FsNode = FileNode | DirNode;

/** One entry of a directory listing. */
export interface DirEntry {
  name: string;
  node: FsNode;
}

/** The guest's home directory. */
export const HOME = "/home/guest";

const file = (...lines: string[]): FileNode => ({ kind: "file", lines });
const dir = (entries: Record<string, FsNode>): DirNode => ({
  kind: "dir",
  entries: new Map(Object.entries(entries)),
});

function projectDir(project: Project): DirNode {
  const links = [
    `repository  ${project.repository}`,
    ...(project.website ? [`website     ${project.website}`] : []),
    ...(project.releases ? [`releases    ${project.releases}`] : []),
    ...(project.packages ? [`packages    ${project.packages}`] : []),
    ...(project.fork ? [`upstream    ${project.fork.upstream}`] : []),
  ];
  return dir({
    "README.md": file(
      `# ${project.title}${project.fork ? " (fork)" : ""}`,
      "",
      project.tagline,
      "",
      project.summary,
    ),
    "stack.txt": file(...project.stack),
    "links.txt": file(...links),
  });
}

/**
 * The guest's virtual file system: a small root, a home with dotfiles, a
 * readme and one directory per project with its README, stack and links,
 * all generated from the typed content.
 */
export function buildFileSystem(): DirNode {
  return dir({
    bin: dir({}),
    etc: dir({
      hostname: file("theocloud"),
      "os-release": file(
        'NAME="TheoCloud OS"',
        'VERSION="2.6 (rack-01)"',
        "ID=theocloud",
        'PRETTY_NAME="TheoCloud OS 2.6"',
        'HOME_URL="https://theocloud.dev"',
      ),
      motd: file("Welcome to TheoCloud OS. The coffee is a lie."),
    }),
    home: dir({
      guest: dir({
        ".bash_history": file("sudo make me a sandwich", "exit", "vim"),
        ".bashrc": file(
          "# ~/.bashrc of the guest account",
          "export EDITOR=vim",
          "alias ll='ls -l'",
          'PS1="\\u@\\h:\\w\\$ "',
        ),
        ".profile": file("[ -f ~/.bashrc ] && . ~/.bashrc"),
        "README.md": file(
          "# Welcome to TheoCloud OS",
          "",
          "This is Theo Leuthardt's lab. The projects live in ~/projects,",
          "one directory each. Try: cd projects, ls, cat flashi/README.md,",
          "open flashi, or just help.",
          "",
          `Friends of the lab: ${friends.map((friend) => friend.site).join(", ")} (type friends).`,
        ),
        projects: dir(
          Object.fromEntries(
            projects.map((project) => [project.id, projectDir(project)]),
          ),
        ),
      }),
    }),
    tmp: dir({}),
  });
}

/**
 * The absolute path of `path` seen from the working directory `cwd` (both
 * may use `~` for home); `.` and `..` are resolved, never above the root.
 */
export function absolute(path: string, cwd: string): string {
  const expand = (value: string) => value.replace(/^~(?=\/|$)/, HOME);
  const target = path === "" ? "~" : path;
  const start = expand(target).startsWith("/") ? "" : expand(cwd);
  const segments: string[] = [];
  for (const segment of `${start}/${expand(target)}`.split("/")) {
    if (segment === "..") {
      segments.pop();
    } else if (segment !== "" && segment !== ".") {
      segments.push(segment);
    }
  }
  return `/${segments.join("/")}`;
}

/** An absolute path as the prompt shows it, with `~` for home. */
export function display(path: string): string {
  if (path === HOME) {
    return "~";
  }
  return path.startsWith(`${HOME}/`) ? `~${path.slice(HOME.length)}` : path;
}

/** The node at an absolute path, or `undefined` if there is none. */
export function lookup(root: DirNode, path: string): FsNode | undefined {
  let node: FsNode | undefined = root;
  for (const segment of path.split("/").filter(Boolean)) {
    node = node?.kind === "dir" ? node.entries.get(segment) : undefined;
  }
  return node;
}

/** The entries of the directory at an absolute path, sorted by name. */
export function list(root: DirNode, path: string): DirEntry[] | undefined {
  const node = lookup(root, path);
  if (node?.kind !== "dir") {
    return undefined;
  }
  return [...node.entries]
    .map(([name, entry]) => ({ name, node: entry }))
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
}

/** The lines of the file at an absolute path, or `undefined`. */
export function readFile(
  root: DirNode,
  path: string,
): readonly string[] | undefined {
  const node = lookup(root, path);
  return node?.kind === "file" ? node.lines : undefined;
}
