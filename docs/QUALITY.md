# Quality

How the portfolio is held to its performance and accessibility goals, and the latest measurements (#75).

## Bundle budget

`npm run budget` (after `npm run build`, also run in CI) checks every loading step of [design-concept.md](design-concept.md) section 7 against its limit. A step costs its chunk plus every chunk it imports statically that no earlier step has loaded yet, following Vite's build manifest (`dist/.vite/manifest.json`); sizes are gzip in kB (1000 bytes), as Vite reports them.

| Step            | Starts with                 | Limit   | 2026-10-25 |
| --------------- | --------------------------- | ------- | ---------- |
| main            | `index.html`                | 110 kB  | 93.0 kB    |
| scene           | `src/scene/Scene.tsx`       | 280 kB  | 279.8 kB   |
| post-processing | `src/scene/PostEffects.tsx` | 120 kB  | 104.4 kB   |
| props           | `src/scene/props/Props.tsx` | 40 kB   | 24.7 kB    |
| lab             | `src/scene/lab/Lab.tsx`     | 20 kB   | 9.3 kB     |
| assets          | `public/models`, `textures` | 3000 kB | 2519.8 kB  |

The scene path is at its limit; #73 makes room before it grows again.

## Accessibility

- **Automated:** `src/a11y.test.tsx` runs axe-core on the rendered app at 390 px and 1440 px (after `help`, `ls -la` and `open flashi`) and while `top` runs; it must report no violations. Colour contrast needs a real layout engine, so it is checked in the browser instead.
- **In the browser:** axe-core injected into Chromium, including colour contrast, on the phone layout, the wide layout without WebGL and the wide layout with the 3D lab and an open project: no violations (the missing `<h1>` it found is now a visually hidden heading).
- **Keyboard only:** the prompt has focus after the boot; Tab completes first and then moves on (input, project panel links, the log's chips and back), Shift+Tab leaves the terminal, Escape closes an open project, the window keys and the restore buttons are reachable, every focusable element shows the phosphor focus ring, and programs like `top` quit with q, Escape or Ctrl+C.
- **Screen readers:** the terminal output is a polite live log, the boot logo is an image named "TheoCloud OS", the progress bar is a `progressbar` with its value, programs are named regions, and the 3D scene is `aria-hidden` (everything it shows is reachable in the terminal and the panel).
- **Without JavaScript:** a `noscript` block, generated at build time from the typed content, lists the projects and friends' sites as plain links.

## Lighthouse

Lighthouse 12 against `npm run preview`, in the sandbox's headless Chromium with software rendering (SwiftShader), on 2026-10-25:

| Form factor | Performance | Accessibility | Best practices | SEO | FCP   | LCP   | TBT       | CLS   |
| ----------- | ----------- | ------------- | -------------- | --- | ----- | ----- | --------- | ----- |
| Mobile      | 100         | 100           | 100            | 100 | 1.5 s | 1.5 s | 20 ms     | 0.004 |
| Desktop     | 60          | 100           | 100            | 100 | 0.5 s | 0.7 s | 13,400 ms | 0.018 |

Phones load no scene, so the mobile run measures the terminal alone. The desktop performance score is dominated by Total Blocking Time from compiling the lab's shaders in the software renderer (30-90 s in this environment); on a real GPU this takes a fraction of a second. Runtime frame rate is tracked in #73.

To repeat a run: `npm run build && npm run preview`, then `npx lighthouse http://localhost:4173/ --preset=desktop` (and without `--preset` for mobile).
