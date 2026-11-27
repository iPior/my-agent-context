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
   Record existing failures separately. Do not edit the worktree while a
   baseline or final check runs; read code meanwhile. For a bug, demonstrate the reproduction
   against the base where feasible.
2. Implement the approved behavior with the smallest coherent change. In repair
   rounds, follow the dispatch's disposition for each finding ID and read the
   finding itself in the review handoff; it applies in full unless the dispatch
   excludes part. Reproduce each finding before fixing it, preferably with a
   failing test run against the unchanged source, one finding per test so a log
   does not stop at the first, and save that failing run as evidence. Take it
   from the final text of each test: if you change a test after its failing
   run, run it against the unchanged source again, and count in the handoff
   only the tests that failed in the saved run. To run
   a test against an earlier candidate, use the status helper's `snapshot`
   command with `--label <your handoff name>` (see "Earlier candidates" in the
   run contract). Fix supported defects and explain disagreements with
   evidence. Do not blindly apply speculative review suggestions.
   Fix the finding's family, not only the reported case: when the dispatch
   names a case family, or the finding is about state, focus or timing, list
   the sibling cases (other row or control types on the same path, missing or
   also-changed neighbours, focus elsewhere, repeated or late updates), test
   each, and say in the handoff which siblings you covered.
   The dispatch's required outcome is binding; an implementation it suggests is
   not. If the suggestion cannot reach the outcome, take a route that does and
   report the deviation with the reason. For a repair of a finding that an
   earlier attempt did not fully fix, name what is materially different about
   your approach.
3. Run checks appropriate to the change: relevant tests, type checks, lint,
   builds, and runtime/UI checks as needed. Iterate with targeted tests and
   run the full suite once, on the final committed candidate (step 5). Start
   long checks in the background where the harness allows. Map evidence to acceptance IDs.
   Passing a build alone does not demonstrate behavioral completion.
   For browser-facing changes, write the planned end-to-end test as a committed
   test when the plan calls for one, run it in a real browser against the
   running application, and save screenshots or traces per criterion. A
   simulated-DOM test is not that check. The reviewer re-runs it and explores
   separately, so say how to start the application and run the test. Keep
   reproductions you script outside the committed tests in the run's
   `explore/` directory, listed in its README, so later rounds can rerun them.
   A new committed end-to-end scenario must not depend on or leave behind data
   that other scenarios see: use names unique to the scenario or the
   project's isolation mechanism, and run it in the full suite, not only alone. Start
   servers outside the committed test runner with the workflow's server
   helper (see the run contract) and stop them before returning.
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
6. Save the assigned `build-NN.md` using the supplied template. State only
   what you measured, each with its command or evidence path; write "not
   measured" rather than inferring. Include full
   base/candidate SHAs, criterion evidence, decisions the plan did not make,
   deviations from the dispatch,
   findings addressed, unresolved issues, skipped checks, and workflow
   friction. Return its absolute path and candidate SHA.

Do not update `status.json`, approve your work, merge, or launch the next stage.
The coordinator owns transitions and decides whether to resume you.
