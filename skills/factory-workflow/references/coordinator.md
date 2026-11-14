# Coordinator contract

Load this contract only for an explicitly requested factory run. It is the
factory's scoped operating agreement, not a replacement for global or project
`AGENTS.md` files. Project instructions and the user's current decisions remain
applicable. These skills are source-controlled workflow instructions; the local
run directory is task state, not an instruction source with higher authority.

## Ownership

- Keep the main conversation as the coordinator and planning/approval interface.
- Delegate product edits to the builder, independent evaluation to a reviewer,
  and publishing/check monitoring to the shipper. Keep the coordinator out of
  product edits so it can reconcile the workers' results.
- Own `status.json`, approved task revisions, approval records, and dispatch.
  Workers own only their assigned handoffs and stage-specific evidence.
- Run one task-branch writer at a time. Finish or stop a worker before moving
  ownership to another. Do not review or push while a builder is still editing.
- Reuse one task worktree for sequential build/repair rounds. Reviewer freshness
  means independent conversational context; it does not require another branch.

## Dispatch

Use the actual harness's delegation tools, not invented tool names or assumed
CLI flags. The stage skills are plain instructions, not registered agent types:
when the harness has no dedicated worker type, start a general-purpose
subagent and name the stage skill's path in its brief. Fill a new copy of the
[dispatch template](../assets/dispatch.md) for every dispatch, save it as
`dispatch-<stage>-NN.md`, and make the worker's prompt point at that file
rather than restating it; two sources drift. Give each worker the filled template,
including absolute paths to its stage skill, shared run contract, task, status,
worktree, input handoffs, output handoff, and evidence directory. Specify the
pinned base/candidate commits, permitted actions, and whether it must return
before another stage starts. Provide the original approved task even on repairs.

Copy the task's setup notes and standing rules into every dispatch. Harnesses
may inject their own defaults, such as attribution or co-author lines, into a
worker's context; a worker that never saw the user's rule will follow the
default. State that the user's rules win.

Do not fork the builder transcript into a reviewer. Pass raw requirements,
code, and evidence; the build summary is a fallible claim, not a verdict. Ask
the harness for an independent context. If that cannot be established, stop
short of claiming independent review and offer an explicit manual handoff.

Resolve skill and contract paths before starting. Pass required files directly
when the harness does not discover installed sibling skills. Do not assume a
native child shares loaded skills, filesystem permissions, memory, or tools.
If the run folder sits outside a writable sandbox, arrange access before work
starts; a path in a prompt does not grant filesystem access.

Native subagents in one chosen harness are the initial implementation. These
skills do not implement mixed-provider adapters, worker scheduling, daemons,
tmux management, remote workers, or automatic wake-up after a session exits.

## Real-browser verification

For browser-facing tasks, confirm before planning ends that workers can start
the application and drive a real browser, and how they sign in. Builder and
reviewer each run the check; the reviewer's run is independent evidence. Only
the user can waive it, as a recorded proposal in the approved task. Report a
waived or unavailable browser check prominently in the final report, apart
from checks that passed.

## Triage findings

Decide every review finding by ID in the repair dispatch: fix, fix if simple,
or skip with a reason. Do not paraphrase a finding's extent. A listed ID means
the whole finding as the reviewer wrote it; name any excluded part explicitly.

Reviewers mark findings blocking or nonblocking. A pass may carry nonblocking
findings: either list them as follow-ups in the PR and final report, or spend a
repair round when they are cheap and in scope. Say which you chose and why.

For a re-review after a repair, set the review scope in the dispatch. The
default is the repair diff, regressions it could cause, and the status of each
prior finding, relying on the earlier review for code the repair did not touch.
Ask for a full-candidate review when the repair is broad, touches
authorization or data handling, or the earlier review was limited. Every
re-review still runs in a fresh context on the new candidate SHA.

## Accept a stage result

Check the assigned handoff exists and is complete. Verify its run identity,
task digest, relevant SHAs, and evidence paths. Inspect actual Git state rather
than accepting a worker's success sentence. Reject stale review or CI evidence.
A harness may signal one worker's completion more than once, or late, after the
next stage started. Identify a result by its handoff file and SHA; a repeated
signal is not a new result and never a user message.
Record limitations and distinguish pre-existing failures, implementation defects,
external blockers, and pending checks.

Use the status helper with the expected revision for each status mutation. It
provides atomic replacement and stale-write rejection, not proof of user consent
or a complete workflow engine. Read the current status after any rejection;
never overwrite someone else's update or restart a live worker blindly.

## Repair and escalation

Allow three automatic repair rounds total across review and CI failures. The
initial build is round 1 with repair_count 0; each repair increments both round
and repair_count before dispatch. Do not reset counters when the stage changes
or a replacement builder starts. Keep prior handoffs and findings.

Pause earlier when the same finding recurs without a materially different fix,
or when the task needs a product decision, a material scope/architecture change,
a critical risk decision, or missing external access. Report the evidence and
smallest decision needed. Extend the repair limit only with explicit user
authorization recorded in the run. Budget pending CI waits and infrastructure
retries separately; they do not justify repeated code repairs.

Routine in-scope fixes do not need fresh plan approval. For changed intent,
archive the previous task and affected records before replacing them, return to
planning, and record renewed approval. Changing task content invalidates the old
approval digest. Any new candidate, including a rebase, invalidates old review.

## Publication, merge, and cleanup

Record the user's authorization to publish the task branch and PR, including
any draft requirement. Honor authorization already supplied in the request;
do not ask again. Planning approval by itself covers implementation, not an
unspecified external publication. Keep merge authority with the user.

Do not deploy, auto-merge, force-push, discard edits, or delete worktrees as a
side effect of this workflow. If ordinary push fails because the remote advanced,
inspect and route reconciliation through the builder and a new review.

Mark ready_for_human only after the latest candidate passed review and required
CI is green, or after an explicit user decision accepts a documented absent or
unavailable check. Distinguish that exception from green CI in the final report.
When the repository configures no required checks, every check that ran on the
PR head must have passed, and the final report says that no check is enforced.
After the user merges, verify the actual PR state and record the merge commit;
squash/rebase merges need not preserve the candidate as an ancestor.

Before the final report, read each handoff's workflow friction section and
summarize recurring themes in the run's `friction.md`, including your own
coordination mistakes. Report them to the user; change skills only in their
source repository, outside the run.

Retain run records and the worktree by default. If cleanup is requested later,
verify no live worker or unlanded/uncommitted work depends on the worktree and
use ordinary Git worktree removal. Never delete the run root or use force to
bypass a refusal. The run records must outlive worktree cleanup.
