---
name: factory-plan
description: Inspect a repository and agree on the scope, approach, and acceptance criteria for an explicitly requested factory run. Use when factory-workflow starts planning, when the user explicitly requests factory planning, or when a material scope change needs renewed approval.
---

# Factory Plan

Plan in the main conversation with the user. Return delegated research to this
conversation for decisions and approval.

## Read before asking

Read the run's `task.md` (also before writing it: the helper created it, and
some harnesses refuse to overwrite a file not read in the session),
`status.json`, the coordinator-supplied shared contract,
and applicable project instructions. Inspect the relevant implementation, tests,
build commands, and repository state. If invoked without a run, return a proposed
plan only; do not invent paths or claim a factory run exists.

Find what a worker needs in a clean worktree, since ignored files such as local
environment files and installed dependencies are absent there: install commands,
credentials that must come from the environment, variables that setup, build,
or generation commands require, and services tests start. Compare the local
toolchain with the versions the project and CI declare. When the approach adds
or changes dependencies, plan a check of the lockfile diff and of what reaches
the production install or image. Note the user's standing rules, such as
attribution and writing style, so they reach every worker.

Fill the task's "Run it by hand" section from the project's config files, not
from memory: how to run one test or scenario (check the runner's real filter
syntax), how to start each server for exploration with its working directory,
ports and required variables, the fixture identities or test-session method
for sign-in, variables that offline commands such as code generators still
read, and the names and order of the CI checks expected on the PR head,
including jobs that start only after another finishes, with their count for
the CI wait. For a browser-facing task, also give what exploration scripts
outside the project need: the absolute path to import the project's browser
library from, the variables that move the end-to-end servers off their default
ports, how to get fresh data per scenario (for example restarting a fixture
server), and whether end-to-end scenarios share data across files, which
decides how new scenarios must isolate theirs. Copy each command verbatim
from a CI workflow, package script or project document and name its source.
Mark a command you composed yourself as unverified, so the builder runs it
first and corrects it in the handoff. When a change adds steps to user flows,
such as an extra click before each action, note existing end-to-end tests
that already run close to their timeout on the base, so the builder expects
them.

Check every criterion that depends on what an installed package offers (a
theme, a component, a version feature) against the installed package before
writing it; a criterion the dependency cannot meet becomes a scope question
before approval, not a builder's deviation. When the work starts from material
that is not on the base commit, such as an uncommitted prototype or mockups,
copy it into the run's `reference/` directory and name it in the task as
read-only reference.

Record the blast radius while you read the code: what a merge affects
(components, routes, screens, users), schema and data changes with their
compatibility and rollback, contracts and who consumes them, deploy order and
steps outside the repository, how a failure would show and how to roll back,
and what is deliberately left untouched. When the task adds a production
setting, secret or variable, trace where the deploy path passes it through
(deploy workflow, environment allowlists, compose files) and list each file.
Mark what you verified and what you
inferred. The reviewer checks it against the diff and the PR carries it.

Reuse decisions already made. Ask only about uncertainty that changes what gets
built, the approach, or how success will be judged. Label proposals and
assumptions; do not convert them into user requirements.

## Write a reviewable plan

Fill the task template with:

- The user's original request and any supplied context.
- The resulting behavior, affected components, and chosen approach.
- Explicit acceptance criteria with stable IDs such as AC-1 and AC-2.
- Scope boundaries, constraints, and decisions the user needs to make.
- Setup and environment prerequisites, toolchain differences from CI, and the
  standing rules workers must follow.
- A verification plan connecting each criterion to a test, reproduction, UI
  walkthrough, or other observable evidence. Include regression checks, and
  list the checks CI runs on the PR head (read the workflow files), so
  reviewers can rely on CI for those instead of re-running them.
- Existing tests the task will change, each with its old and new expectation.
- The proposed base ref and known pre-existing failures or setup needs.
- The "Run it by hand" commands and the blast radius described above.

Find the existing tests the task intentionally contradicts. For each behavior
the task changes, such as an error code, a validation rule, a response shape,
or what the UI shows, search the tests for assertions of the old behavior and
list each one in the task: the test, what it asserts today, what it will assert,
and why. This is a deliberate change, not a weakened test; listing it lets the
user approve it and lets the reviewer check exactly these. Also look for
conflicts inside the plan itself, such as "existing codes unchanged" next to a
new code that replaces one for some inputs. Include side effects that change
what tests observe without changing a rule: new background requests, timers
or polling break tests that count requests or assert that none happen, and a
new element in the page changes tab order and element counts. Write "none
found" when the search finds nothing.

For a change users see in a browser, plan an end-to-end check in a real
browser, headless is fine, that drives the running application through each
user-facing criterion. Component tests in a simulated DOM do not replace it:
they cannot show focus, layout, navigation, or a real sign-in. Decide how the
check signs in without the user, for example a fixture identity provider or a
test session against a disposable database, and whether it becomes a committed
test that CI runs. The builder writes and runs that
check; the reviewer re-runs it and also explores the application independently.
Planning runs nothing. If no browser can run here, or sign-in cannot be automated,
say so before approval and make skipping it an explicit proposal for the user,
never a silent limit.

Keep the review summary to one screen when practical. Do not require approval
of routine file-by-file edits. For a bug, plan a concrete reproduction before
the fix; for a feature, define observable success. Do not force a failing test
where a screenshot, manual check, or another form of evidence is more appropriate.

## Obtain approval once

The approved file is hashed, so it cannot hold open questions. Record what the
user already decided separately from your own recommendations, and write each
recommendation as a numbered proposal (D-1, D-2) that is accepted if the plan
is approved as written. Present those proposals as the decisions to make. If
the user changes one, edit the task before recording approval.

Present the completed plan and acceptance criteria. Wait for an explicit answer.
You may ask for publication authority in the same question: it is recorded in
status, not in `task.md`, so answering it does not change the hashed file.
If the user has already explicitly approved this concrete plan in the current
session, preserve that approval instead of requesting it again.
The coordinator records that answer and the hash of the approved `task.md`.
Repository inspection and writing task records are allowed during planning;
product edits, dependency installation, worktree creation, and builds wait for
approval under this workflow.

Freeze the approved intent for workers. Routine implementation adjustments stay
within it. For a material change, retain the previous task version, revise the
plan, and obtain renewed approval. In-scope repairs need no new planning ceremony.
