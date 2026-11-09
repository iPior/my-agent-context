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
   product edits. Record existing failures separately. For a bug, demonstrate
   the reproduction against the base where feasible.
2. Implement the approved behavior with the smallest coherent change. In repair
   rounds, verify findings, fix supported defects, and explain disagreements with
   evidence. Do not blindly apply speculative review suggestions.
3. Run checks appropriate to the change: relevant tests, type checks, lint,
   builds, and runtime/UI checks as needed. Map evidence to acceptance IDs.
   Passing a build alone does not demonstrate behavioral completion.
4. Compare before and after using the same meaningful scenario where possible.
   Save commands, exit results, and relevant screenshots/logs under the assigned
   evidence directory. Explain checks that could not run.
5. Commit only intended task files on the assigned branch when verification is
   satisfactory. Do not push or open a PR. Report incomplete or blocked work
   honestly rather than presenting it as a reviewed candidate.
6. Save the assigned `build-NN.md` using the supplied template. Include full
   base/candidate SHAs, criterion evidence, findings addressed, unresolved issues,
   and skipped checks. Return its absolute path and candidate SHA.

Do not update `status.json`, approve your work, merge, or launch the next stage.
The coordinator owns transitions and decides whether to resume you.
