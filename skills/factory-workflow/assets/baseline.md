# Baseline

- Run: {{RUN_ID}}
- Role: builder
- Timestamp: {{ISO_TIMESTAMP}}
- Base SHA: {{FULL_BASE_SHA}}
- Worktree / branch: {{PATH_AND_BRANCH}}
- Toolchain: {{LOCAL_VERSIONS_AND_DIFFERENCES_FROM_PROJECT_OR_CI}}

## Setup

{{COMMANDS_RUN_AND_PREREQUISITES_DISCOVERED}}

## Checks on the base commit

| Command | Exit result | Evidence path |
| --- | --- | --- |
| {{COMMAND}} | {{RESULT}} | {{EVIDENCE}} |

## Existing failures

{{PREEXISTING_FAILURES_OR_NONE}}

## Behavior before the change

{{REPRODUCTION_OR_CURRENT_BEHAVIOR_PER_CRITERION}}
