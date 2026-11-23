# Exploration scripts

Shared by every worker in this run. Reviewers and builders keep reusable
browser and API probes here, instead of in a per-dispatch scratch directory,
so the next round starts from the last one's scripts rather than rewriting them.

- Keep one script per family of scenarios, and a runner that starts fresh
  servers (and so fresh data) per scenario with the workflow's server helper.
- Take ports, sign-in and how to import the project's browser library from the
  task's "Run it by hand" section. Never hard-code a worker's scratch paths;
  pass the evidence prefix and server state directory as arguments.
- When you add or change a scenario, list it below with the round that added
  it. Never delete another worker's scenario; mark it obsolete instead.
- Scripts here are run records, not project code. Never copy them into the
  project's commits.

## Scenarios

none yet
