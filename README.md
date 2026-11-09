# My Agentic Context

My shared context for AI agents: reusable skills, global instructions, and two
independent installers for Claude Code and Codex. This repo is a home for the
preferences and workflows I want agents to carry between projects.

- [`skills/`](skills/): skills for specific tasks and workflows.
- [`global/AGENTS.md`](global/AGENTS.md): personal instructions shared across projects.
- [`bin/`](bin/): installation scripts for skills, instructions, and provider symlinks.

## Installing skills

Install all skills into `~/.agents/skills`:

```sh
npx --package=github:iPior/my-agent-context install-skills --all
```

Or install specific skills by name:

```sh
npx --package=github:iPior/my-agent-context install-skills blog-writer project-spec-writer
```

List available skills without installing anything:

```sh
npx --package=github:iPior/my-agent-context install-skills --list
```

## Installing AGENTS.md

Install only the global instructions, without installing skills:

```sh
npx --package=github:iPior/my-agent-context install-agent-context
```

This copies `global/AGENTS.md` to `~/.agents/AGENTS.md` and asks which providers
to link. This command only installs instructions; skill installation is handled
by the separate `install-skills` command.

It creates symlinks for the providers you select:

| Provider | Symlink | Target |
| --- | --- | --- |
| Claude Code | `~/.claude/CLAUDE.md` | `~/.agents/AGENTS.md` |
| Codex | `~/.codex/AGENTS.md` | `~/.agents/AGENTS.md` |

For a non-interactive install, select providers explicitly:

```sh
npx --package=github:iPior/my-agent-context install-agent-context --claude --codex
```

Use `--no-providers` to install the shared file without changing
provider links.

The installed copy stays available even if the repo or an `npx` cache is removed.
Existing files or different symlinks are preserved as `.backup`, `.backup.1`, etc.
Identical installed content and correct links are left alone on repeat runs.

## Available skills

### Factory workflow (explicit opt-in)

The factory skills let the main chat coordinate a task through an approved plan,
an isolated build, a fresh independent review, bounded repair rounds, and a PR.
The user retains merge authority. Ordinary coding requests do not start this
workflow, and the global instructions are unchanged.

| Skill | Responsibility |
| --- | --- |
| [factory-workflow](skills/factory-workflow/) | Coordinate stages, dispatch workers, record status, and resume interrupted runs |
| [factory-plan](skills/factory-plan/) | Inspect the project and agree on scope and acceptance criteria |
| [factory-build](skills/factory-build/) | Implement or repair, follow coding standards, verify, and save evidence |
| [factory-review](skills/factory-review/) | Independently evaluate the pinned candidate against approved intent |
| [factory-ship](skills/factory-ship/) | Publish the reviewed candidate, monitor CI, and return failures |

Install all five together using the existing installer:

```sh
npx --package=github:iPior/my-agent-context install-skills factory-workflow factory-plan factory-build factory-review factory-ship
```

After installing, explicitly request `factory-workflow` in your harness, for
example: "Use factory-workflow to add recipe importing to this repository. Work
with me on the plan first, then prepare a draft PR." Use your harness's explicit
skill syntax when available. Confirm it can discover the installed skills; the
installer copies them to `~/.agents/skills` and does not configure provider skill
discovery or delegation permissions.

The main chat remains the coordinator. It loads the scoped
[coordinator contract](skills/factory-workflow/references/coordinator.md), passes
actual skill/contract paths to workers, and keeps runtime records under
`~/.pior-factory-runs/<repo-key>/<task-id>/`. Disposable worktrees live separately
under that root's `.worktrees/` directory. Records survive removing a worktree.
Templates, a dependency-free Node.js/Git status helper, and the
[handoff/resume contract](skills/factory-workflow/references/run-contract.md) ship
inside `factory-workflow` and are copied by the existing installer.

Start with native subagents in one supported harness. Verify independent reviewer
context and access to both worktree and run directory before dispatch. If a
capability is missing, stop for an explicit manual handoff rather than claiming
the automated step ran. Three automatic repair rounds are allowed across review
and CI combined. Every code repair returns through verification and fresh review.

These skills provide a session-driven workflow, not an always-running controller:
no daemon, automatic CI wake-up, tmux/Herdr management, or cross-provider adapter
is included. Tmux can preserve a process, but after an exit the next coordinator
must reconcile saved records with live Git and PR state. No runtime run data
belongs in this repository or the target project's commits.

Run the local helper and packaging checks with `npm test`. This does not call a
model, contact GitHub, install skills in your real home, or change provider config.

### [project-spec-writer](skills/project-spec-writer/)

A skill that turns a description of a software project into a clean, structured portfolio spec written in the author's own voice. It runs a short interview to pull out the concrete specifics and the author's framing, then drafts a write-up under a fixed set of sections - Overview, What I Built, How It Works, and Technical Highlights.

The output is aimed at recruiters, clients, and other engineers: practical and technical, describing what was built and how, without marketing filler or reflective fluff.

Trigger it with requests like "write a spec for my X project", "help me write this up for my portfolio", or by pasting details about something you built and asking for a structured write-up.

### [in-progress-project-spec-writer](skills/in-progress-project-spec-writer/)

Captures an in-progress project for my personal site without starting the write-up.
It gathers relevant repository context, asks for missing metadata, and produces
only MDX frontmatter: project details, confirmed stack and links, current focus,
and milestones. There are no prose sections or placeholder body content.

Trigger it with requests like "capture this repo as an in-progress project" or
"fill out the project frontmatter without writing the spec yet".

### [blog-writer](skills/blog-writer/)

The companion to `project-spec-writer`. Where the spec is the terse technical summary, this skill writes the longer, first-person, narrative blog post for the author's personal site - telling the story behind a build: why it happened, what was hard, what got learned, and what he'd do differently. It outputs a finished `.mdx` file with a strict frontmatter contract and a default section skeleton (Overview, Goals, Technologies Used, Backstory, What I Learned, What I Would Do Differently).

If a project spec already exists, the skill reads it for the *what/how* and aims its interview at the reflective *why/story* the spec leaves out. It also handles standalone blog posts on other topics.

Trigger it with requests like "write a blog post about my X project", "turn this into a blog", or "I want to write up the story behind this build".
