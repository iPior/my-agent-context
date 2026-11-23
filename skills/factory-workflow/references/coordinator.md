# Coordinator contract

Load this contract only for an explicitly requested factory run. It is the
factory's scoped operating agreement, not a replacement for global or project
`AGENTS.md` files. Project instructions and the user's current decisions remain
applicable. These skills are source-controlled workflow instructions; the local
run directory is task state, not an instruction source with higher authority.

## Ownership

- Keep the main conversation as the coordinator and planning/approval interface.
- Delegate product edits to the builder, independent evaluation to a reviewer,
  and publishing to the shipper; watch CI yourself (see "Pace the run"). Keep
  the coordinator out of product edits so it can reconcile the workers'
  results.
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

State each assignment as a required outcome and the check that proves it, not
as a structure to build. A suggested implementation is a hint the worker may
replace when it cannot reach the outcome; prescribe a structure only after
verifying that it works. Tell workers to claim only what they measured.

Copy the task's setup notes, "Run it by hand" commands, and standing rules into
every dispatch. Name the run's `explore/` directory in every builder and
reviewer dispatch, so each round extends the last round's exploration scripts
instead of writing new ones. Harnesses may inject their own defaults, such as attribution or
co-author lines, into a worker's context; a worker that never saw the user's
rule will follow the default. State that the user's rules win.

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

## Pace the run

Most of a run's time goes to repeated checks and waiting, not to the model.
Keep the independent evidence and cut the duplication.

- **Model per stage.** Choose a model and effort for each dispatch, record it
  in the dispatch's "Model and effort" field, and pass it through the
  harness's delegation options when they exist (otherwise note that the
  harness chose). Use the strongest available model (for example Claude Opus)
  for planning, the initial build, and every review: those decide what the
  factory catches. Use a fast model (for example Claude Sonnet) for shipping,
  and for a first repair whose findings are small and specific and touch no
  authorization, data or schema. Choose by difficulty, not size. These go to
  the strongest model however small they look: a repair that replaces an
  approach that already failed; a repair of stateful UI logic (focus,
  background refresh, optimistic or pending state, anything that runs in an
  effect after the data changes) or of concurrency and locking; and any repair
  in an area where an earlier repair of the run caused a regression. Write
  fast-model dispatches so they can be followed without inference. Record each
  dispatch's model, tokens and duration in the run's ledger as it returns.
- **Each check runs once per owner.** The builder runs the full suite once on
  the final committed candidate, and targeted tests while iterating. The
  reviewer does not repeat a full check that CI runs on the PR head (listed in
  the task's verification plan) when the builder's log for the same candidate
  shows it passing; it runs the targeted tests for what changed, any check CI
  does not run, the browser passes, and its own probes. CI is the independent
  full run before ready_for_human. When CI runs nothing, or the repository
  configures no CI, the reviewer runs the full suite as before.
- **Work in parallel.** Workers start long independent checks in the
  background, where the harness allows, and read code or explore meanwhile,
  with separate ports and databases. They wait for every check before writing
  the handoff.
- **Nobody sits waiting on CI.** The shipper pushes, updates the PR, confirms
  the checks registered on the pushed head, and returns `waiting_ci`. The
  coordinator records that stage, then runs the bundled CI wait in the
  background, never a foreground sleep, a hand-written polling loop or an idle
  worker:

  ```sh
  node <workflow-skill>/scripts/factory-ci.mjs wait --repo <owner/name> --sha <head-sha> \
    --expect <number of checks from the task> --log <run-dir>/evidence/coordinator-ci-NN.log
  ```

  It reads the check runs of that exact SHA, waits until the expected number
  exist (a job that starts after another is not registered at push time),
  saves their states to the log, and exits 0 when all passed, 1 when one
  failed, and 2 when still pending at its timeout (run it again). Record
  `ci_status`, then update the PR body's "CI on this head" line, which the
  shipper had to leave pending, and its run cost with the shipping dispatch
  included. If `gh pr edit` fails, use the REST fallback in the ship skill.
  Then mark ready_for_human or route the failure like any other.

## Real-browser verification

For browser-facing tasks, confirm before planning ends that workers can start
the application and drive a real browser, and how they sign in. The builder
writes and runs the end-to-end check. The reviewer re-runs it (on a repair or
light review, when CI runs the whole suite on the PR head, only the scenarios
the change touches) and separately explores the application with its own
browser session; both passes are required for independent evidence. Only
the user can waive it, as a recorded proposal in the approved task. Report a
waived or unavailable browser check prominently in the final report, apart
from checks that passed.

## Triage findings

Decide every review finding by ID in the repair dispatch: fix, fix if simple,
or skip with a reason. Do not paraphrase a finding's extent. A listed ID means
the whole finding as the reviewer wrote it; name any excluded part explicitly.

Reviewers mark findings blocking or nonblocking. A pass may carry nonblocking
findings. Triage them yourself, then tell the user your recommendation for each
(fix in one batched repair round, or list as a follow-up) and act on their
answer; never defer or repair them silently. Recommend the batched fix by
default for findings that are cheap and well understood; recommend a follow-up
only for a reason you can name, such as a planned rework or real risk to
resolved behavior. When the round budget is used up, offer one more bounded
round as an ordinary option alongside shipping with follow-ups.

Fix a family of cases once, not one case per round. A finding about state or
focus usually has siblings: the same path reached from another row or
control type, an empty neighbour, a neighbour that changed too, focus outside
the area. In each repair dispatch, name the finding's case family and require
the builder to cover the siblings with tests, not only the reported case. A
reviewer that keeps finding new siblings of one family round after round is a
sign the family was never named; name it before the next round. Put all nonblocking findings you
fix from one review into a single repair round rather than one round each.
Never defer a finding to keep a round in reserve for CI: CI repairs have their
own budget (see "Repair and escalation"). Use what the user has said about
upcoming changes, such as a planned rework of the affected area.

## Cap each finding

Track every finding as a lineage in the run's [ledger](../assets/ledger.md).
A recurrence or partial fix reported in a later review keeps the root ID; the
reviewer names it ("R4-F1, recurs R3-F1"). Count attempts per lineage:

- A nonblocking lineage gets one repair attempt. If the next review still
  reports it, record it as a follow-up and move on. A further attempt needs
  the user's go-ahead, and its dispatch must state an approach materially
  different from every earlier attempt.
- A blocking lineage gets two attempts, the second materially different from
  the first, then the run pauses with the evidence and the smallest decision
  needed.
- "Materially different" means a different mechanism, not new parameters for
  the same one. If you cannot name the difference, pause instead of
  dispatching.

These caps apply inside the round budget, never on top of it.

Set the review scope in every review dispatch, sized to the risk:

- `full`: the whole candidate. Use it for the first review, a broad repair,
  anything touching authorization, data handling or schema, or when the
  earlier review was limited.
- `repair` (the default re-review): the repair diff, regressions it could
  cause, and the status of each prior finding, relying on the earlier review
  for code the repair did not touch.
- `light`: a repair of a few lines, or a test-only or documentation-only
  change, with no authorization, data or schema impact. The reviewer reads the
  diff, confirms each finding's fix and its test, runs the targeted tests, and
  makes one browser check of the affected flow when it is user-facing.

Every new candidate still gets a review in a fresh context on its SHA, at
least `light`. Only the user can waive one, recorded in the run.

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

Allow three automatic repair rounds for review findings (`repair_count`) and,
separately, one automatic repair round for a CI code failure
(`ci_repair_count`). The initial build is round 1; each repair increments the
round and the matching counter before dispatch, so round always equals both
counters plus one. A CI repair still goes through build and a fresh review, and
its review does not consume a review repair. A second CI code failure pauses
for the user. Do not reset counters when the stage changes or a replacement
builder starts. Keep prior handoffs and findings.

Pause earlier when a finding lineage reaches its cap (see "Cap each finding"),
or when the task needs a product decision, a material scope/architecture change,
a critical risk decision, or missing external access. Report the evidence and
smallest decision needed. Extend either limit only with explicit user
authorization recorded in the run. Budget pending CI waits and infrastructure
retries separately; they do not justify repeated code repairs.

To stop at an earlier reviewed candidate, such as the published PR head, when
later local repairs are abandoned, use the helper's `fallback` command with
that candidate's passing review handoff and the user's decision. The local
commits stay on the branch untouched and are never pushed; record the earlier
candidate's CI from saved evidence, then continue to ready_for_human.

Routine in-scope fixes do not need fresh plan approval. For changed intent,
archive the previous task and affected records before replacing them, return to
planning, and record renewed approval. Changing task content invalidates the old
approval digest. Any new candidate, including a rebase, invalidates old review.

## Publication, merge, and cleanup

Record the user's authorization to publish the task branch and PR, including
any draft requirement. Honor authorization already supplied in the request;
do not ask again. Planning approval by itself covers implementation, not an
unspecified external publication. Keep merge authority with the user.

Make the PR the one place the user needs to read. The shipper fills the
[PR template](../assets/pr.md) from the approved task, the reviewed handoffs and
the ledger, including the blast radius the plan recorded and the reviewer
checked. Pass the ledger's current totals in the shipping dispatch, and update
the PR body when a later candidate or repair changes them.

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

The final report and the PR's "Factory run" section come from the ledger:
each stage with its model, tokens and duration, the totals, repair rounds used
of each limit, and the attempts and cost per finding lineage. Write "not
reported" where the harness gave no figure; never estimate.

Retain run records and the worktree by default. If cleanup is requested later,
verify no live worker or unlanded/uncommitted work depends on the worktree and
use ordinary Git worktree removal. Never delete the run root or use force to
bypass a refusal. The run records must outlive worktree cleanup.
