# Design concept: terminal + server rack

Status: proposal for #29, waiting for Theo's choice of variant (section 4).

## 1. Idea

theocloud.dev **is a machine you log into**. Visitors land in a terminal session on Theo's homelab; behind it, rendered in Three.js, stands the rack that runs it. Every project is a hardware module in that rack. Typing a command (or clicking a module) and the rack react to each other: `open trust-issues` slides that module out of the rack, the camera flies to it and its front panel turns into a small holographic screen with the project's story.

It has to work for three kinds of visitors:

- **Developers** type, tab-complete and find easter eggs.
- **Recruiters and non-developers** never type: clickable command chips and clickable modules do everything.
- **Screen reader and keyboard users** get the same content as plain, accessible text in the terminal log; the scene is decoration on top.

## 2. Look and feel

**Mood:** a dark server room at night. Near-black space, brushed gunmetal, phosphor-green terminal text, cyan HUD lines, status LEDs and fans. Calm and precise rather than flashy; motion only where it means something (boot, focus, activity).

### Colour tokens

| Token              | Value                       | Use                                      |
| ------------------ | --------------------------- | ---------------------------------------- |
| `--color-void`     | `#05070a`                   | page and scene background, fog           |
| `--color-panel`    | `#0b0f14` (at 85 % opacity) | terminal and HUD panels                  |
| `--color-metal`    | `#1b2027`                   | rack frame, module faces                 |
| `--color-line`     | `#24303b`                   | panel borders, grid                      |
| `--color-phosphor` | `#39ff88`                   | terminal text, prompt, "online" LEDs     |
| `--color-signal`   | `#3fd0ff`                   | HUD lines, links, focus rings, selection |
| `--color-amber`    | `#ffb020`                   | activity LEDs, warnings, the fork badge  |
| `--color-alert`    | `#ff4d5e`                   | errors, "command not found"              |
| `--color-muted`    | `#7d8b99`                   | secondary text, timestamps               |
| `--color-text`     | `#d7e1ea`                   | long-form text in project screens        |

Contrast: phosphor, signal, text and muted on `--color-panel` all reach WCAG AA for body text; amber and alert are used for short labels only.

### Typography

- **JetBrains Mono** (OFL, self-hosted, no Google Fonts) for everything: terminal, HUD labels, headings. Weights 400 / 700.
- Sizes: terminal 15 px desktop / 14 px mobile, line height 1.55; HUD labels 11 px uppercase with 0.12 em tracking; project screen headings 22 px.

### Effects

- **Scene:** bloom on emissive LEDs and the screen of the focused module, exponential fog in `--color-void`, one cool key light, rim light from behind the rack, slowly spinning fans, blinking activity LEDs (random, low frequency).
- **Overlay:** faint scanlines and a vignette on the terminal panel (CSS), a blinking block cursor, 1 px HUD frame corners.
- **Post-processing budget:** bloom + vignette only; no chromatic aberration or glitch loops (they hurt readability and motion-sensitive visitors).

## 3. Rack and content model

One rack, top to bottom:

| Unit | Module                   | Content                                                              |
| ---- | ------------------------ | -------------------------------------------------------------------- |
| 1U   | Patch panel `contact`    | GitHub, e-mail; ports light up on hover                              |
| 2U   | `backlog-manager`        | gaming backlog manager (React + Litestar, Flutter desktop client)    |
| 2U   | `trust-issues`           | 2D trap platformer for the browser (Phaser, Litestar, leaderboard)   |
| 2U   | `flashi`                 | self-hosted flashcard and quiz app with spaced repetition            |
| 1U   | `homelab-docker-compose` | the compose files of the homelab — the rack's own "config"           |
| 1U   | `claude-devcontainer`    | dev container setup for Claude Code                                  |
| 2U   | `opennutritracker`       | **fork** of OpenNutriTracker, amber "FORK" badge, credit to upstream |
| 1U   | `dinogame`               | C++ dino game; also the easter egg `play dino`                       |
| 2U   | `about` server (bottom)  | `whoami`: who Theo is, stack, what he is into                        |

Each project module shows a label strip and LEDs. When opened, its front panel becomes a screen with: name, one-paragraph summary (from the README), tech stack chips, links (repo, live site if any), and for the fork the upstream link. Texts come from the READMEs, in English, and live as typed data in `src/content/`.

## 4. Variants

All three share sections 2 and 3; they differ in how terminal and rack share the screen.

### A — Terminal first

The terminal fills most of the viewport (left 60 %); the rack is a calm backdrop on the right, slightly out of focus, and only turns and glows when a command targets a module.

- - lightest GPU load, strongest "real terminal" feel, simplest mobile story
- − the 3D work is mostly background; less "wow"

### B — Rack first

The rack is centre stage and fills the screen. The terminal lives **inside the scene** on a monitor on a cart next to the rack (rendered as HTML on a 3D plane). The camera moves between monitor and modules.

- - most immersive, strongest 3D showcase
- − text on a 3D plane is harder to read, to make accessible and to use on phones; highest effort

### C — Hybrid HUD (recommended)

Full-screen scene with the rack slightly right of centre and the camera at a three-quarter angle. The terminal is a crisp **2D HUD panel docked on the left**, visually tied to the scene by a thin cyan HUD line that connects the prompt to the active module. Opening a project slides the module out and shows its screen as a second HUD panel on the right.

- - 3D stays the hero, text stays real HTML (sharp, accessible, selectable)
- - works on mobile: terminal full-screen, rack as a small strip on top that still reacts
- − connecting line and two panels need careful layout at medium widths

**Recommendation: C.** It shows off the Three.js work without making the content depend on it.

![Mockup of variant C: terminal HUD on the left, rack with the trust-issues module slid out, project screen on the right](design/mockup-variant-c.png)

The mockup is a throwaway prototype (plain Three.js, procedural geometry, bloom) rendered in headless Chromium; it is not part of the code base.

## 5. Interaction

### Boot sequence (about 2.5 s, skippable with any key or click)

```
theocloud BIOS v2.6 — rack-01
POST ............................ ok
mounting /projects .............. 7 modules
starting services ............... ok
Welcome, guest. Type 'help' or click a module.
guest@theocloud:~$ _
```

Modules power on one after another while the lines appear (LEDs from amber to green, fans spin up). Returning visitors in the same session skip it.

### Commands

| Command            | Effect                                                                     |
| ------------------ | -------------------------------------------------------------------------- |
| `help`             | lists commands as clickable chips                                          |
| `ls` / `projects`  | lists projects with one-line summaries; each is clickable                  |
| `open <project>`   | camera flies to the module, it slides out, project screen opens            |
| `whoami` / `about` | about Theo; camera to the about server                                     |
| `contact`          | links; patch panel lights up                                               |
| `neofetch`         | ASCII logo plus stack overview                                             |
| `clear`, `history` | as expected                                                                |
| `close` / `Esc`    | module slides back, camera returns                                         |
| `play dino`        | easter egg: the dino game on the module screen                             |
| `sudo …`           | friendly refusal                                                           |
| unknown            | `command not found` in alert red plus the closest match ("did you mean …") |

Tab completes commands and project names; arrow keys walk the history; clicking a module runs the same `open` command, so the terminal log always tells the story.

### Camera

Idle: very slow orbit (a few degrees) with mouse parallax. Focus: 0.9 s eased flight to the module; one camera move at a time; `prefers-reduced-motion` replaces flights with cuts.

## 6. Responsive and fallbacks

| Situation                | Behaviour                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------- |
| ≥ 1024 px                | variant layout as described                                                        |
| 640–1023 px              | terminal bottom sheet (50 % height), rack above                                    |
| < 640 px                 | terminal full-screen; rack as a 120 px strip at the top, tapping a module opens it |
| `prefers-reduced-motion` | no boot animation, no orbit, cuts instead of flights, LEDs static                  |
| no WebGL / low-end GPU   | terminal only, plus a static SVG rack illustration; same commands and content      |
| JavaScript off           | `noscript` with the project list and links                                         |

## 7. Performance budget

- First paint without the 3D chunk: the terminal is usable after the main bundle (React + terminal, ≤ 110 KB gzip).
- The scene is a lazily loaded chunk (`three`, `@react-three/fiber`, `@react-three/drei`, post-processing; ≤ 260 KB gzip), loaded after the boot text starts.
- All geometry is procedural (boxes, instanced LEDs and screws); no GLTF downloads. Textures: one small tiling metal normal map at most.
- Device pixel ratio clamped to 1–1.75; `frameloop="demand"` while nothing animates; rendering pauses when the tab is hidden.
- Target: 60 fps on a mid-range laptop, ≥ 30 fps on a recent phone.

## 8. Implementation plan (issues under #18 and #19)

1. Content model: `src/content/` with the seven projects (README summaries, stack, links, fork flag), about and contact data — tests for completeness
2. Terminal core: parser, command registry, history, tab completion, "did you mean" — pure TypeScript, test-first
3. Terminal UI: HUD panel, output log (`aria-live`), input, command chips, boot sequence, reduced-motion handling
4. App shell: layout per breakpoint, shared state between terminal and scene, removal of the old Hero/Navbar/Projects and their dependencies
5. Scene foundation: lazy `Canvas`, lighting, fog, camera rig, WebGL detection and fallback
6. Rack and modules: procedural rack, modules with labels, LEDs and fans, hover and click
7. Focus interaction: module slide-out, camera flights, project screen panel, HUD connector line
8. Post-processing and polish: bloom, vignette, idle animation, performance tuning (`frameloop`, DPR, visibility)
9. Easter eggs: `neofetch`, `play dino`, `sudo`
10. Quality: performance and bundle budget check in CI, a11y pass (keyboard, screen reader, contrast), `index.html` meta / Open Graph, `noscript`
11. Design tokens in Tailwind `@theme` and self-hosted JetBrains Mono (#30)

The order and scope get confirmed once the variant is chosen; new dependencies are audited before they are added.

## 9. Later: Backlog Manager as its own racks

Noted by Theo for a later iteration (#61): the Backlog Manager monorepo becomes more than one module. Its **Monitor** service (Spring Boot, watches the Backlog Manager, Discord alerts, public status page; runs in its own LXC) gets a **separate rack**, and the other services of the monorepo (Litestar backend, web frontend, Flutter desktop app, Postgres, backups, Steam wishlist sync) appear as modules or rack units of their own. The scene then grows from one rack to a small row, which the camera rig and content model should not rule out.
