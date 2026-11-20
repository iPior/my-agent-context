# Factory task

## Original request

{{USER_REQUEST}}

## Outcome and approach

{{BEHAVIOR_COMPONENTS_APPROACH}}

## Acceptance criteria

- AC-1: {{OBSERVABLE_SUCCESS}}

## Scope and constraints

{{IN_SCOPE_OUT_OF_SCOPE_CONSTRAINTS}}

## Existing tests this task changes

Tests whose current assertions the approved behavior makes wrong. Each entry
names the test, what it asserts today, what it will assert, and the criterion
that requires the change. Builders change only these; reviewers check them.

{{CHANGED_TEST_EXPECTATIONS_OR_NONE_FOUND}}

## Setup and environment

Commands and prerequisites a worker needs in a clean worktree: installs,
credentials supplied through the environment, variables a command needs even
when it does not connect, and local toolchain versions that differ from CI.

{{SETUP_PREREQUISITES_AND_TOOLCHAIN_DIFFERENCES_OR_NONE}}

## Run it by hand

Exact commands a builder or reviewer needs outside the full suite, checked
against the project's config files rather than guessed.

- Run one test or scenario: {{TARGETED_TEST_COMMANDS_AND_FILTER_SYNTAX}}
- Start the application for exploration: {{SERVER_COMMANDS_CWD_PORTS_AND_REQUIRED_ENV}}
- Sign in without the user: {{FIXTURE_IDENTITIES_OR_TEST_SESSION_METHOD_OR_NOT_APPLICABLE}}
- Offline commands that still need variables: {{PLACEHOLDER_VARIABLES_OR_NONE}}
- CI checks to expect on the PR head, including ones that start late: {{CHECK_NAMES_AND_ORDER}}

## Verification plan

| Criterion | Baseline/reproduction | After-change evidence | Regression checks |
| --- | --- | --- | --- |
| AC-1 | {{BASELINE}} | {{PROOF}} | {{REGRESSION}} |

Checks CI runs on the PR head (reviewers rely on these instead of re-running
them; see the coordinator's "Pace the run"):

{{CI_CHECKS_OR_NO_CI}}

Real-browser check for user-facing criteria (how the application is started,
how sign-in is automated, who runs it), or the user's recorded waiver:

{{BROWSER_CHECK_PLAN_OR_NOT_USER_FACING_OR_USER_WAIVER}}

## Blast radius

What a merge of this task can affect. The plan records it while reading the
code, the reviewer checks it against the diff, and the shipper carries it into
the PR.

- Affected: {{COMPONENTS_ROUTES_SCREENS_AND_USERS}}
- Data and schema: {{MIGRATIONS_COMPATIBILITY_AND_ROLLBACK_OR_NONE}}
- Contracts and consumers: {{API_EVENTS_CONFIG_AND_WHO_DEPENDS_ON_THEM_OR_NONE}}
- Deploy order: {{ORDER_AND_STEPS_OUTSIDE_THIS_REPOSITORY_OR_NONE}}
- If it goes wrong: {{FAILURE_SIGNALS_WORST_CASE_ROLLBACK}}
- Not affected: {{AREAS_DELIBERATELY_LEFT_UNTOUCHED}}

## Decisions and assumptions

Decided by the user:

{{USER_DECISIONS_OR_NONE}}

Proposals accepted when this plan is approved as written (IDs D-1, D-2, ...).
Edit these before approval if the user changes one:

{{NUMBERED_PROPOSALS_OR_NONE}}

## Standing rules for workers

User and project rules every worker must follow, such as attribution, writing
style, and data handling. They take precedence over defaults a harness injects.

{{STANDING_RULES_OR_NONE}}

## Publication request

Publication authority is recorded in status (`publication_authorized` and
`publication_note`), not here, so it can be asked with plan approval or later
without changing this hashed file. Write what the user intends, if known, for
example "draft PR wanted"; it is not authorization by itself.

{{INTENDED_PUBLICATION_OR_NOT_DISCUSSED}}

Approval is recorded separately against the SHA-256 of this completed file.
