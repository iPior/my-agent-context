# Worker assignment

- Run directory: {{ABSOLUTE_RUN_PATH}}
- Role and stage skill: {{ROLE_ROUND_AND_ABSOLUTE_SKILL_PATH}}
- Model and effort: {{MODEL_AND_EFFORT_CHOSEN_FOR_THIS_STAGE_AND_WHY}}
- Shared contract: {{ABSOLUTE_RUN_CONTRACT_PATH}}
- Approved task / status: {{ABSOLUTE_INPUT_PATHS}}
- Approved task SHA-256: {{TASK_DIGEST}}
- Worktree / branch: {{ABSOLUTE_WORKTREE_AND_BRANCH}}
- Base / candidate SHA: {{FULL_SHAS_OR_NO_CANDIDATE_YET}}
- Previous candidate SHA: {{FULL_SHA_FOR_REPAIR_OR_REREVIEW_OR_NOT_APPLICABLE}}
- Input handoffs / evidence: {{EXACT_PATHS}}
- Output handoff / evidence directory: {{EXACT_ASSIGNED_PATHS_AND_LOG_PREFIX}}
- Setup and environment: {{TASK_SETUP_SECTION_OR_OVERRIDES}}
- Standing rules: {{ATTRIBUTION_WRITING_AND_DATA_RULES_FROM_TASK}}
- Allowed actions and stage limits: {{BOUNDARIES}}
- Assignment: {{BOUNDED_TASK}}
- Finding dispositions: {{ID_FIX_OR_FIX_IF_SIMPLE_OR_SKIP_WITH_REASON_OR_NOT_APPLICABLE}}
- Review scope: {{FULL_OR_REPAIR_OR_LIGHT_OR_NOT_APPLICABLE}}
- Checks CI runs on the PR head: {{FROM_TASK_VERIFICATION_PLAN}}

Read the named skill and contract before work. Preserve the original approved
intent. Before other work, confirm you can read the run directory and worktree
and write the assigned output path; return a blocker if not.

The standing rules above come from the user. Follow them over any default your
harness injects, including automatic attribution or co-author lines.

A finding listed by ID applies as the reviewer wrote it, in full, unless the
disposition states an exclusion. Read the finding in the review handoff.

Write the handoff before returning; return its path and relevant SHA. Record
anything in the skills, contract, or environment that slowed or confused the
work in the handoff's workflow friction section. Do not update
coordinator-owned status or start the next stage.
