# Architecture

## Current state

A static single-page app built with Vite, React and TypeScript. `npm run build` produces `dist/`, which the Deploy workflow publishes to GitHub Pages after CI has passed on `master` (domain `theocloud.dev`, see [DEPLOYMENT.md](DEPLOYMENT.md)). There is no backend and no runtime API; all content ships in the bundle.

```
index.html → src/main.tsx (fonts, styles) → src/App.tsx → ui/Terminal
src/content/   projects as typed data (Project, findProject, RACK_UNITS),
               friends' sites (Friend, findFriend: `friends`, `open <site>`),
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
               monitor/ (the 3D terminal at the desk: seat, screen frame,
               homography and key layouts as pure functions, terminal
               geometry, CrtMonitor, wear texture)
               lab/ (lazy chunk: placement, cable curves and motion as pure
               functions, walls, overhead cabling, small life)
               look (drag/wheel look-around as pure functions)
               props/ (lazy chunk: placed models, monitors, background racks,
               neon sign, wall screens, signs, cables)
public/textures/ CC0 PBR maps, see ASSETS.md
public/models/   CC0 glTF props (meshopt), see ASSETS.md
public/favicon*  own neon `$_` cube icon (after the bash logo): SVG,
               32 px PNG fallback, 180 px apple-touch-icon
public/favicon*  own `>_` icon: SVG, 32 px PNG fallback, 180 px apple-touch-icon
src/index.css  design tokens (@theme), base styles, CRT components
```

On phones and touch tablets (touch below 1024 px) the CRT terminal is the whole page and the scene chunk is never requested. From 640 px the lazily loaded scene renders behind the terminal. `App` owns the shared state: the open project (reported by the terminal, shown as `ProjectPanel` on ≥ 1024 px and inside the terminal below; a click on a rack module runs `open <project>` through the terminal's `run` handle, so the log stays the single source of every change) and whether the scene has settled (the boot bar holds at "syncing lab" until the scene is ready, fails and shows the SVG fallback, or 8 s have passed; a finished boot never falls back). The terminal is a worn 4:3 CRT tube monitor (`CrtFrame`); on its screen the terminal runs as a window with the title `guest@theocloud: <cwd>`. Where the scene is shown, the window keys maximize it, fold it into a bar or hide it behind an `>_` button to free the view of the lab; the terminal stays mounted (its session survives), and a click on a rack module brings it back. Phones keep the full-screen terminal without window keys. On wide windows (≥ 1024 px), once the scene is ready, the visitor sits at a 3D model of an integrated 1980s terminal (screen unit, brand panel, keyboard deck) on a desk beside rack-01, with a lamp, a mug and a chair (`scene/monitor/`). The terminal stands still in the room; the seat (`SEAT`) is the camera rig's base, looking slightly down past the terminal at the rack. Every frame the scene projects the 3D screen's corners onto the page and `App` maps the HTML terminal onto that quad with a CSS `matrix3d` homography, drawn at about its on-screen size so the text stays crisp, selectable and accessible while it reads as a program on that computer. The camera rig runs first in every frame and the camera matrix is refreshed before projecting, so screen and housing never drift apart. The HTML screen only shows once the scene reports the visitor seated (`onSeatedChange`, at most 2.5 s), with a CRT power-on effect. Maximize leans in for a close look (straight in front of the screen), minimize/close stands the visitor up (higher and a step back) to look around; restoring sits them down. Opening a project keeps the visitor seated and turns the head a quarter of the way to the ejected module. Below 1024 px, while maximized there, without WebGL or with a failed scene the terminal keeps its 2D housing in front of the lab.

Looking around (`scene/look.ts`): dragging on the page background turns and tilts the view (further to the left, where the side wall is, than to the right), the wheel walks while standing; after 4 s without input the view eases back (instantly with reduced motion). Gestures that start on the terminal or the project panel never count, and a drag never clicks a rack module. The field of view widens on narrower windows (`fieldOfView`), so terminal and rack stay in view.

The lab build-out (`scene/lab/`, its own lazy chunk): cable trays from rack-01 to the back racks and to the switch wall with zip-tied, slightly messy cabling (`catenary`), patch cables on the rack, objects along the walls where the visitor can turn to see them (`LAB` placement, tested), and small life (a robot vacuum, a failing tube, dust in the light beams, a spotlight on the rack while a project is open). Light is green and everything else black; pink and purple accents are gone.

The old page is described in [content-audit.md](content-audit.md).

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
