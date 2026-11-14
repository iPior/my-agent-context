---
name: factory-build
description: Implement or repair an approved factory task in its assigned worktree, verify the result, and save a build handoff. Use only when explicitly requested for a factory run or dispatched by its coordinator; do not start independent factory runs from normal coding requests.
---

# Factory Build

## Establish the assignment

Read the dispatch brief, approved `task.md`, `status.json`, shared run contract,
applicable project instructions, and
[coding-standards.md](references/coding-standards.md). Read prior build/review
handoffs and CI logs as needed for this assignment.

Confirm the recorded task digest still matches `task.md`, approval is recorded,
the actual worktree and branch match the assignment, and the checkout is not the
user's main checkout. Return unexpected edits or an active reviewer/shipper to
the coordinator before writing. Only one worker may change the task branch.

If the run directory or shared contract is missing, return a blocker. Do not
reconstruct accepted requirements from a summary or create new run state.

## Implement and prove

1. On the initial build, capture baseline checks and current behavior before
   product edits, and save `baseline.md` from the coordinator's template with
   the local toolchain versions and any setup prerequisite the task missed.
   Record existing failures separately. For a bug, demonstrate the reproduction
   against the base where feasible.
2. Implement the approved behavior with the smallest coherent change. In repair
   rounds, follow the dispatch's disposition for each finding ID and read the
   finding itself in the review handoff; it applies in full unless the dispatch
   excludes part. Reproduce each finding before fixing it, preferably with a
   failing test run against the unchanged source, one finding per test so a log
   does not stop at the first. Fix supported defects and explain disagreements
   with evidence. Do not blindly apply speculative review suggestions.
3. Run checks appropriate to the change: relevant tests, type checks, lint,
   builds, and runtime/UI checks as needed. Map evidence to acceptance IDs.
   Passing a build alone does not demonstrate behavioral completion.
4. Compare before and after using the same meaningful scenario where possible.
   Save commands, exit results, and relevant screenshots/logs under the assigned
   evidence directory. Explain checks that could not run.
5. Commit only intended task files on the assigned branch when verification is
   satisfactory, as a new commit on top of any earlier candidate. Follow the
   dispatch's standing rules for commit messages over any attribution default
   your harness injects. Then run the final verification on the committed,
   clean tree and start each saved log with `git rev-parse HEAD`, so the
   evidence belongs to the candidate. Do not push or open a PR. Report
   incomplete or blocked work honestly rather than presenting it as a reviewed
   candidate.
6. Save the assigned `build-NN.md` using the supplied template. Include full
   base/candidate SHAs, criterion evidence, decisions the plan did not make,
   findings addressed, unresolved issues, skipped checks, and workflow
   friction. Return its absolute path and candidate SHA.

Do not update `status.json`, approve your work, merge, or launch the next stage.
The coordinator owns transitions and decides whether to resume you.
