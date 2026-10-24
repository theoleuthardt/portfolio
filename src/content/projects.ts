/** Height of the server rack in rack units (U). */
export const RACK_UNITS = 16;

/** Upstream of a forked project. */
export interface Fork {
  upstream: string;
}

/** A project shown as a module in the rack and listed by the terminal. */
export interface Project {
  /** Lowercase id, typed in the terminal as `open <id>`. */
  id: string;
  title: string;
  /** One line for `ls`, at most 40 characters. */
  tagline: string;
  /** One paragraph for the project screen, taken from the README. */
  summary: string;
  stack: readonly string[];
  repository: string;
  /** Live site of the project, if it is deployed somewhere public. */
  website?: string;
  /** GitHub releases page, if the repository publishes releases. */
  releases?: string;
  /** GitHub packages of the repository, e.g. container images on GHCR. */
  packages?: string;
  /** Height of the module in rack units. */
  units: 1 | 2;
  fork?: Fork;
}

/**
 * The projects in rack order, top to bottom. Releases and packages were
 * collected once from the GitHub API; none of the repositories sets a
 * homepage or a public deployment URL yet.
 */
export const projects: readonly Project[] = [
  {
    id: "backlog-manager",
    title: "Backlog Manager",
    tagline: "Gaming backlog manager",
    summary:
      "Organise your gaming backlog: track games with HowLongToBeat and IGDB data, sort them into categories by drag and drop, sync playtimes from Steam and import or export CSV files. A Python/Litestar REST API backs a React/Vite frontend that ships as a Tauri desktop app.",
    stack: ["Python", "Litestar", "PostgreSQL", "React", "Vite", "Tauri"],
    repository: "https://github.com/theoleuthardt/backlog-manager",
    releases: "https://github.com/theoleuthardt/backlog-manager/releases",
    packages:
      "https://github.com/theoleuthardt?tab=packages&repo_name=backlog-manager",
    units: 2,
  },
  {
    id: "trust-issues",
    title: "Trust Issues",
    tagline: "2D trap platformer for the browser",
    summary:
      "A trap platformer in the spirit of Level Devil: nothing is what it looks like, the floor lies and the spikes appear where you just stood. Twenty-nine levels, accounts and leaderboards you can trust, because the server replays your recorded inputs through the same deterministic simulation to verify every time. The best runs can be watched as replays.",
    stack: [
      "TypeScript",
      "Phaser 3",
      "Vite",
      "Node",
      "Litestar",
      "PostgreSQL",
      "Podman",
    ],
    repository: "https://github.com/theoleuthardt/trust-issues",
    releases: "https://github.com/theoleuthardt/trust-issues/releases",
    packages:
      "https://github.com/theoleuthardt?tab=packages&repo_name=trust-issues",
    units: 2,
  },
  {
    id: "flashi",
    title: "Flashi",
    tagline: "Self-hosted flashcards and quizzes",
    summary:
      "A self-hosted learning app for flashcard decks and quizzes, organised by topics and studied with spaced repetition (SM-2). Built to learn Russian, works for anything: multiple-choice quizzes with explanations, daily mixes, Discord reminders, multiple users and an installable PWA.",
    stack: ["React", "TypeScript", "Vite", "Express", "Docker"],
    repository: "https://github.com/theoleuthardt/flashi",
    packages: "https://github.com/theoleuthardt?tab=packages&repo_name=flashi",
    units: 2,
  },
  {
    id: "homelab-docker-compose",
    title: "Homelab Docker Compose",
    tagline: "Compose files of my homelab",
    summary:
      "The docker-compose files of every self-hosted service in my homelab, one directory per service with its own configuration, from Immich, Grafana and AdGuard to n8n, Navidrome and a Cloudflare tunnel. Secrets stay out of the repository in .env files.",
    stack: ["Docker", "Docker Compose"],
    repository: "https://github.com/theoleuthardt/homelab-docker-compose",
    units: 1,
  },
  {
    id: "claude-devcontainer",
    title: "Claude Devcontainer",
    tagline: "Dev container for Claude Code",
    summary:
      "A Podman container for developing the Backlog Manager with Claude Code, running permanently in a privileged Debian LXC on Proxmox and controlled remotely. It bundles Claude Code, Flutter, Node, uv, the GitHub CLI, go-task and a review script that uses CodeRabbit with an Ollama fallback.",
    stack: ["Podman", "Debian", "Proxmox", "Claude Code", "Shell"],
    repository: "https://github.com/theoleuthardt/claude-devcontainer",
    packages:
      "https://github.com/theoleuthardt?tab=packages&repo_name=claude-devcontainer",
    units: 1,
  },
  {
    id: "opennutritracker",
    title: "OpenNutriTracker",
    tagline: "Fork of a privacy-first calorie tracker",
    summary:
      "My personal fork of OpenNutriTracker, the free and open-source calorie, macro and micronutrient tracker for Android and iOS that keeps your eating history on your phone. The fork carries my own changes and builds for sideloading onto a single iPhone.",
    stack: ["Flutter", "Dart", "iOS"],
    repository: "https://github.com/theoleuthardt/OpenNutriTracker",
    units: 2,
    fork: { upstream: "https://github.com/simonoppowa/OpenNutriTracker" },
  },
  {
    id: "dinogame",
    title: "Dino Game",
    tagline: "The Chrome dino runner in C++",
    summary:
      "A remake of the iconic dinosaur endless runner from Chrome's offline page: run through the desert, jump over cacti and chase the high score while the game speeds up over time. Written in C++ with raylib and built with CMake.",
    stack: ["C++", "raylib", "CMake"],
    repository: "https://github.com/theoleuthardt/DinoGame",
    releases: "https://github.com/theoleuthardt/DinoGame/releases",
    units: 1,
  },
];

/** Looks up a project by id, ignoring case. */
export function findProject(id: string): Project | undefined {
  const wanted = id.toLowerCase();
  return projects.find((project) => project.id === wanted);
}
