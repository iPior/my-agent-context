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
CLI flags. Give each worker the filled [dispatch template](../assets/dispatch.md),
including absolute paths to its stage skill, shared run contract, task, status,
worktree, input handoffs, output handoff, and evidence directory. Specify the
pinned base/candidate commits, permitted actions, and whether it must return
before another stage starts. Provide the original approved task even on repairs.

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

## Accept a stage result

Check the assigned handoff exists and is complete. Verify its run identity,
task digest, relevant SHAs, and evidence paths. Inspect actual Git state rather
than accepting a worker's success sentence. Reject stale review or CI evidence.
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
After the user merges, verify the actual PR state and record the merge commit;
squash/rebase merges need not preserve the candidate as an ancestor.

Retain run records and the worktree by default. If cleanup is requested later,
verify no live worker or unlanded/uncommitted work depends on the worktree and
use ordinary Git worktree removal. Never delete the run root or use force to
bypass a refusal. The run records must outlive worktree cleanup.
