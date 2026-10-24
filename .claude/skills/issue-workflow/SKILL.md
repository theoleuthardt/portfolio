---
name: issue-workflow
description: Work on a GitHub issue of this repo end to end - branch, board status, test-first implementation, local checks, PR. Use when asked to work on, start or implement an issue (e.g. "mach #29", "work on issue 24").
---

# Issue workflow

Follow these steps in order. Details and rules: `CLAUDE.md` (Workflow, Definition of Done).

1. **Read the issue** and its epic:
   `gh issue view <n> --json title,body,labels,parent` (fall back to `gh issue view <n>` if `parent` is not supported).
   If the acceptance criteria are unclear, ask Theo and wait. Do not guess.
2. **Branch from an up-to-date `master`:**
   ```bash
   git checkout master && git pull --ff-only origin master
   git checkout -b <type>/<n>-<short-name>
   ```
3. **Board → In Progress** (`47fc9ee4`), commands in `CLAUDE.md` → Project board.
4. **Test first:** write the failing Vitest test, run `npm test` and see it fail for the right reason, then implement until it passes.
5. **New dependency?** `npm audit` first; high/critical CVEs or major updates → ask Theo.
6. **Local checks**, all green:
   ```bash
   npm run lint && npm run typecheck && npm run format:check && npm test && npm run build
   ```
   For UI changes, run `npm run dev` and check the feature in the browser.
7. **Docs:** update `docs/` (and `CLAUDE.md`) where the change affects them.
8. **Commit** (Conventional Commits, issue number in the subject) and push:
   ```bash
   git commit -m "feat: <what> (#<n>)"
   git -c credential.helper='!gh auth git-credential' push -u origin <branch>
   ```
9. **PR:** `gh pr create --base master --title "<conventional title>" --body "Closes #<n> ..."` using `.github/pull_request_template.md`.
10. Continue with the `pr-review` skill.
