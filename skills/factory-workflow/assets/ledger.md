# Factory run ledger

Coordinator-owned. Add a dispatch row when each worker returns, and keep the
findings table current at every triage. The final report and the PR's factory
section are built from this file. Use "not reported" when the harness gives no
token or time figures; never estimate them.

## Dispatches

| Dispatch | Stage | Round | Model and effort | Tokens | Duration | Result | Findings worked |
| --- | --- | --- | --- | --- | --- | --- | --- |

## Findings

One row per finding lineage. A recurrence or partial fix keeps the root ID
and lists the later IDs under "Seen as". Attempts count repair dispatches that
targeted the lineage; the cost is the sum of those dispatches and their
re-reviews.

| Root ID | Seen as | Blocking | Summary | Attempts | Approach per attempt | Cost | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
