# Architecture

## Current state

A static single-page app built with Vite, React and TypeScript. `npm run build` produces `dist/`, which the Deploy workflow publishes to GitHub Pages after CI has passed on `master` (domain `theocloud.dev`, see [DEPLOYMENT.md](DEPLOYMENT.md)). There is no backend and no runtime API; all content ships in the bundle.

```
index.html → src/main.tsx (fonts, styles) → src/App.tsx → ui/Terminal
src/content/   projects as typed data (Project, findProject, RACK_UNITS),
               rack layout (rackSlots)
src/terminal/  pure logic: parse, suggest (did you mean), complete (Tab),
               history, commands (registry, output lines, actions),
               boot (boot output), session (log, history, open project),
               tabTitle (browser tab title per boot phase and prompt)
src/ui/        React: Terminal (input, keys, log), TerminalOutput (one line),
               ProjectScreen, CrtFrame, BootScreen, useBootSequence,
               usePrefersReducedMotion, useTabTitle, SceneLayer (phone / no WebGL / 3D),
               RackFallback (SVG), SceneErrorBoundary, ProjectPanel, useViewport
src/scene/     device (phone viewport, WebGL check), cameraRig (pure math),
               Scene (lazy chunk: Canvas, reflections, light beams, camera rig),
               PostEffects (second lazy chunk: AO, bloom, grain, vignette),
               environment/ (room kit, PBR surfaces via usePbr, palette)
               rack/ (geometry and LED blinking as pure functions, Rack, RackModule,
               canvas label textures)
               props/ (lazy chunk: placed models, monitors, background racks,
               neon sign, wall screens, signs, cables)
public/textures/ CC0 PBR maps, see ASSETS.md
public/models/   CC0 glTF props (meshopt), see ASSETS.md
public/favicon*  own neon `$_` cube icon (after the bash logo): SVG,
               32 px PNG fallback, 180 px apple-touch-icon
public/favicon*  own `>_` icon: SVG, 32 px PNG fallback, 180 px apple-touch-icon
src/index.css  design tokens (@theme), base styles, CRT components
```

On phones and touch tablets (touch below 1024 px) the CRT terminal is the whole page and the scene chunk is never requested. From 640 px the lazily loaded scene renders behind the terminal. `App` owns the shared state: the open project (reported by the terminal, shown as `ProjectPanel` on ≥ 1024 px and inside the terminal below; a click on a rack module runs `open <project>` through the terminal's `run` handle, so the log stays the single source of every change) and whether the scene has settled (the boot bar holds at "syncing lab" until the scene is ready, fails and shows the SVG fallback, or 8 s have passed; a finished boot never falls back). The terminal is a worn 4:3 CRT tube monitor (`CrtFrame`); on its screen the terminal runs as a window with the title `guest@theocloud: <cwd>`. Where the scene is shown, the window keys maximize it, fold it into a bar or hide it behind an `>_` button to free the view of the lab; the terminal stays mounted (its session survives), and a click on a rack module brings it back. Phones keep the full-screen terminal without window keys. The old page is described in [content-audit.md](content-audit.md).

## Target picture

The website is an **interactive terminal** on top of a **Three.js scene with a hardware rack**. The terminal is the primary interface (type or click commands); the scene reacts to it (camera flight to a project's rack module, LEDs, glow). The exact design is defined in #29; this structure is the technical frame for it.

```
src/
├─ content/      content as typed data (projects, about, links), no React
├─ terminal/     pure logic: command parser, command registry, output format, history
├─ scene/        Three.js via @react-three/fiber: rack, modules, camera, effects
├─ ui/           2D overlay: terminal component, HUD elements, fallback view
├─ state/        state shared by terminal and scene (e.g. the focused project)
└─ App.tsx       composes canvas, overlay and fallback
```

### Principles

- **Logic without React and Three.js.** The command parser, commands and content are plain TypeScript modules with Vitest tests. Components only render.
- **Single source of truth.** Projects and texts are defined once in `content/`; terminal output and rack modules are derived from them.
- **The terminal leads, the scene follows.** A command changes the state in `state/`, the scene reads it. The site therefore works fully without the scene.
- **Progressive enhancement.** Without WebGL, or with `prefers-reduced-motion`, visitors get the terminal without a scene or with a calm one; the content is always reachable.
- **Lazy loading.** The 3D scene is loaded as a separate chunk; the terminal is usable immediately.

## Build, CI and deployment

| Step                                                                | Tool                              | Issue |
| ------------------------------------------------------------------- | --------------------------------- | ----- |
| Tests                                                               | Vitest + Testing Library          | #24   |
| Lint, typecheck, build and tests in CI                              | GitHub Actions                    | #25   |
| Security checks (`npm audit --audit-level=high`, Dependency Review) | GitHub Actions                    | #26   |
| Update PRs                                                          | Dependabot, weekly                | #27   |
| Deployment                                                          | GitHub Pages, only after green CI | #28   |

## Decisions

| Date       | Decision                                                                                                  | Reason                                                                                                                                                                                  |
| ---------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-10-24 | Stay on Vite, no move to Next.js                                                                          | Static site on GitHub Pages, no SSR needed                                                                                                                                              |
| 2026-10-24 | Three.js via `@react-three/fiber` and `@react-three/drei`                                                 | Declarative scene inside the React tree, state shared with the terminal                                                                                                                 |
| 2026-10-24 | Remove `react-router-dom`                                                                                 | It was unused; navigation happens through the terminal                                                                                                                                  |
| 2026-10-24 | Deployment stays on GitHub Pages for now                                                                  | Existing domain and workflow, no cost                                                                                                                                                   |
| 2026-10-24 | React 19 before the Three.js rebuild (#33)                                                                | `@react-three/fiber` v9 requires React 19                                                                                                                                               |
| 2026-10-24 | Vite 8 and `@vitejs/plugin-react` 6, TypeScript 6.0 instead of 7 (#34)                                    | TypeScript 7 is the native Go compiler without a JavaScript API; `typescript-eslint` supports only `<6.1`. Dependabot ignores TypeScript 7 until then                                   |
| 2026-10-24 | Tailwind CSS 4 with `@tailwindcss/vite`, no PostCSS config, theme in `@theme` (#59)                       | Moved forward to clear all Dependabot updates; removes the `postcss-selector-parser` override from #22. Raises the browser floor to Tailwind 4's (Chrome 111, Safari 16.4, Firefox 128) |
| 2026-10-24 | Design: Night City lab with CRT terminal and server rack, layout variant C, terminal only on phones (#29) | See [design-concept.md](design-concept.md); keeps content in accessible HTML and the 3D scene optional                                                                                  |
