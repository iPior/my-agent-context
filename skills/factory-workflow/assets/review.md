# Independent review handoff

- Run: {{RUN_ID}}
- Role: reviewer
- Timestamp: {{ISO_TIMESTAMP}}
- Approved task SHA-256: {{TASK_DIGEST}}
- Base SHA: {{FULL_BASE_SHA}}
- Reviewed SHA: {{FULL_CANDIDATE_SHA}}
- Context: {{HOW_INDEPENDENT_CONTEXT_WAS_ESTABLISHED}}
- Verdict: {{pass_OR_changes_requested_OR_blocked}}

## Acceptance coverage and checks

{{CRITERION_BY_CRITERION_ASSESSMENT_AND_INDEPENDENT_CHECKS}}

## Findings

For each finding: ID, severity, file/line, observed behavior, reproduction or
supporting reasoning, expected behavior, acceptance IDs, and whether it blocks.
State explicitly when there are no findings.

{{ACTIONABLE_FINDINGS_OR_NONE}}

## Prior findings

{{RESOLVED_RECURRING_OR_NOT_APPLICABLE}}

## Limitations and decisions needed

{{UNCERTAINTY_MISSING_EVIDENCE_CRITICAL_DECISIONS_OR_NONE}}
