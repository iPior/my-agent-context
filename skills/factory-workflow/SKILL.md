---
name: factory-workflow
description: Coordinate an explicitly requested software factory run through planning, an isolated build, independent review, repairs, and a pull request. Use only when the user requests the factory workflow or asks to resume a named factory run; ordinary coding requests do not activate it.
---

# Factory Workflow

Use the main conversation as the coordinator. Keep requirements, decisions, and
short outcomes here; delegate implementation, independent review, and shipping.
Run this skill explicitly. Do not turn ordinary coding conversations into factory
runs or change global instructions, provider settings, or installed skills.

## Load the contract

Read [coordinator.md](references/coordinator.md) and
[run-contract.md](references/run-contract.md) before starting or resuming.
Resolve references and `scripts/` relative to this skill's actual installed
directory, never the current project directory or a temporary package cache.
Install the five `factory-*` skills together. Resolve the actual paths of the
four stage skills before dispatch. Pass those paths explicitly to workers; do
not assume a child inherits loaded skills or the parent's conversation.

## Start or resume

1. Identify the target repository and read its applicable project instructions.
   Confirm the harness can delegate, start an independent reviewer context,
   wait for results, and access both the assigned worktree and run directory.
   If unavailable, explain the missing capability and offer a manual handoff;
   never substitute the builder's self-review for independent review.
2. For a new run, use the bundled helper with an absolute repository path, unique
   task ID, and deliberate base ref:

   ```sh
   node <workflow-skill>/scripts/factory-run.mjs init --repo <absolute-repo> --id <task-id> --base <base-ref>
   ```

   It creates local records under `~/.pior-factory-runs/`, with a repository key
   derived from the remote identity (or local path). It does not create a
   worktree, edit the project, install tools, or launch agents.
3. Use `factory-plan` in the main conversation to inspect, discuss, and record
   the proposed task. Present the concrete plan and obtain approval before the
   first build. Record the actual approval and approved task digest through the
   helper; see the run contract. Do not treat silence as approval.
4. Create the recorded branch and worktree from the pinned base commit only
   after approval. Capture the existing test/behavior baseline there before
   implementing. Never switch, clean, stash, or reset the user's checkout.
5. Dispatch `factory-build`, then `factory-review` with a fresh context. Resume
   the builder or start a replacement to address findings; run a new independent
   review on each changed candidate. Route approved candidates to `factory-ship`.
6. Inspect actual CI results for the current PR head. Route code failures through
   build and review again, updating the existing PR. Classify infrastructure,
   credential, and unavailable-check failures separately from code defects.
7. Present the PR, evidence, and outstanding decisions. Leave merging to the user.
   Reconcile a user-performed merge before marking the run complete.

## Keep the coordinator small

Require each worker to save its handoff before returning its path and commit.
Validate each result against the repository and the shared contract, then update
`status.json` using the helper's revision check. Keep full logs and screenshots
in the run's `evidence/` directory, with pointers in the handoff.

Use at most three automatic repair rounds across review and CI combined. Pause
earlier for repeated unresolved findings, material scope changes, critical risk,
or a true external blocker. The user may authorize another bounded attempt.
Do not repeatedly spawn agents without new evidence.

This is a session-driven workflow, not an unattended service. Tmux can preserve
the process, but these skills do not provide event delivery, a daemon, or crash
recovery by themselves. Persist a waiting stage before a turn ends. Resume by
reading disk and checking live repository/PR state, never by trusting chat memory.
