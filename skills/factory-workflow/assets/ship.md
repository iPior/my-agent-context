# Shipping handoff

- Run: {{RUN_ID}}
- Role: shipper
- Timestamp: {{ISO_TIMESTAMP}}
- Approved task SHA-256: {{TASK_DIGEST}}
- Reviewed / published head SHA: {{FULL_SHA}}
- PR URL and target branch: {{URL_AND_BASE_OR_UNPUBLISHED}}
- Publication authority: {{RECORDED_USER_INSTRUCTION}}
- Verdict: {{ready_for_human_OR_waiting_ci_OR_code_failure_OR_blocked}}

## PR summary and verification

{{CONCRETE_CHANGE_AND_RELEVANT_EVIDENCE}}

## CI at the recorded head

| Check | State | Run/head identity | Link or evidence |
| --- | --- | --- | --- |
| {{CHECK}} | {{STATE}} | {{IDENTITY}} | {{EVIDENCE}} |

## Failures or remaining decisions

{{CODE_VS_INFRA_FAILURE_DETAILS_PENDING_CHECKS_OR_NONE}}

The user retains merge authority. This handoff does not imply ongoing monitoring.
