# Run records and stage handoffs

## Paths and identity

Use `~/.pior-factory-runs/<repo-key>/<task-id>/` for records. A repository key
combines its checkout basename with a short SHA-256 of its origin identity,
or its canonical local path when no origin exists. The helper never stores the
raw remote URL, which may contain credentials. Pass an existing run's absolute
path when resuming; do not derive a new run after renaming a checkout.

Use the suggested worktree path in status, under
`<run-root>/.worktrees/<repo-key>/<task-id>/`, separate from the record directory.
The helper only proposes it. After approval create it without switching the main
checkout:

```sh
git -C <repo> worktree add -b <recorded-branch> <recorded-worktree> <initial-base-sha>
```

Use structured process arguments or quote shell arguments correctly. Check that
the paths/branch are unused first. A collision is a reconciliation problem, not
permission to reset or reuse unknown work. Worktrees separate code, not security
boundaries or databases/ports. Isolate runtime resources when relevant.

## Files

| File | Owner | Contract |
| --- | --- | --- |
| `task.md` | Coordinator/planner | Original intent, approved plan, acceptance IDs, setup, standing rules, verification strategy |
| `status.json` | Coordinator | Current stage, paths, SHAs, approvals, repair counts, latest outputs, PR/CI |
| `approval-NN.md` | Coordinator | Actual approval words and context, retained when task changes |
| `patch-NN.json` | Coordinator | Status patches, numbered in the order applied |
| `friction.md` | Coordinator | Numbered workflow friction and themes from worker handoffs |
| `dispatch-<stage>-NN.md` | Coordinator | Filled worker assignment and exact input/output paths |
| `baseline.md` | First builder | Before-change behavior and check results, including existing failures |
| `build-NN.md` | Builder | Candidate SHA, criterion evidence, changes, findings addressed, limits |
| `review-NN.md` | Fresh reviewer | Reviewed SHA, verdict, criterion coverage, supported findings |
| `ship-NN.md` | Shipper | Published head/PR, CI evidence, delivery verdict, blockers |
| `evidence/` | Assigned worker | Bounded logs, screenshots, reproductions, and command results, prefixed with the handoff name; the coordinator's own CI watch logs are `coordinator-ci-NN.log` |

NN starts at 01. Keep previous handoffs. A later shipping checkpoint on the same
candidate gets an unused shipping filename; do not overwrite earlier CI evidence.
All handoffs identify the run, task SHA-256, relevant full commit SHAs, author
role, and timestamp. Separate observed evidence from claims and proposals.
Timestamps are when the handoff was written, not an ordering guarantee; order
stages by status revision and SHAs.

Start each evidence log with the full commit it ran against (`git rev-parse
HEAD`) and whether the tree was clean. A log from an uncommitted tree records
the parent commit and says so; it does not prove the final candidate.

Use [task](../assets/task.md), [dispatch](../assets/dispatch.md),
[baseline](../assets/baseline.md), [build](../assets/build.md),
[review](../assets/review.md), [ship](../assets/ship.md), and
[friction](../assets/friction.md) templates. Keep every template section; write
"none" rather than deleting one. There is no hidden agent transcript dependency.
Trim sensitive data before saving evidence; keep records local and out of product
commits. Ignoring these paths in a project is unnecessary because they live outside
it. Do not commit `.pior-factory-runs` into this context repository either.

## Status helper

Requires Node.js >=16.7 and Git. It has no dependencies and does not launch
agents, mutate the project, push, create PRs, or enforce every stage transition.

```sh
node <workflow-skill>/scripts/factory-run.mjs init --repo <repo> --id <task-id> --base <ref>
node <workflow-skill>/scripts/factory-run.mjs show --run <run-dir>
node <workflow-skill>/scripts/factory-run.mjs approve --run <run-dir> --expected-revision 0 --note <approval-text-file>
node <workflow-skill>/scripts/factory-run.mjs update --run <run-dir> --expected-revision 1 --patch <patch-json-file>
```

`init` creates the task and friction templates, evidence directory, and revision
0 status in planning. It never fetches. Its output includes a `warnings` list,
also printed to stderr, when a local base branch differs from its upstream;
a remote-tracking base is only as fresh as the last fetch. It records an absolute main checkout path, deliberate base ref, pinned
initial/comparison base SHAs, suggested worktree and branch, round 1, repair
count 0, and limit 3. It refuses existing task directories and invalid IDs.
Use `--root <absolute-directory>` only when deliberately overriding local storage.

`approve` records the supplied approval text and current task digest, then moves
to ready. The caller must have actual user approval; the helper cannot verify a
conversation. Fill all task placeholders and resolve meaningful decisions first.
For renewed approval, archive the previous task before editing it. Approval
records get revision-based filenames and are never silently replaced.

`update` consumes a JSON object patch from a file named `patch-NN.json`. Editable fields are stage,
round, repair_count, max_repair_rounds, repair_limit_note, comparison_base_sha,
candidate_sha, reviewed_sha, review_verdict, latest_build, latest_review,
latest_ship, pr_url, publication_authorized, publication_note, ci_status,
ci_exception_note, blocked_reason, active_worker, and merge_sha. Keep the patch
in the run directory. Use full SHAs; paths to handoffs are relative to the run.
Use null for unknown SHAs or handoffs. Do not store tool credentials or complete
transcripts in status. A publication or limit-increase note records the user's
actual authorization, not a worker's inference.

Stages: planning, ready, building, reviewing, shipping, waiting_ci,
ready_for_human, paused, blocked, completed, cancelled. Review verdicts: pass,
changes_requested, blocked, or null. CI states: unknown, pending, passed, failed,
not_configured, unavailable. Track the PR head in candidate_sha; CI state must be
reset to unknown after each changed candidate. Reset review fields too.

The helper rejects stale revisions, competing writes, unknown fields, invalid
types, changed approved intent outside planning/paused/blocked/cancelled, and
shipping/readiness with a stale review or mismatched actual HEAD. It checks local
records, not PR/check APIs or the truth of a review. The coordinator still owns
the stage graph, finding triage, approval truth, current CI verification, single
worker ownership, and merge reconciliation.

Updates use an exclusive `.status.lock` directory and atomic status replacement.
If interrupted during a write, inspect the lock and temporary files, confirm
there is no live writer, then remove only the stale lock and retry with the
current revision. Never automatically break a lock by guessing elapsed time.

## Server helper

Workers that run the application outside its committed test runner, such as a
reviewer's exploration or a builder's reproduction, start and stop it with the
bundled server helper instead of backgrounding processes by hand. It is a plain
command, not a service: it starts each server in its own process group, records
the real PID, its start time and the port under a state directory, waits until
the port (and an optional URL) answers, and stops exactly that group later.

```sh
E2E_API_PORT=3373 node <workflow-skill>/scripts/factory-servers.mjs start --dir <run-dir>/servers \
  --name api --port 3373 --cwd <worktree>/packages/api --ready-url http://localhost:3373/health \
  -- node --import tsx test/e2e-server.ts
node <workflow-skill>/scripts/factory-servers.mjs status --dir <run-dir>/servers
node <workflow-skill>/scripts/factory-servers.mjs stop --dir <run-dir>/servers --all
```

Pass server environment variables as a prefix; they are inherited. `--cwd` is
required so a server never runs in the caller's directory, such as the main
checkout instead of the worktree. `start` refuses a name that is still running
and a port that is already in use, so a stale server can never be reported
ready in place of a new one; when a running server from the same state
directory holds the port, the error names it. It fails with the last log lines
when the server exits early (with its exit code or signal) or is not ready
before `--timeout` seconds (default 60), and stops what it started. Output goes to
`<name>.log` in the state directory. `stop` sends SIGTERM to the whole group,
then SIGKILL after `--grace` seconds (default 10), and reports whether the
port is free. A killed test fixture cannot drop its database or stop its
container, so give a slow cleanup enough grace. A record
whose PID now names a different process is treated as not running and left
alone. Never stop servers with `pkill -f` or `pgrep -f`; those patterns can
match the calling shell.

Stop every server before returning a handoff, and restart rather than reuse a
server when a rerun needs fresh data. Name a state directory per worker when
two could overlap. The helper does not isolate databases or choose ports; use
the project's disposable fixtures and ports that differ from development ones.

## Resume

Read status and task, check the approved digest, latest handoffs, actual worktree
branch/HEAD and dirty state, worker liveness, and live PR/check state. A surviving
tmux pane does not prove an agent is alive; an old success handoff does not prove
HEAD is unchanged. Reattach or stop a known live worker before dispatching again.

If external state contradicts status, record the discrepancy and reconcile it
before advancing. Preserve initial_base_sha; change comparison_base_sha only
for a deliberate, verified base refresh and invalidate review accordingly. Verify
all evidence after rebase or merge. Resume a waiting CI checkpoint without
rerunning a completed build, and never claim background monitoring while the
session is stopped.
