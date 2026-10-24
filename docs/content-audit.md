# Content audit of the existing portfolio

As of 2026-10-24, commit `cbad1ca` on `master`. Basis for the rebuild into an interactive terminal/HUD portfolio with a Three.js rack scene (epics #17, #18).

Rating: **keep** (take over unchanged), **rework** (content stays, implementation changes), **drop** (removed).

## 1. Pages and sections

The site is a single scroll page without real routes.

| Section       | Content                                                                                 | Rating | Reason                                                                                                                                                              |
| ------------- | --------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hero          | Typewriter "Hii! I'm Theo." → "Welcome to my Portfolio!", button "Explore my projects!" | rework | The greeting and typing effect fit the terminal. They become the terminal's boot sequence / MOTD, without the library.                                              |
| Projects      | Grid of 6 project cards (icon and title, link)                                          | rework | The projects are the core. They become rack modules in the 3D scene and the `projects` command in the terminal. So far only a title, no description, no tech stack. |
| Impressum     | Name, address, phone, e-mail (component is never rendered)                              | drop   | Removed as requested (#21). It is not shown anywhere anyway.                                                                                                        |
| "Career Path" | only `careerpathRef` and navbar branches, no section                                    | drop   | Dead code; the section never existed. Whether an `about`/`cv` command comes, see open questions.                                                                    |

## 2. Content (`src/constants/index.ts`)

### Navigation (`navLinks`)

| Entry      | Target                        | Rating | Reason                                                                         |
| ---------- | ----------------------------- | ------ | ------------------------------------------------------------------------------ |
| Home       | scroll to top                 | rework | Becomes `clear` / `home` in the terminal.                                      |
| Projects   | scroll to section             | rework | Becomes `projects` and the camera focus on the rack.                           |
| Github     | github.com/theoleuthardt      | keep   | Most important link for a developer portfolio, planned as `contact`/`socials`. |
| AlexInABox | alexinabox.de                 | keep   | Friend's portfolio, planned as a `friends` command instead of main navigation. |
| Lagopodus  | lagopodus.github.io/portfolio | keep   | Same as AlexInABox.                                                            |

### Projects (`projects`)

| Project               | Link                         | Rating | Reason                                                               |
| --------------------- | ---------------------------- | ------ | -------------------------------------------------------------------- |
| Werkzeugkiste         | toolbox.theocloud.dev        | rework | Live project. Needs a description and stack.                         |
| Network Interaction   | GitHub                       | rework | Fits the rack theme perfectly (network module). Needs a description. |
| Homelab Docker        | GitHub                       | rework | Fits the rack/homelab scene. Needs a description.                    |
| Python Best Practices | GitHub                       | rework | Needs a description. The icon is far too large (see assets).         |
| Dino Game             | GitHub                       | rework | Needs a description. Works as an easter egg (`play dino`).           |
| Grow Green            | GitHub Releases (AlexInABox) | rework | Joint project. The role should be stated.                            |

Projects that exist on GitHub but are missing here (for example Backlog Manager, whose `backlog-icon.svg` is already in the repo) are listed under the open questions.

## 3. Components

| File                           | Purpose                                  | Rating | Reason                                                                                                                                                                                                                                                                                              |
| ------------------------------ | ---------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/App.tsx`                  | Layout, `AnimatedBackground`, refs       | rework | Becomes canvas plus terminal overlay. `BrowserRouter` without routes and the undefined class `bg-hero-pattern` go away.                                                                                                                                                                             |
| `src/components/Navbar.tsx`    | Desktop and mobile navigation            | drop   | Navigation moves to the terminal (commands and clickable suggestions). It is also buggy: `link.type in [...]` checks array indices and is always `false`; the mobile menu builds `#id` anchors instead of external links for AlexInABox and Lagopodus; the logic is duplicated and keyed on titles. |
| `src/components/Hero.tsx`      | Typewriter hero                          | drop   | Replaced by the terminal boot sequence (see sections).                                                                                                                                                                                                                                              |
| `src/components/Projects.tsx`  | Project grid                             | rework | The data model stays; the presentation becomes a rack plus terminal output. Every image has `alt="backlogIcon"`, the widths are swapped (`w-[40rem] sm:w-[20rem]`), and links have neither `target` nor `rel`.                                                                                      |
| `src/components/Button.tsx`    | Glass button                             | drop   | Not needed in the terminal design. It is also exported twice (named and default).                                                                                                                                                                                                                   |
| `src/components/Impressum.tsx` | Impressum                                | drop   | #21.                                                                                                                                                                                                                                                                                                |
| `src/components/index.ts`      | Barrel export                            | rework | Adjusted to the new components.                                                                                                                                                                                                                                                                     |
| `src/styles.ts`                | Tailwind class strings                   | drop   | Only `paddingX` is used. Replaced by design tokens (#30).                                                                                                                                                                                                                                           |
| `src/index.css`                | Poppins import, gradients, `rainbowText` | drop   | Except for `rainbowText`, no gradient is used. New typography (monospace) and effects come from #30.                                                                                                                                                                                                |
| `tailwind.config.ts`           | Colours, shadow, breakpoint `xs`         | rework | Tailwind stays; colours and typography are replaced by tokens.                                                                                                                                                                                                                                      |
| `src/types/*.d.ts`             | Module declarations                      | drop   | Become obsolete with `animated-backgrounds` and `typewriter-effect`.                                                                                                                                                                                                                                |
| `index.html`                   | Title "Theo", favicon                    | rework | Missing meta description, Open Graph tags, `theme-color` and a `noscript` alternative. `lang="en"` has to match the language decision.                                                                                                                                                              |

## 4. Assets

| File                                                        | Size                  | Usage                   | Rating | Reason                                                                                                                   |
| ----------------------------------------------------------- | --------------------- | ----------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------ |
| `src/assets/logo_me.png`                                    | 84 KB, 256×256        | Navbar, favicon         | rework | Keep as avatar/favicon, but as WebP and with proper favicon sizes.                                                       |
| `public/logo_me.png`                                        | 84 KB                 | unused                  | drop   | Duplicate of `src/assets/logo_me.png`.                                                                                   |
| `src/assets/python.png`                                     | **821 KB**, 3000×3000 | Project icon (40×40 px) | rework | About 79 % of the bytes in `src/assets/` (821 of 1,038 KB). Shrink to an icon of fitting size or an SVG.                 |
| `src/assets/godot.png`                                      | 102 KB, 2048×2048     | Project icon            | rework | Same as python.png.                                                                                                      |
| `src/assets/docker.png`, `network.png`, `dinosaur-game.png` | 1–8 KB                | Project icons           | rework | Size is fine. In the rack they become textures or labels; a consistent style would help.                                 |
| `src/assets/toolbox.svg`                                    | 2 KB                  | Project icon            | keep   | Already an SVG.                                                                                                          |
| `src/assets/backlog-icon.svg`                               | 2 KB                  | unused                  | rework | Keep if Backlog Manager joins as a project (open question), otherwise drop.                                              |
| `src/assets/github.png`                                     | 11 KB                 | unused                  | drop   | Not referenced. Becomes an SVG icon if needed.                                                                           |
| `src/assets/menu.svg`, `close.svg`                          | 1 KB                  | Burger menu             | drop   | Go away with the navbar.                                                                                                 |
| Google Fonts "Poppins" (external)                           | –                     | global                  | drop   | Loaded from `fonts.googleapis.com`, which sends visitors' IP addresses to Google. The new monospace font is self-hosted. |

## 5. Dependencies

Direct dependencies from `package.json`, installed versions according to `npm outdated` after `npm ci` (without `--all`, so no transitive packages). The CVE assessment follows in #22; major updates only after asking.

| Package                                                       | Version          | Rating | Reason                                                                                                            |
| ------------------------------------------------------------- | ---------------- | ------ | ----------------------------------------------------------------------------------------------------------------- |
| `react`, `react-dom`                                          | 18.3.1           | keep   | Foundation. The move to React 19 happens in #33 (current `@react-three/fiber` requires React 19, see note below). |
| `animated-backgrounds`                                        | 1.1.0            | drop   | Replaced by the Three.js scene.                                                                                   |
| `typewriter-effect`                                           | 2.22.0           | drop   | The terminal's typing effect is a few lines of own, testable code.                                                |
| `framer-motion`                                               | 11.18.2          | drop   | Not imported anywhere.                                                                                            |
| `react-router-dom`                                            | 6.30.1           | drop   | Only a `BrowserRouter` without routes. Deep links like `/projects` can be re-evaluated later.                     |
| `tailwindcss`, `postcss`, `autoprefixer`                      | 3.4 / 8.5 / 10.4 | keep   | Stay for the UI overlay.                                                                                          |
| `vite`, `@vitejs/plugin-react`, `typescript`                  | 7.1 / 4.7 / 5.9  | keep   | Stack decision: Vite.                                                                                             |
| `eslint` 8, `@typescript-eslint/*` 7, `eslint-plugin-react-*` | –                | rework | ESLint 8 is end of life. Moving to ESLint 9 with flat config is a major update (asked in #22).                    |
| `prettier`                                                    | 3.3.3            | keep   | No script so far. `format`/`format:check` come with #23/#25.                                                      |
| new: `three`, `@react-three/fiber`, `@react-three/drei`       | –                | new    | For #18, `npm audit` first.                                                                                       |
| new: `vitest`, `@testing-library/react`, `jsdom`              | –                | new    | For #24.                                                                                                          |

Note: `@react-three/fiber` v9 requires React 19, v8 runs on React 18. Moving to React 19 is a major decision and was asked in #22.

## 6. Build, tooling and CI

| Item                              | Finding                                                                                                                   | Rating                                 |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `npm run build`                   | green, JS 224 KB (71 KB gzip)                                                                                             | keep                                   |
| `npm run lint`                    | green                                                                                                                     | keep                                   |
| Tests                             | none                                                                                                                      | rework → Vitest and TDD (#24)          |
| `npm audit`                       | 19 findings (1 low, 3 moderate, 15 high)                                                                                  | rework → #22                           |
| `.github/workflows/portfolio.yml` | Deploys to GitHub Pages on every push to `master`, without lint or tests, on Node 20, with dead package-manager detection | rework → #25, #28                      |
| `CNAME`                           | `theocloud.dev`                                                                                                           | keep (deployment target agreed in #28) |
| `README.md`                       | only "Small Portfolio"                                                                                                    | rework                                 |
| `vite.config.ts`                  | template comment link                                                                                                     | rework (comment rule)                  |

## 7. Open questions for Theo

1. **Project selection:** Should more projects be added, such as Backlog Manager (its icon is already in the repo), and are there projects that should go?
2. **Project texts:** Will Theo write the short descriptions (1–2 sentences, stack, role), or should I draft them from the repositories' READMEs for Theo to approve?
3. **About/CV:** Should there be an `about` / `whoami` command with text about Theo (education, stack, interests)? If so, with which content?
4. **Contact:** Which channels should be visible (GitHub, e-mail, LinkedIn, …)?
5. **Language:** English (as before), German, or both with a `lang` command?
