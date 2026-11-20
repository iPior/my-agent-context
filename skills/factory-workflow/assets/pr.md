<!--
Factory PR body. The shipper fills it from the approved task, the latest
reviewed handoffs and the coordinator's ledger. Keep every section; write
"None" rather than deleting one. Publish no local paths, run-directory paths,
raw logs, secrets or household data. The repository's own PR template, when
present, wins on structure: carry these sections inside it.
-->

## Summary

{{WHAT_CHANGES_FOR_USERS_IN_TWO_OR_THREE_LINES}}

## Blast radius

What this merge can affect, and what happens if it goes wrong. The reviewer
checked these claims against the diff.

- **Affected:** {{COMPONENTS_ROUTES_SCREENS_AND_WHO_SEES_THE_CHANGE}}
- **Data and schema:** {{MIGRATIONS_ADDITIVE_OR_DESTRUCTIVE_OLD_IMAGE_COMPATIBILITY_ROLLBACK_OR_NONE}}
- **Contracts:** {{API_SHAPE_ERROR_CODES_EVENTS_CONFIG_AND_THEIR_CONSUMERS_OR_NONE}}
- **Deploy order:** {{REQUIRED_ORDER_AND_STEPS_OUTSIDE_THIS_REPOSITORY_OR_NONE}}
- **If it goes wrong:** {{HOW_A_FAILURE_WOULD_SHOW_WORST_CASE_AND_ROLLBACK_STEPS}}
- **Not affected:** {{AREAS_CHECKED_AND_LEFT_UNTOUCHED}}

## Behavior

{{DETAILED_BEHAVIOR_CHANGES}}

## Verification

| Criterion | Evidence |
| --- | --- |
| {{AC_ID}} | {{TEST_OR_BROWSER_CHECK_THAT_PROVES_IT}} |

- **CI on this head:** {{CHECKS_AND_STATES_OR_PENDING}}
- **Real browser:** {{WHAT_THE_BUILDER_AND_REVIEWER_EXERCISED_OR_WAIVER}}
- **Existing tests changed:** {{EACH_CHANGED_EXPECTATION_AND_WHY_OR_NONE}}

## Limits

{{WHAT_WAS_NOT_TESTED_OR_NOT_APPLIED}}

## Follow-ups

{{DEFERRED_FINDINGS_EACH_WITH_ITS_REASON_OR_NONE}}

## Factory run

- **Stages:** {{STAGE_MODEL_AND_OUTCOME_PER_DISPATCH}}
- **Repair rounds:** {{REVIEW_AND_CI_REPAIRS_USED_OF_LIMITS}}
- **Cost:** {{TOKENS_AND_TIME_PER_STAGE_AND_TOTAL_OR_NOT_REPORTED}}
- **Cost per finding:** {{ATTEMPTS_AND_COST_PER_FINDING_LINEAGE_OR_NONE}}
