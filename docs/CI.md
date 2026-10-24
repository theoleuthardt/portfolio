# CI

## Workflows

| Workflow                   | File                              | Trigger                                    | What it does                                                 |
| -------------------------- | --------------------------------- | ------------------------------------------ | ------------------------------------------------------------ |
| CI                         | `.github/workflows/ci.yml`        | every pull request, every push to `master` | `npm ci`, lint, typecheck, format check, tests, build        |
| React Portfolio Deployment | `.github/workflows/portfolio.yml` | push to `master`, manual                   | builds and deploys `dist/` to GitHub Pages (reworked in #28) |

The CI job runs on the Node version from `.nvmrc`, with the npm cache keyed on `package-lock.json`. It has read-only repository permissions, does not keep the checkout credentials, and cancels an older run of the same branch when a new commit arrives.

## Merge gate

A PR is merged only when `gh pr view <n> --json mergeable` reports `MERGEABLE` and every check of `gh pr checks <n>` is green. A failing check is fixed at its cause; checks are never skipped or disabled.

## Reproduce locally

```bash
nvm use
npm ci
npm run lint && npm run typecheck && npm run format:check && npm test && npm run build
```

## Planned

- `npm audit --audit-level=high`, Dependency Review, secret scanning (#26)
- Dependabot for weekly update PRs (#27)
- Deployment only after green CI (#28)
