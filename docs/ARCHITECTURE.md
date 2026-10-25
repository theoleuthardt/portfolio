# Architecture

## Current state

A static single-page app built with Vite, React and TypeScript. `npm run build` produces `dist/`, which the Deploy workflow publishes to GitHub Pages after CI has passed on `master` (domain `theocloud.dev`, see [DEPLOYMENT.md](DEPLOYMENT.md)). There is no backend and no runtime API; all content ships in the bundle.

```
index.html → src/main.tsx (fonts, styles) → src/App.tsx → ui/Terminal
src/content/   projects as typed data (Project, findProject, RACK_UNITS),
               friends' sites (Friend, findFriend: `friends`, `open <site>`),
               rack layout (rackSlots)
src/terminal/  pure logic, a small bash: shell (parser: quotes, $VARS,
               | ; && ||), commands (registry and executor), fileCommands
               (ls, cd, cat, tree, head, tail, wc, grep, sort), fs (virtual
               file system from the content), processes (process table, ps,
               kill, top screen), easterEggs (neofetch, sudo, rm, fortune,
               cowsay, play, hack, matrix, map), hack, dino, matrix, worldMap
               (projection, rasteriser, labels; program
               logic as pure functions of time), output (lines, actions), complete (Tab over
               the file system), history (incl. Ctrl+R search), suggest, expand
               (!!), boot, session (log and shell state), tabTitle
src/ui/        React: Terminal (input, keys, log), TerminalOutput (one line),
               ProjectScreen, CrtFrame, BootScreen, useBootSequence,
               usePrefersReducedMotion, useTabTitle, ProgramScreen with Top, Hack, Matrix, Dino and WorldMap (full-screen
               programs; WorldMap is a lazy chunk), SceneLayer (phone / no WebGL / 3D),
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
               bake/ (merging static meshes per material, Baked)
               props/ (lazy chunk: placed models, monitors, background racks,
               neon sign, wall screens, signs, cables)
public/textures/ CC0 PBR maps, see ASSETS.md
public/models/   CC0 glTF props (meshopt), see ASSETS.md
public/favicon*  own neon `$_` cube icon (after the bash logo): SVG,
               32 px PNG fallback, 180 px apple-touch-icon
public/favicon*  own `>_` icon: SVG, 32 px PNG fallback, 180 px apple-touch-icon
src/index.css  design tokens (@theme), base styles, CRT components
```

On phones and touch tablets (touch below 1024 px) the CRT terminal is the whole page and the scene chunk is never requested. From 640 px the lazily loaded scene renders behind the terminal. `App` owns the shared state: the open project (reported by the terminal, shown as `ProjectPanel` on ≥ 1024 px and inside the terminal below; a click on a rack module runs `open <project>` through the terminal's `run` handle, so the log stays the single source of every change) and whether the scene has settled (the boot bar holds at "syncing lab" until the scene is ready, fails and shows the SVG fallback, or 8 s have passed; a finished boot never falls back). The terminal is a worn 4:3 CRT tube monitor (`CrtFrame`); on its screen the terminal runs as a window with the title `guest@theocloud: <cwd>`. Minimizing or closing the terminal shows the TheoCloud OS desktop on the same screen (`ui/desktop/`): pixel icons (`desktop/icons.ts`), windows for projects, the world map, processes, notes, a file viewer, about and the trash, and a taskbar with a start menu, the open windows and a clock. The window manager is pure (`desktop/windows.ts`: open once per app and file, cascade, focus, minimize, maximize, move with the title bar kept on screen, Alt+Tab); below 400 px windows open maximized. The terminal stays mounted (its session survives); a minimized terminal waits in the taskbar, a closed one behind its icon, and a click on a rack module or the Projects app runs `open` through the terminal so the scene follows. Where the scene is shown, maximize is offered too, and the desktop's stand-up button hides the screen so the visitor can look around the lab; an `>_` button sits them down again. Phones get minimize and close (the desktop) but no maximize. On wide windows (≥ 1024 px), once the scene is ready, the visitor sits at a 3D model of an integrated 1980s terminal (screen unit, brand panel, keyboard deck) on a desk beside rack-01, with a lamp, a mug and a chair (`scene/monitor/`). The terminal stands still in the room; the seat (`SEAT`) is the camera rig's base, looking slightly down past the terminal at the rack. Every frame the scene projects the 3D screen's corners onto the page and `App` maps the HTML terminal onto that quad with a CSS `matrix3d` homography, drawn at about its on-screen size so the text stays crisp, selectable and accessible while it reads as a program on that computer. The camera rig runs first in every frame and the camera matrix is refreshed before projecting, so screen and housing never drift apart. The HTML screen only shows once the scene reports the visitor seated (`onSeatedChange`, at most 2.5 s), with a CRT power-on effect. Maximize leans in for a close look (straight in front of the screen), the desktop's stand-up button stands the visitor up (higher and a step back) to look around; `>_` sits them down. Opening a project keeps the visitor seated and turns the head a quarter of the way to the ejected module. Below 1024 px, while maximized there, without WebGL or with a failed scene the terminal keeps its 2D housing in front of the lab.

Looking around (`scene/look.ts`): dragging on the page background turns and tilts the view (further to the left, where the side wall is, than to the right), the wheel walks while standing; after 4 s without input the view eases back (instantly with reduced motion). Gestures that start on the terminal or the project panel never count, and a drag never clicks a rack module. The field of view widens on narrower windows (`fieldOfView`), so terminal and rack stay in view.

The lab build-out (`scene/lab/`, its own lazy chunk): cable trays from rack-01 to the back racks and to the switch wall with zip-tied, slightly messy cabling (`catenary`), patch cables on the rack, objects along the walls where the visitor can turn to see them (`LAB` placement, tested), and small life (a robot vacuum, a failing tube, dust in the light beams, a spotlight on the rack while a project is open). Light is green and everything else black; pink and purple accents are gone.

The terminal is a small bash (#102): a command line is parsed into pipelines (`|`) joined by `;`, `&&` and `||`, words keep quotes and expand `$VAR`, `${VAR}` and `$?` just before their command runs, and the executor threads the working directory, `OLDPWD`, the environment, `$?` and the killed processes from step to step. Commands are pure functions from arguments and an invocation (cwd, env, piped stdin, time, file system) to output lines, an exit status and an optional action; actions either change the shell (`cd`, env, kill) or go to the UI (`open`, `close`, `clear`, `visit`, `top`). Only a pipeline of one command may act, like bash's subshells. The file system is generated from the typed content (a home with dotfiles, one directory per project with README, stack and links, a small root). `top` replaces the log with a live view (refreshing every second, still with reduced motion) until q, Escape or Ctrl+C.

Easter eggs (#74): the file system hides a small scavenger hunt (`README.md` hints at `ls -a`, `~/.secret` points to `~/projects/dinogame/highscore.txt`, which points to the hidden `~/notes/.last-note`, which suggests `hack gibson`), `todo.txt` and notes. `neofetch`, `fortune`, `cowsay`, `sudo` and `rm` answer in the terminal; `matrix`, `play dino` and `hack <target>` run as full-screen programs like `top`, whose frames are pure functions of the elapsed time (tested with fake timers). `hack` takes about 21 s through scan, dump, crack, firewall, upload, glitch and ACCESS GRANTED, with an ending per target (hidden ones for `gibson`, `localhost`, `rack-01`, `coffee`), leaves its ending in the log, and aborts with Ctrl+C/q (`^C`, connection reset). While it runs, the terminal reports the program to `App` and the lab's red alarm beacons switch on (steady with reduced motion).

`map` (#104) opens an explorable world map in the style of MapSCII: Natural Earth outlines (`public/map/world.json`, fetched when the map opens) drawn as phosphor dots on a canvas, 2 × 4 per character cell like braille (real braille glyphs would fall back to another font), Web Mercator, coastlines solid and borders dotted, labels by zoom without overlaps, a blinking rack-01 marker in Night City, a MapSCII status line, and a spoken summary of the view for screen readers. Arrow keys/WASD pan, +/- zoom, dragging pans, the wheel zooms.

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
