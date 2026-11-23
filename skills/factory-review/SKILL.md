---
name: factory-review
description: Independently review a pinned factory candidate against its approved requirements and verification evidence. Use only when dispatched as a fresh reviewer for a factory run or explicitly asked to perform that review.
---

# Factory Review

Start in an independent context without the builder's conversation history.
Receive the original approved task, shared contract, base/candidate SHAs,
worktree path, build handoff, evidence paths, and assigned review output path.
If the harness cannot provide an independent context, report the limitation.
Do not claim independent review in the builder's own session.

## Verify independently

1. Read the approved task, status, contract, and project instructions first.
   Verify the task digest and candidate HEAD. Inspect the actual diff and
   surrounding code. Use the build handoff as claims to check.
2. Evaluate scope, acceptance coverage, correctness, regressions, maintainability,
   data handling, and relevant security concerns. Check the task's blast radius
   against the actual diff: every affected component, schema change, contract
   and deploy step it names, and anything the diff touches that it omits. A
   wrong or missing blast radius claim is a finding, because the PR carries it
   to the user. Check that tests have not been
   weakened and evidence belongs to this candidate. Compare every changed
   existing test expectation with the task's list of tests it changes; an
   unlisted change needs a reason in the build handoff and your judgment.
3. Re-run targeted checks or reproduce suspicious behavior when useful. Separate
   pre-existing failures from new defects. Do not repeat a full check that CI
   runs on the PR head (the dispatch lists them) when the builder's log for
   this exact candidate shows it passing: CI is that independent run. Run the
   tests for what changed and any check CI does not run; with no CI, run the
   full suite. Trust a builder log only when it names the candidate commit it
   ran against. Start long checks in the background and read code meanwhile.
4. Record actionable, supported findings. Include severity, whether it blocks,
   file/line, observed behavior, reproduction or reasoning, expected behavior,
   and acceptance IDs. Label unverified concerns and missing evidence honestly.
   Before writing a finding about state, focus or timing, sweep its family
   (see "Sweep the case family") and report the siblings you found in the
   same review.
5. Save the assigned `review-NN.md` with a full reviewed SHA and one verdict:
   `pass`, `changes_requested`, or `blocked`. A pass requires acceptance coverage
   and no unresolved blocking findings; it is not a defect-free guarantee.

## Probe without touching the candidate

Trying to break the candidate is part of the review; changing it is not. Keep
probe tests, scripts, and mutation checks outside the task worktree:

- Put probe files in a scratch directory and import the project's code and test
  fixtures by absolute path, running them with the project's own test runner.
- To run an earlier candidate (a red run of a new test, or the same browser
  scenario before and after), use the status helper's `snapshot` command with
  `--label <your handoff name>`; see "Earlier candidates" in the run contract.
- For mutation checks, or anything that needs real Git operations on tracked
  files, use a throwaway copy: `git worktree add --detach <scratch-path>
  <candidate-sha>`, removed with `git worktree remove` when done. Never mutate
  the task worktree.
- Running the project's checks in the task worktree is fine. Ignored build
  outputs may change; `git status` must be clean when you finish.

## Exercise user-facing behavior

When the candidate changes what users see in a browser, do both of these in a
real browser, headless is fine, against the running application:

1. Re-run the committed end-to-end test on the candidate, and read it: check
   that it asserts the criteria rather than only that pages load. Running it
   proves only what the builder chose to test. On a `repair` or `light`
   review, when CI runs the whole suite on the PR head, run only the
   scenarios the change touches.
2. Explore on your own with a short scripted browser session the builder did
   not write. Cover each user-facing criterion and failure state, then try what
   the test skips: keyboard-only use and focus, repeated and rapid actions,
   reload and back navigation mid-flow, long or unusual input, a narrow
   viewport, and console or network errors.

Start from the run's `explore/` scripts: rerun the scenarios earlier rounds
left there that this change could affect, and add your own scenarios to them
rather than to a private scratch copy, listing them in its README (see
"Exploration scripts" in the run contract).

Do not rely on the builder's screenshots or on simulated-DOM tests. Use a
disposable database and the planned sign-in method; never a development or
production database. Keep exploratory scripts outside the task worktree.
Start and stop the application for exploration with the workflow's server
helper (see the run contract), and stop it before writing the handoff. Save
your own screenshots under the evidence directory, and list in the handoff
what each of the two passes exercised and what it did not. A defect found only
by exploring is a finding; recommend adding it to the committed test.

If you cannot run a browser or sign in, and the approved task does not record
the user's acceptance of that gap, the criterion is unverified: return
`blocked` naming the missing capability rather than `pass` with a limitation.

## Sweep the case family

A defect in state, focus or timing rarely comes alone. When you find one,
list the cases that reach the same code path or the same promise before you
write it up, and try each:

- every kind of row, control or panel the path handles, not only the one you
  saw (an edit row and a confirm row, a task row and a list entry);
- the neighbours: none, one that changed or disappeared in the same update,
  the first and the last item;
- where focus or input is: in the affected element, beside it, elsewhere
  (an add form with a draft, a dialog), nowhere;
- timing: the update arriving mid-edit, twice quickly, or not at all.

Report each failing sibling as its own finding, or as one finding that names
every case, so a single repair can cover the family. In a re-review, sweep the
family of each repaired finding again: a repair that fixes the reported case
only is a partial fix.

## Decide the verdict

A finding blocks when the candidate fails an acceptance criterion, breaks a
project standard or standing rule, or has a correctness, security, or data
defect in the approved behavior. Hardening beyond the stated criteria, missing
tests for behavior that works, and preferences are nonblocking. `pass` may
carry nonblocking findings; the coordinator decides whether to repair them or
list them as follow-ups. Use `changes_requested` only for blocking findings,
and say in the summary when blocking was a judgment call.

Follow the dispatch's review scope. `full` covers the whole candidate.
`repair` covers the repair diff and what it could regress, gives the status of
each prior finding, and relies on the earlier review for untouched code.
`light` covers the diff, each finding's fix and test, the targeted tests, and
one browser check of the affected flow when it is user-facing. If the change
turns out riskier than its scope (authorization, data, schema, or broader than
described), say so and review it at the depth it needs.

Use stable finding IDs such as R1-F1. Compare prior findings during re-review and
identify resolutions or recurrences. A recurrence or partial fix of an earlier
finding gets a new ID that names its root ("R4-F1, recurs R3-F1"), so the
coordinator can count attempts per lineage. Say whether the repair was a
materially different approach or another adjustment of the same one. Cosmetic preferences are nonblocking unless
the approved task or project standards make them requirements.

Route clear in-scope defects as `changes_requested` for automatic repair.
Escalate critical risks, material product/architecture decisions, contradictory
requirements, and unavailable evidence as `blocked`, naming the decision needed.
Do not make the human approve every routine bug fix.

Do not edit tracked project files, fix findings, commit, push, merge, or update
status. Tests may produce disposable local artifacts; coordinate before changing
shared external state. Read-only instructions do not enforce harness permissions.

Return the handoff path, verdict, and reviewed SHA to the coordinator. A later
code commit invalidates this approval and needs another independent review.
