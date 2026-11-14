# Independent review handoff

- Run: {{RUN_ID}}
- Role: reviewer
- Timestamp: {{ISO_TIMESTAMP}}
- Approved task SHA-256: {{TASK_DIGEST}}
- Base SHA: {{FULL_BASE_SHA}}
- Previous reviewed SHA: {{FULL_SHA_OR_NOT_APPLICABLE}}
- Reviewed SHA: {{FULL_CANDIDATE_SHA}}
- Review scope: {{FULL_CANDIDATE_OR_REPAIR_DIFF_PLUS_REGRESSIONS}}
- Context: {{HOW_INDEPENDENT_CONTEXT_WAS_ESTABLISHED}}
- Verdict: {{pass_OR_changes_requested_OR_blocked}}

## Summary

{{VERDICT_RATIONALE_IN_A_FEW_SENTENCES}}

## Acceptance coverage and checks

{{CRITERION_BY_CRITERION_ASSESSMENT_AND_INDEPENDENT_CHECKS}}

## Findings

For each finding: ID, severity, blocking or nonblocking, file/line, observed
behavior, reproduction or supporting reasoning, expected behavior, and
acceptance IDs. Quote the source line when a finding depends on a library's
version-specific behavior. State explicitly when there are no findings.

{{ACTIONABLE_FINDINGS_OR_NONE}}

## Prior findings

{{RESOLVED_RECURRING_OR_NOT_APPLICABLE}}

## Limitations and decisions needed

{{UNCERTAINTY_MISSING_EVIDENCE_CRITICAL_DECISIONS_OR_NONE}}

## Workflow friction

{{SKILL_CONTRACT_OR_ENVIRONMENT_FRICTION_OR_NONE}}
