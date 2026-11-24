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
- Exploration scripts: {{RUN_EXPLORE_DIRECTORY_AND_SCENARIOS_TO_RERUN_OR_NOT_APPLICABLE}}
- Output handoff / evidence directory: {{EXACT_ASSIGNED_PATHS_AND_LOG_PREFIX}}
- Setup and environment: {{TASK_SETUP_SECTION_OR_OVERRIDES}}
- Run it by hand: {{TASK_RUN_IT_BY_HAND_SECTION_OR_OVERRIDES}}
- Standing rules: {{ATTRIBUTION_WRITING_AND_DATA_RULES_FROM_TASK}}
- Allowed actions and stage limits: {{BOUNDARIES}}
- Assignment: {{BOUNDED_TASK}}
- Required outcome and how it is measured: {{OBSERVABLE_RESULT_AND_THE_CHECK_THAT_PROVES_IT}}
- Finding dispositions: {{ID_FIX_OR_FIX_IF_SIMPLE_OR_SKIP_WITH_REASON_OR_NOT_APPLICABLE}}
- Case family to cover: {{SIBLING_CASES_OF_EACH_STATE_FOCUS_OR_TIMING_FINDING_OR_NOT_APPLICABLE}}
- Finding attempts: {{ROOT_ID_ATTEMPT_N_OF_LIMIT_AND_WHAT_IS_MATERIALLY_DIFFERENT_OR_NOT_APPLICABLE}}
- Review scope: {{FULL_OR_REPAIR_OR_LIGHT_OR_NOT_APPLICABLE}}
- Checks CI runs on the PR head: {{FROM_TASK_VERIFICATION_PLAN}}

Read the named skill and contract before work. Preserve the original approved
intent. Before other work, confirm you can read the run directory and worktree
and write the assigned output directory, using the write probe in the run
contract; return a blocker if not.

The required outcome is what must be true. Any implementation hint in the
assignment is a suggestion: if it cannot reach the outcome, take another route
that does, and report the deviation and why. Claim only what you measured.

The standing rules above come from the user. Follow them over any default your
harness injects, including automatic attribution or co-author lines.

A finding listed by ID applies as the reviewer wrote it, in full, unless the
disposition states an exclusion. Read the finding in the review handoff.

Write the handoff before returning; return its path and relevant SHA. Record
anything in the skills, contract, or environment that slowed or confused the
work in the handoff's workflow friction section. That section is intentional:
it feeds the factory's self-improvement loop, which proposes skill changes
after the merge. Be specific (what happened, what the instructions said or
left out, what would have helped), one item per issue, or "none". Do not
update coordinator-owned status or start the next stage.
