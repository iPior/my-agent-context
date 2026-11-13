# Build handoff

- Run: {{RUN_ID}}
- Role: builder
- Timestamp: {{ISO_TIMESTAMP}}
- Approved task SHA-256: {{TASK_DIGEST}}
- Base SHA: {{FULL_BASE_SHA}}
- Candidate SHA: {{FULL_CANDIDATE_SHA_OR_BLOCKED}}
- Worktree / branch: {{PATH_AND_BRANCH}}
- Outcome: {{IMPLEMENTED_OR_BLOCKED}}

## Changes and decisions

{{FACTUAL_SUMMARY}}

## Acceptance evidence

| Criterion | Before | After | Evidence path / command / exit result |
| --- | --- | --- | --- |
| AC-1 | {{BEFORE}} | {{AFTER}} | {{EVIDENCE}} |

## Findings addressed

{{FINDING_IDS_FIXES_OR_EVIDENCE_BASED_DISAGREEMENTS}}

## Verification limits and remaining concerns

{{SKIPPED_CHECKS_PREEXISTING_FAILURES_BLOCKERS_OR_NONE}}
