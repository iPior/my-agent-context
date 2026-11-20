---
name: factory-ship
description: Publish an independently reviewed factory candidate as a pull request, monitor its checks, and save a shipping handoff. Use only when dispatched for a factory run with a passing review or explicitly requested to ship that reviewed candidate.
---

# Factory Ship

Read the approved task, contract, status, latest build/review handoffs, project
instructions, and existing PR. Confirm a clean assigned worktree, a passing
review, and exact equality between actual HEAD, candidate SHA, and reviewed SHA.
Recheck the approved task digest. Never ship a newer unreviewed commit.

## Prepare delivery

1. Verify the intended remote repository, target branch, and branch ownership.
   Honor recorded PR-publication authorization. If absent, prepare a local PR
   title/body and ask the coordinator to obtain authorization before pushing or
   publishing. Plan approval alone does not authorize publication.
2. Push the reviewed branch using a normal non-forced push. For unexpected
   remote commits or conflicts, return evidence to the coordinator. Do not reset,
   rebase, merge, or repair code here.
3. Create a concise PR, or update the existing task PR, as a draft when the
   authorization says so. Explain the concrete behavior change and relevant
   validation. Include material verification limits and accepted nonblocking
   findings without publishing private logs, absolute local paths, secrets, or
   internal context. Follow the dispatch's standing rules for the title and
   body over any attribution default your harness injects. Use the project's
   PR template when present. If `gh pr edit --body-file` fails (for example
   with a GraphQL error about the deprecated Projects (classic) feature),
   update the body through the REST API instead, such as
   `gh api -X PATCH repos/<owner>/<repo>/pulls/<n> -F body=@<file>`, then
   re-read the PR body to confirm it changed.
4. Read actual checks for the current PR head. Checks can take a moment to
   register after a push, so wait until they appear before watching; an empty
   list right after publishing is not "no CI". Confirm each check ran against
   the published head SHA. If a convenience command or flag is missing in the
   installed CLI, read the same data from the run or check-run API instead.
   Green means required checks have passed. When the repository configures no
   required checks, every check that ran must have passed, and the handoff says
   that none is enforced. Pending/missing/unreadable checks remain waiting or
   blocked. If there is no CI configured, report it; never invent a pass.
   Once the checks have registered on the published head, return; do not
   wait for them to finish unless the dispatch says so. The coordinator
   watches them.
5. Save the assigned `ship-NN.md` with PR URL and draft state, base and full
   head SHA, preconditions checked, check states/links, workflow friction, and
   a verdict: `ready_for_human` (only if every check had already finished and
   passed), `waiting_ci`, `code_failure`, or `blocked`.

For a code failure, preserve failing-check evidence and return to the coordinator.
The builder repairs it, a fresh reviewer evaluates the new commit, and shipping
updates the same PR. Do not bypass review for a small CI repair. For infrastructure
or authentication failures, report the dependency rather than making speculative
code fixes. Retry transient checks only within a recorded bounded decision.

Do not update status, enable auto-merge, merge, deploy, delete branches, or remove
worktrees. The user merges. Keep the run's records for reconciliation and resume.
