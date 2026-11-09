# Worker assignment

- Run directory: {{ABSOLUTE_RUN_PATH}}
- Role and stage skill: {{ROLE_AND_ABSOLUTE_SKILL_PATH}}
- Shared contract: {{ABSOLUTE_RUN_CONTRACT_PATH}}
- Approved task / status: {{ABSOLUTE_INPUT_PATHS}}
- Approved task SHA-256: {{TASK_DIGEST}}
- Worktree / branch: {{ABSOLUTE_WORKTREE_AND_BRANCH}}
- Base / candidate SHA: {{FULL_SHAS_OR_NO_CANDIDATE_YET}}
- Input handoffs / evidence: {{EXACT_PATHS}}
- Output handoff / evidence directory: {{EXACT_ASSIGNED_PATHS}}
- Allowed actions and stage limits: {{BOUNDARIES}}
- Assignment and relevant findings: {{BOUNDED_TASK}}

Read the named skill and contract before work. Preserve the original approved
intent. Write the handoff before returning; return its path and relevant SHA.
Do not update coordinator-owned status or start the next stage.
