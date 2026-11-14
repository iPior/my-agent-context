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
   data handling, and relevant security concerns. Check that tests have not been
   weakened and evidence belongs to this candidate.
3. Re-run targeted checks or reproduce suspicious behavior when useful. Separate
   pre-existing failures from new defects. Avoid duplicating expensive checks
   when reliable evidence already establishes them. Trust a builder log only
   when it names the candidate commit it ran against.
4. Record actionable, supported findings. Include severity, whether it blocks,
   file/line, observed behavior, reproduction or reasoning, expected behavior,
   and acceptance IDs. Label unverified concerns and missing evidence honestly.
5. Save the assigned `review-NN.md` with a full reviewed SHA and one verdict:
   `pass`, `changes_requested`, or `blocked`. A pass requires acceptance coverage
   and no unresolved blocking findings; it is not a defect-free guarantee.

## Probe without touching the candidate

Trying to break the candidate is part of the review; changing it is not. Keep
probe tests, scripts, and mutation checks outside the task worktree:

- Put probe files in a scratch directory and import the project's code and test
  fixtures by absolute path, running them with the project's own test runner.
- For mutation checks, or anything that must edit tracked files, use a
  throwaway copy: `git worktree add --detach <scratch-path> <candidate-sha>`,
  removed with `git worktree remove` when done. Never mutate the task worktree.
- Running the project's checks in the task worktree is fine. Ignored build
  outputs may change; `git status` must be clean when you finish.

## Decide the verdict

A finding blocks when the candidate fails an acceptance criterion, breaks a
project standard or standing rule, or has a correctness, security, or data
defect in the approved behavior. Hardening beyond the stated criteria, missing
tests for behavior that works, and preferences are nonblocking. `pass` may
carry nonblocking findings; the coordinator decides whether to repair them or
list them as follow-ups. Use `changes_requested` only for blocking findings,
and say in the summary when blocking was a judgment call.

On a re-review, follow the dispatch's review scope. Unless it asks for the full
candidate, review the repair diff and what it could regress, give the status
of each prior finding, and rely on the earlier review for untouched code.

Use stable finding IDs such as R1-F1. Compare prior findings during re-review and
identify resolutions or recurrences. Cosmetic preferences are nonblocking unless
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
