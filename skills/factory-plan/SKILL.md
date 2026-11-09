---
name: factory-plan
description: Inspect a repository and agree on the scope, approach, and acceptance criteria for an explicitly requested factory run. Use when factory-workflow starts planning, when the user explicitly requests factory planning, or when a material scope change needs renewed approval.
---

# Factory Plan

Plan in the main conversation with the user. Return delegated research to this
conversation for decisions and approval.

## Read before asking

Read the run's `task.md`, `status.json`, the coordinator-supplied shared contract,
and applicable project instructions. Inspect the relevant implementation, tests,
build commands, and repository state. If invoked without a run, return a proposed
plan only; do not invent paths or claim a factory run exists.

Reuse decisions already made. Ask only about uncertainty that changes what gets
built, the approach, or how success will be judged. Label proposals and
assumptions; do not convert them into user requirements.

## Write a reviewable plan

Fill the task template with:

- The user's original request and any supplied context.
- The resulting behavior, affected components, and chosen approach.
- Explicit acceptance criteria with stable IDs such as AC-1 and AC-2.
- Scope boundaries, constraints, and decisions the user needs to make.
- A verification plan connecting each criterion to a test, reproduction, UI
  walkthrough, or other observable evidence. Include regression checks.
- The proposed base ref and known pre-existing failures or setup needs.

Keep the review summary to one screen when practical. Do not require approval
of routine file-by-file edits. For a bug, plan a concrete reproduction before
the fix; for a feature, define observable success. Do not force a failing test
where a screenshot, manual check, or another form of evidence is more appropriate.

## Obtain approval once

Present the completed plan and acceptance criteria. Wait for an explicit answer.
If the user has already explicitly approved this concrete plan in the current
session, preserve that approval instead of requesting it again.
The coordinator records that answer and the hash of the approved `task.md`.
Repository inspection and writing task records are allowed during planning;
product edits, dependency installation, worktree creation, and builds wait for
approval under this workflow.

Freeze the approved intent for workers. Routine implementation adjustments stay
within it. For a material change, retain the previous task version, revise the
plan, and obtain renewed approval. In-scope repairs need no new planning ceremony.
