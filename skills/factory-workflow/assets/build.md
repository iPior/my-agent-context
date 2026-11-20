# Build handoff

- Run: {{RUN_ID}}
- Role: builder
- Round: {{ROUND_NUMBER_AND_INITIAL_OR_REPAIR}}
- Timestamp: {{ISO_TIMESTAMP}}
- Approved task SHA-256: {{TASK_DIGEST}}
- Base SHA: {{FULL_BASE_SHA}}
- Previous candidate SHA: {{FULL_SHA_OR_NOT_APPLICABLE}}
- Candidate SHA: {{FULL_CANDIDATE_SHA_OR_BLOCKED}}
- Worktree / branch: {{PATH_AND_BRANCH}}
- Outcome: {{IMPLEMENTED_OR_BLOCKED}}

## Changes

{{FACTUAL_SUMMARY}}

## Decisions beyond the approved plan

Choices the plan did not make, for the reviewer to check. Include dependency,
lockfile, and production-footprint effects.

{{DECISIONS_WITH_REASONS_OR_NONE}}

## Deviations from the dispatch

Where the dispatch's suggested implementation could not reach its required
outcome, what you did instead and why. For a repeated finding, what is
materially different from the earlier attempt.

{{DEVIATIONS_OR_NONE}}

## Acceptance evidence

Final verification ran on the committed candidate; each log starts with the
commit it ran against. Report only measured results; write "not measured"
rather than inferring. List the saved failing (red) runs.

| Criterion | Before | After | Evidence path / command / exit result |
| --- | --- | --- | --- |
| AC-1 | {{BEFORE}} | {{AFTER}} | {{EVIDENCE}} |

## Findings addressed

{{FINDING_IDS_REPRODUCTION_FIXES_OR_EVIDENCE_BASED_DISAGREEMENTS}}

## Verification limits and remaining concerns

{{SKIPPED_CHECKS_PREEXISTING_FAILURES_BLOCKERS_OR_NONE}}

## Workflow friction

{{SKILL_CONTRACT_OR_ENVIRONMENT_FRICTION_OR_NONE}}
