# Coding standards

- Follow project instructions and established architecture. Read relevant code
  before choosing patterns or adding dependencies.
- Implement approved scope. Surface adjacent improvements as follow-up work.
- Prefer clear names, explicit failure handling, and small cohesive changes.
  Avoid abstractions justified only by hypothetical future use.
- Respect existing API, data, authorization, and transaction contracts. Discuss
  incompatible changes and migrations before implementing beyond approved scope.
- Keep credentials and local runtime records out of commits, handoffs, and public
  PR evidence. Use existing project configuration conventions.
- Add meaningful regression/behavior tests when the change has an executable
  contract. Avoid tests that merely mirror implementation or ceremonial tests
  for trivial presentation changes.
- Do not weaken tests, checks, or acceptance criteria to make results pass.
  Explain intentional behavior changes and retain original failure evidence.
- Change an existing test's expectation only when the task's "Existing tests
  this task changes" section lists it. If another existing test conflicts with
  the approved behavior, make the smallest change, and list it in the handoff
  as a decision beyond the plan with its old and new expectation.
- Reuse project formatters and validation commands. Change lockfiles only when
  required, using the project's package manager.
- After adding or changing a dependency, read the lockfile diff for unrelated
  version changes and removals, and check that development tooling did not
  enter the production install or image, for example through an optional peer.
  Report what you found as a decision for the reviewer.
- Update documentation when behavior requires it. Keep implementation detail out
  of product flows unless it helps users.
- Inspect the final diff for unrelated edits, generated artifacts, and temporary
  debugging changes. Record verification limits rather than claiming certainty.
- Use clear commit messages without agent attribution or automatic co-authors.
