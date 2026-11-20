# Shipping handoff

- Run: {{RUN_ID}}
- Role: shipper
- Timestamp: {{ISO_TIMESTAMP}}
- Approved task SHA-256: {{TASK_DIGEST}}
- Base SHA and target branch: {{FULL_BASE_SHA_AND_BRANCH}}
- Reviewed / published head SHA: {{FULL_SHA}}
- PR URL and state: {{URL_AND_DRAFT_OR_READY_OR_UNPUBLISHED}}
- Publication authority: {{RECORDED_USER_INSTRUCTION}}
- Verdict: {{ready_for_human_OR_waiting_ci_OR_code_failure_OR_blocked}}

## Preconditions checked

{{CLEAN_WORKTREE_HEAD_EQUALS_REVIEWED_SHA_TASK_DIGEST_REMOTE_STATE}}

## PR body

Built from the PR template; confirm each section is present and current,
including the blast radius and the factory run figures.

{{SECTIONS_WRITTEN_OR_REFRESHED_AND_BODY_REREAD}}

## CI at the recorded head

Required checks configured: {{YES_NO_OR_UNKNOWN}}

| Check | State | Run/head identity | Link or evidence |
| --- | --- | --- | --- |
| {{CHECK}} | {{STATE}} | {{IDENTITY}} | {{EVIDENCE}} |

## Failures or remaining decisions

{{CODE_VS_INFRA_FAILURE_DETAILS_PENDING_CHECKS_OR_NONE}}

## Workflow friction

{{SKILL_CONTRACT_OR_ENVIRONMENT_FRICTION_OR_NONE}}

The user retains merge authority. This handoff does not imply ongoing monitoring.
