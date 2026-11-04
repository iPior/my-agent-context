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
