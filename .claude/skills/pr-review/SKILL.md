---
name: pr-review
description: Review an open PR of this repo with the local review script (CodeRabbit, GLM fallback), handle the findings, and merge when allowed. Use after opening a PR or when asked to review or merge one.
---

# PR review

1. **Run the review** on the PR branch against the default branch:
   ```bash
   git fetch origin master
   review origin/master
   ```
   `review` (`/usr/local/bin/review`) runs CodeRabbit and falls back to GLM via Ollama only when CodeRabbit is unavailable or fails. The first output line names the source. If the script is missing, ask Theo.
2. **Verify every finding against the code.** The GLM fallback only sees the diff, so treat it as a second opinion.
   - Valid: fix it in a new commit (never amend pushed commits, never force-push).
   - Invalid: reject it with a short reason.
     Post a PR comment listing each finding and what was done with it.
3. **Review again** after fixes until no valid findings remain.
4. **Merge gate**, both must hold:
   ```bash
   gh pr view <n> --json mergeable,mergeStateStatus   # MERGEABLE
   gh pr checks <n>                                   # all green
   ```
   Until the PR CI from #25 exists there are no checks; then a mergeable, reviewed PR may be merged. A red check is fixed at its cause, never skipped or disabled. PR #31 / issue #20 is closed only by Theo.
5. **Merge and clean up:**
   ```bash
   gh pr merge <n> --squash --delete-branch
   git checkout master && git pull --ff-only origin master
   ```
   Board → Done (`98236657`), then summarise the issue in 2-3 sentences.
