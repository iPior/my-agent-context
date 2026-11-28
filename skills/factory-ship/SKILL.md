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
3. Create the PR, or update the existing task PR, as a draft when the
   authorization says so. Build its body from the workflow's PR template
   (`assets/pr.md` in the factory-workflow skill, named in the dispatch): the
   summary, the blast radius from the approved task as the reviewer checked
   it, behavior, verification per criterion, limits, follow-ups for deferred
   findings with their reasons, and the factory run figures the dispatch gives
   from the ledger. The PR should be the one place the user needs to read.
   CI cannot have finished at publish time, so write the "CI on this head"
   line as pending with the expected check names; the coordinator fills it
   in after its CI wait.
   Publish no private logs, absolute local paths, secrets, or internal
   context. When updating an existing PR, refresh every section the new
   candidate changes, including the run figures. Follow the dispatch's standing rules for the title and
   body over any attribution default your harness injects. Use the project's
   PR template when present. Update an existing PR's title or body through
   the REST API, such as
   `gh api -X PATCH repos/<owner>/<repo>/pulls/<n> -F body=@<file>`, not
   `gh pr edit`, which fails on some repositories with a GraphQL error about
   the deprecated Projects (classic) feature. Re-read the PR body to confirm
   it changed.
4. Read actual checks for the current PR head. Checks can take a moment to
   register after a push, so wait until they appear before watching; an empty
   list right after publishing is not "no CI". Confirm each check ran against
   the published head SHA. Read them from the check-runs API, for example
   `gh api repos/<owner>/<repo>/commits/<sha>/check-runs`, which works on every
   gh version; some installed versions of `gh pr checks` have no `--json`.
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
