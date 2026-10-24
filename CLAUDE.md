# CLAUDE.md

Guidance for Claude Code (and every other contributor) working in this repository.

## Project

Theo Leuthardt's personal developer portfolio, served at <https://theocloud.dev> via GitHub Pages. It is being rebuilt from a classic scroll page into an interactive **terminal/HUD website combined with a Three.js hardware-rack scene**: visitors type (or click) commands like `help`, `projects`, `about`, while the 3D rack shows the projects as server modules. The plan lives in the GitHub Project [Portfolio 3D](https://github.com/users/theoleuthardt/projects/4).

## Stack

- **Vite + React + TypeScript** (single-page app, static build in `dist/`)
- **Three.js** via `@react-three/fiber` and `@react-three/drei` (from epic #18)
- **Tailwind CSS** for the 2D overlay (moving to Tailwind 4 with design tokens in #30)
- **Vitest** + Testing Library (jsdom) for tests; Node version pinned in `.nvmrc` (22)
- **ESLint 10** (flat config in `eslint.config.js`, typescript-eslint, React Hooks and React Refresh rules) + **Prettier**
- **GitHub Actions** for CI ([`docs/CI.md`](docs/CI.md)) and the GitHub Pages deployment after green CI ([`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md))

Default branch: `master`.

## Commands

```bash
npm ci                 # install exactly what package-lock.json pins
npm run dev            # Vite dev server
npm run build          # typecheck (tsc -b) + production build into dist/
npm run preview        # serve the production build locally
npm run lint           # ESLint, zero warnings allowed
npm run typecheck      # TypeScript only
npm run format         # Prettier, write
npm run format:check   # Prettier, verify only
npm test               # Vitest, single run
npm run test:watch     # Vitest in watch mode
npm audit              # known vulnerabilities in the locked dependencies
```

## Documentation lives in `docs/`

Everything that matters beyond a single file is documented as Markdown in [`docs/`](docs/README.md): architecture, design concept, audits, deployment, decisions. When a change touches architecture, workflow, dependencies policy or deployment, update the matching document **in the same PR**. New topics get a new file in `docs/` and a line in `docs/README.md`. This file only summarises and links. **All documentation is written in English**, as are code, identifiers, TSDoc and commit messages.

## Clean Code

Every change is held to these rules; reviews treat violations as real findings:

- **Meaningful names.** Components, functions and variables say what they are; no abbreviations, no `data2`, no `handleStuff`.
- **Small units with one job.** A component renders one thing, a function does one thing. Extract when a unit does two things, not before.
- **No duplication.** The same logic in two places is a bug waiting to happen; the desktop and mobile variants of something share their logic.
- **No premature abstraction.** Three similar lines beat a helper built for hypothetical callers. A one-off needs no utility.
- **No dead code.** Unused files, exports, assets, dependencies and commented-out code are deleted, not kept "in case". Git history is the archive.
- **Pure logic outside components.** Command parsing, data shaping and anything else that is not rendering lives in plain TypeScript modules with unit tests.
- **Validate at the boundaries, trust the internals.** User input (terminal commands) is validated where it enters; internal calls are not re-checked defensively.
- **Strict types.** No `any`, no non-null assertions to silence the compiler, no `@ts-ignore` / `eslint-disable` to get past a check.

## Code comments

**No narrative comments.** Only real code documentation is allowed:

- TSDoc (`/** ... */`) on exported components, functions, types, constants and modules.
- Nothing else: no `// now we do X`, no `// fallback because Y`, no step-by-step comments in function bodies, no commented-out code, no template leftovers like `// https://vitejs.dev/config/`.

If a reason is worth keeping, it goes into the TSDoc of the enclosing function or into `docs/`. This also applies to config files (YAML, JSON): keep them free of narrative comments.

## Test-driven development

1. Write the failing Vitest test that expresses the desired behaviour.
2. Write the simplest implementation that makes it pass.
3. Refactor with the test green.

A test that correctly expresses the desired behaviour is a contract: never weaken or delete it to get a run green. If it fails, assume the code is wrong. Change a test only when the desired behaviour itself changes, and say so in the PR.

What gets tested: pure logic (command parser, project data, formatting) always; components where they have behaviour (keyboard input, focus, fallbacks). The 3D scene itself is verified by running the app.

Tests live next to the code they test (`Foo.tsx` → `Foo.test.tsx`, `index.ts` → `index.test.ts`). Vitest runs in jsdom with Testing Library; `src/test/setup.ts` registers the jest-dom matchers and cleans up after each test. Query by role and accessible name (`getByRole("link", { name: ... })`), not by class or test id.

## Dependencies

- Run `npm audit` before adding a package. Do not add packages with known high/critical CVEs without asking Theo.
- Major updates and breaking changes are never applied automatically: list them with a risk assessment and ask first.
- Always commit `package-lock.json` together with `package.json`.

## Workflow

Every change goes through an issue and a PR, no matter how small.

1. **Issue first.** Every task is an issue in the Portfolio 3D project, labelled, as a sub-issue of its epic.
2. **Branch per issue** from `master`: `<type>/<issue-number>-<short-name>`, e.g. `feat/29-terminal-parser`, `fix/22-dependency-cves`, `docs/20-content-audit`.
3. **Move the card** to _In Progress_ (commands below).
4. **Implement test-first**, then run locally: `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm test`, `npm run build`.
5. **Commit** with [Conventional Commits](https://www.conventionalcommits.org/) referencing the issue: `feat: terminal command parser (#29)`.
6. **Push and open a PR** with `Closes #<n>` and a clear description (template in `.github/pull_request_template.md`).
7. **Review** with the local review script (see the `pr-review` skill): `git fetch origin master && review origin/master`. It uses CodeRabbit and falls back to GLM via Ollama when CodeRabbit is unavailable. Verify every finding against the code, fix it or reject it with a reason in a PR comment, then review again.
8. **Merge** (squash) only when `gh pr view <n> --json mergeable` is `MERGEABLE` and `gh pr checks <n>` is green.
9. **Clean up**: delete the branch, move the card to _Done_, summarise the issue in 2-3 sentences.

Rules: no force pushes, no direct commits to `master`, never disable or skip a failing check (fix the cause), ask when something is unclear or destructive. The content audit (#20) is closed only by Theo.

### Project board

Project "Portfolio 3D" (#4, id `PVT_kwHOA5wDoM4BohQI`), Status field `PVTSSF_lAHOA5wDoM4BohQIzhnA_4U`: Todo `f75ad846`, In Progress `47fc9ee4`, Done `98236657`.

```bash
item_id=$(gh project item-list 4 --owner theoleuthardt --limit 500 --format json \
  | jq -r '.items[] | select(.content.number == <issue-number>) | .id')
gh project item-edit --project-id PVT_kwHOA5wDoM4BohQI --id "$item_id" \
  --field-id PVTSSF_lAHOA5wDoM4BohQIzhnA_4U --single-select-option-id <option-id>
```

New issues: `gh issue create`, then `gh project item-add 4 --owner theoleuthardt --url <issue-url>`, set the status to Todo and attach it to its epic with `gh api -X POST repos/theoleuthardt/portfolio/issues/<epic>/sub_issues -F sub_issue_id=<issue id, not number>`.

## Definition of Done

An issue is done when all of these hold:

- [ ] Acceptance criteria of the issue are met
- [ ] Tests written first and passing; no test weakened
- [ ] `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm test`, `npm run build` pass locally
- [ ] `npm audit --audit-level=high` reports nothing new
- [ ] Clean Code and comment rules respected
- [ ] UI changes checked in the running app (`npm run dev`), including mobile width and `prefers-reduced-motion`
- [ ] `docs/` and this file updated where the change affects them
- [ ] PR reviewed (CodeRabbit / GLM), findings fixed or rejected with a reason
- [ ] PR mergeable and CI green, squash-merged, branch deleted, card on _Done_
