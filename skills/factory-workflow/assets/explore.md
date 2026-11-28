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
- Before reading focus, computed style or the accessibility tree, wait for
  the page to settle: one timer turn plus any running transitions. Keep that
  wait in one shared helper (for example `settle()`); reads taken mid-change
  give false failures.
- Importing the browser library by absolute path from an `.mjs` script can
  return a CommonJS module whose API sits under `default`; unwrap it once,
  for example `const mod = await import(path); const pw = mod.default ?? mod`.
- For before/after screenshot comparisons, emulate reduced motion (for
  example Playwright's `reducedMotion: 'reduce'`) so animated backgrounds or
  entrance animations do not make unchanged pages differ.
- Scripts here are run records, not project code. Never copy them into the
  project's commits.

## Scenarios

none yet
