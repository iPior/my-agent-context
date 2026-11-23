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

A worktree shares one repository with the user's checkout: stashes, refs and
config are repository-wide. Workers never use `git stash`, never create or
delete branches or tags other than the assigned branch, and never change Git
config. To set work aside, commit it on the assigned branch or copy the files
to a scratch directory outside the worktree.

## Worker safety

- **Write probe.** Confirm write access by creating and removing a file named
  `.probe-<role>-NN` in the assigned output directory. Never create the output
  handoff empty as a probe.
- **Hold still during checks.** Do not edit the worktree while a baseline or
  final check runs against it; such a run proves neither tree. Use a throwaway
  detached worktree for experiments that must overlap a long check.
- **Measure before claiming.** A handoff states only what was measured, with
  the command or evidence path. Write "not measured" rather than inferring.
- **Long checks in the background.** Start any check that can run longer than
  about three minutes (full suites, e2e runs, builds) in the background
  yourself and wait for its completion notice. Some harnesses move a long
  foreground command to the background on their own, which splits one check
  into two notices and makes its exit status easy to miss.
- **Name tests by behavior.** Test names describe the behavior they check,
  never only a finding ID: IDs such as R3-F1 restart in every run, so a
  filter on one also matches older tests. When an ID helps, add it after the
  behavior and with the run ID, for example `"keeps focus on the next list
  (shared-lists R3-F1)"`.

## Files

| File | Owner | Contract |
| --- | --- | --- |
| `task.md` | Coordinator/planner | Original intent, approved plan, acceptance IDs, setup, standing rules, verification strategy |
| `status.json` | Coordinator | Current stage, paths, SHAs, approvals, repair counts, latest outputs, PR/CI |
| `approval-NN.md` | Coordinator | Actual approval words and context, retained when task changes |
| `patch-NN.json` | Coordinator | Status patches, numbered in the order applied |
| `friction.md` | Coordinator | Numbered workflow friction and themes from worker handoffs |
| `ledger.md` | Coordinator | Per-dispatch model, tokens, duration and result; finding lineages with attempts, approaches, cost and status |
| `fallback-NN.md` | Coordinator | The user's decision when the run falls back to an earlier reviewed candidate |
| `dispatch-<stage>-NN.md` | Coordinator | Filled worker assignment and exact input/output paths |
| `baseline.md` | First builder | Before-change behavior and check results, including existing failures |
| `build-NN.md` | Builder | Candidate SHA, criterion evidence, changes, findings addressed, limits |
| `review-NN.md` | Fresh reviewer | Reviewed SHA, verdict, criterion coverage, supported findings |
| `ship-NN.md` | Shipper | Published head/PR, CI evidence, delivery verdict, blockers; the PR body follows the PR template |
| `evidence/` | Assigned worker | Bounded logs, screenshots, reproductions, and command results, prefixed with the handoff name; the coordinator's own CI watch logs are `coordinator-ci-NN.log` |
| `explore/` | Builders and reviewers | Reusable exploration scripts shared by every round, with a README listing their scenarios; see "Exploration scripts" |
| `snapshots/` | Status helper | Read-only copies of earlier candidates made by `snapshot` |

NN starts at 01. Keep previous handoffs. A later shipping checkpoint on the same
candidate gets an unused shipping filename; do not overwrite earlier CI evidence.
All handoffs identify the run, task SHA-256, relevant full commit SHAs, author
role, and timestamp. Separate observed evidence from claims and proposals.
Timestamps are when the handoff was written, not an ordering guarantee; order
stages by status revision and SHAs.

Start each evidence log with the full commit it ran against (`git rev-parse
HEAD`) and whether the tree was clean. A log from an uncommitted tree records
the parent commit and says so; it does not prove the final candidate. Save the
failing run of every test written to reproduce a finding or a new behavior
(`<handoff>-red*.log`), not only the passing one.

Use [task](../assets/task.md), [dispatch](../assets/dispatch.md),
[baseline](../assets/baseline.md), [build](../assets/build.md),
[review](../assets/review.md), [ship](../assets/ship.md),
[friction](../assets/friction.md), [ledger](../assets/ledger.md), and
[PR](../assets/pr.md) templates. Keep every template section; write
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
node <workflow-skill>/scripts/factory-run.mjs fallback --run <run-dir> --expected-revision 9 --to <reviewed-sha> --review <review-handoff> --note <decision-text-file>
node <workflow-skill>/scripts/factory-run.mjs snapshot --run <run-dir> --sha <earlier-candidate-sha>
```

`init` creates the task, friction and ledger templates, evidence directory, and revision
0 status in planning. It never fetches. Its output includes a `warnings` list,
also printed to stderr, when a local base branch differs from its upstream;
a remote-tracking base is only as fresh as the last fetch. It records an absolute main checkout path, deliberate base ref, pinned
initial/comparison base SHAs, suggested worktree and branch, round 1, review
repair count 0 with limit 3, and CI repair count 0 with limit 1. It refuses existing task directories and invalid IDs.
Use `--root <absolute-directory>` only when deliberately overriding local storage.

`approve` records the supplied approval text and current task digest, then moves
to ready. The caller must have actual user approval; the helper cannot verify a
conversation. Fill all task placeholders and resolve meaningful decisions first.
For renewed approval, archive the previous task before editing it. Approval
records get revision-based filenames and are never silently replaced.

`update` consumes a JSON object patch from a file named `patch-NN.json`. Editable fields are stage,
round, repair_count, max_repair_rounds, ci_repair_count, max_ci_repair_rounds,
repair_limit_note, comparison_base_sha,
candidate_sha, reviewed_sha, review_verdict, latest_build, latest_review,
latest_ship, pr_url, publication_authorized, publication_note, ci_status,
ci_exception_note, blocked_reason, active_worker, and merge_sha. Keep the patch
in the run directory. Use full SHAs; paths to handoffs are relative to the run.
Use null for unknown SHAs or handoffs. Do not store tool credentials or complete
transcripts in status. A publication or limit-increase note records the user's
actual authorization, not a worker's inference; extending a limit needs a new
note. Publication authority lives only in status, never in the hashed task, so
it can be recorded with or after plan approval.

Starting a repair after a passing review takes one patch: set the next stage,
round and counter, `latest_review` to the review handoff (which keeps the
pass on record), and clear `candidate_sha`, `reviewed_sha`, `review_verdict`
and CI to unknown.

`fallback` returns the run to an earlier candidate that already passed review,
for example the published PR head after later local repairs are abandoned. It
takes the target SHA, that candidate's review handoff (which must name the SHA
and a pass verdict), and a file with the user's decision, saved as
`fallback-NN.md`. The target must be the worktree HEAD or an ancestor of it. It
records the review as passing, resets CI to unknown, moves to paused, and keeps
the newer local commits as `abandoned_head_sha`. With that head in place,
waiting_ci and ready_for_human accept the earlier candidate, but shipping is
refused, because a push would publish the abandoned commits. Record the
candidate's CI from its saved evidence with `update`. A later change of
candidate clears the fallback.

Stages: planning, ready, building, reviewing, shipping, waiting_ci,
ready_for_human, paused, blocked, completed, cancelled. Review verdicts: pass,
changes_requested, blocked, or null. CI states: unknown, pending, passed, failed,
not_configured, unavailable. Track the PR head in candidate_sha; CI state must be
reset to unknown after each changed candidate. Reset review fields too.

The helper rejects stale revisions, competing writes, unknown fields, invalid
types, changed approved intent outside planning/paused/blocked/cancelled, and
shipping/readiness with a stale review or mismatched actual HEAD, round counts
that do not equal both repair counters plus one, and exhausted limits. It checks local
records, not PR/check APIs or the truth of a review. The coordinator still owns
the stage graph, finding triage, approval truth, current CI verification, single
worker ownership, and merge reconciliation.

Updates use an exclusive `.status.lock` directory and atomic status replacement.
If interrupted during a write, inspect the lock and temporary files, confirm
there is no live writer, then remove only the stale lock and retry with the
current revision. Never automatically break a lock by guessing elapsed time.

## Earlier candidates

Red runs and before/after browser checks need an earlier candidate's source.
Get it with the helper's `snapshot` command, not a second Git worktree:

```sh
node <workflow-skill>/scripts/factory-run.mjs snapshot --run <run-dir> --sha <full-sha>
```

It extracts that commit with `git archive` into
`<run-dir>/snapshots/<first 12 characters>[-<label>]/`, links each
`node_modules` directory of the task worktree into the copy so it runs without
an install, and prints the path. It writes no refs, worktree records or
config. An existing snapshot is refused with its path: reuse an unlabelled one
read-only, since another worker may be running it. To run the earlier code
against the candidate's new tests (a red run), make your own copy with
`--label <your handoff name>`, such as `--label review-02`, and copy those
test files into it. The links point into the task worktree, so never install
or delete dependencies through a snapshot. For a mutation check that needs real
Git operations, a throwaway `git worktree add --detach` is still allowed;
remove it with `git worktree remove` before returning.

## Exploration scripts

Reviewers and builders keep reusable exploration scripts, such as scripted
browser sessions with two users or API probes, in `<run-dir>/explore/`, not in
a per-dispatch scratch directory. `init` creates it with a README. Each script
takes its evidence prefix and server state directory as arguments, starts
fresh servers per scenario through the server helper (so every scenario has
fresh data), and imports the project's browser library by the absolute path
the task gives. A worker that adds a scenario lists it in the README with its
round; nobody deletes another worker's scenario. A later dispatch reruns the
relevant scenarios before writing new ones.

## CI wait

The coordinator waits for CI with the bundled script, in the background:

```sh
node <workflow-skill>/scripts/factory-ci.mjs wait --repo <owner/name> --sha <full-sha> \
  --expect <checks> [--timeout 1800] [--interval 30] --log <run-dir>/evidence/coordinator-ci-NN.log
```

It uses the gh CLI's existing login to read the GitHub check runs of that
commit (never another commit's), waits until at least `--expect` exist and all
completed, and exits 0 when all passed (skipped and neutral count as passed),
1 when one failed or the API failed three times in a row, and 2 when still
pending at the timeout. It saves the final states as JSON to the log, refusing
an existing log. It only reads; it never reruns or changes checks or the PR.

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
