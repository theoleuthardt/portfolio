# Deployment

The site is a static build (`dist/`) hosted on **GitHub Pages** under the custom domain **theocloud.dev**.

## Pipeline

1. A commit lands on `master` (only through a merged PR).
2. The **CI** workflow (`.github/workflows/ci.yml`) runs lint, typecheck, format check, tests, build and `npm audit`.
3. When CI finishes **successfully** for that push, the **Deploy** workflow (`.github/workflows/deploy.yml`) starts via `workflow_run`. Its `gate` job continues only if the verified commit is still the head of `master`, so a slower CI run of an older commit can never replace a newer deployment. The build then checks out exactly the commit CI verified (`workflow_run.head_sha`), builds it with the Node version from `.nvmrc`, uploads `dist/` as the Pages artifact and deploys it to the `github-pages` environment.
4. A failed or cancelled CI run never deploys.

Deployments are serialised (`concurrency: pages`) and never cancelled midway. There is deliberately no manual trigger, so nothing reaches the site without passing CI. To redeploy, re-run the latest **CI** run on `master` from the Actions tab; its success triggers **Deploy** again.

## Settings outside the repository

| Setting                    | Value                                                                                                                                                                                                                                                                                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pages source               | GitHub Actions (`build_type: workflow`)                                                                                                                                                                                                                                                                                                           |
| Custom domain              | `theocloud.dev`, configured in the repository's Pages settings; the `CNAME` file in the repo root documents it                                                                                                                                                                                                                                    |
| Environment `github-pages` | deployments allowed from `master` only                                                                                                                                                                                                                                                                                                            |
| DNS / TLS                  | Cloudflare proxies the domain and serves the visitor-facing certificate; `http://` is redirected to `https://` by Cloudflare. GitHub Pages currently has no certificate for `theocloud.dev` and "Enforce HTTPS" is off. The Cloudflare → GitHub Pages hop must not run over plain HTTP (Cloudflare SSL mode "Flexible"); see the open point below |

## Rollback

Revert the faulty commit through a PR. Once it is merged and CI is green, the previous state is deployed automatically.

## Open: origin TLS

The SSL mode Cloudflare uses towards GitHub Pages is not visible from the repository. Options:

- Switch the DNS record to "DNS only" so GitHub Pages issues its own certificate, then turn on "Enforce HTTPS" (and optionally proxy again with SSL mode "Full (strict)").
- Keep the proxy with SSL mode "Full".

Decision pending with Theo.
