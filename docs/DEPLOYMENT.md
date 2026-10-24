# Deployment

The site is a static build (`dist/`) hosted on **GitHub Pages** under the custom domain **theocloud.dev**.

## Pipeline

1. A commit lands on `master` (only through a merged PR).
2. The **CI** workflow (`.github/workflows/ci.yml`) runs lint, typecheck, format check, tests, build and `npm audit`.
3. When CI finishes **successfully** for that push, the **Deploy** workflow (`.github/workflows/deploy.yml`) starts via `workflow_run`. It checks out exactly the commit CI verified (`workflow_run.head_sha`), builds it with the Node version from `.nvmrc`, uploads `dist/` as the Pages artifact and deploys it to the `github-pages` environment.
4. A failed or cancelled CI run never deploys.

Deployments are serialised (`concurrency: pages`) and never cancelled midway. `workflow_dispatch` allows a manual redeploy of the current `master` from the Actions tab.

## Settings outside the repository

| Setting                    | Value                                                                                                                                                                            |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pages source               | GitHub Actions (`build_type: workflow`)                                                                                                                                          |
| Custom domain              | `theocloud.dev`, configured in the repository's Pages settings; the `CNAME` file in the repo root documents it                                                                   |
| Environment `github-pages` | deployments allowed from `master` only                                                                                                                                           |
| DNS / TLS                  | Cloudflare proxies the domain and terminates TLS, so GitHub Pages itself shows no certificate and "Enforce HTTPS" stays off; `http://` is redirected to `https://` by Cloudflare |

## Rollback

Revert the faulty commit through a PR. Once it is merged and CI is green, the previous state is deployed automatically. For an urgent rollback, run **Deploy** manually after the revert PR is merged.
