# Factory task

## Original request

{{USER_REQUEST}}

## Outcome and approach

{{BEHAVIOR_COMPONENTS_APPROACH}}

## Acceptance criteria

- AC-1: {{OBSERVABLE_SUCCESS}}

## Scope and constraints

{{IN_SCOPE_OUT_OF_SCOPE_CONSTRAINTS}}

## Setup and environment

Commands and prerequisites a worker needs in a clean worktree: installs,
credentials supplied through the environment, variables a command needs even
when it does not connect, and local toolchain versions that differ from CI.

{{SETUP_PREREQUISITES_AND_TOOLCHAIN_DIFFERENCES_OR_NONE}}

## Verification plan

| Criterion | Baseline/reproduction | After-change evidence | Regression checks |
| --- | --- | --- | --- |
| AC-1 | {{BASELINE}} | {{PROOF}} | {{REGRESSION}} |

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

{{USER_AUTHORIZATION_TO_PUSH_AND_OPEN_PR_OR_NOT_YET_AUTHORIZED}}

Approval is recorded separately against the SHA-256 of this completed file.
