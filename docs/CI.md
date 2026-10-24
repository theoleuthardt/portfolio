# CI

## Workflows

| Workflow                   | File                                      | Trigger                                    | What it does                                                                                                        |
| -------------------------- | ----------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| CI                         | `.github/workflows/ci.yml`                | every pull request, every push to `master` | `npm ci`, lint, typecheck, format check, tests, build                                                               |
| CI → npm audit             | `.github/workflows/ci.yml` (job `audit`)  | every pull request, every push to `master` | `npm audit --audit-level=high`: fails on high or critical findings                                                  |
| Dependency Review          | `.github/workflows/dependency-review.yml` | every pull request                         | fails when the PR adds a dependency with a known high or critical vulnerability; posts a summary comment on failure |
| React Portfolio Deployment | `.github/workflows/portfolio.yml`         | push to `master`, manual                   | builds and deploys `dist/` to GitHub Pages (reworked in #28)                                                        |

The CI job runs on the Node version from `.nvmrc`, with the npm cache keyed on `package-lock.json`. It has read-only repository permissions, does not keep the checkout credentials, and cancels an older run of the same pull request when a new commit arrives; runs on `master` are never cancelled, so every commit there is verified.

## Repository security settings

Secret scanning and push protection are enabled: GitHub scans the repository for leaked credentials and rejects pushes that contain a recognised secret.

## Dependabot

`.github/dependabot.yml` checks npm packages and GitHub Actions every Monday at 06:00 (Europe/Berlin). Minor and patch updates arrive as one grouped PR per ecosystem; every major update gets its own PR. All Dependabot PRs carry the `dependencies` label and go through the same CI, review and merge gate. Major updates are merged only after Theo has agreed (see `CLAUDE.md` → Dependencies).

## Merge gate

A PR is merged only when `gh pr view <n> --json mergeable` reports `MERGEABLE` and every check of `gh pr checks <n>` is green. A failing check is fixed at its cause; checks are never skipped or disabled.

## Reproduce locally

```bash
nvm use
npm ci
npm run lint && npm run typecheck && npm run format:check && npm test && npm run build
npm audit --audit-level=high
```

## Planned

- Deployment only after green CI (#28)
