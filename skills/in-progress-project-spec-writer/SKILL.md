---
name: in-progress-project-spec-writer
description: Gather repository context and create frontmatter-only MDX entries for in-progress projects on the user's personal website. Use when the user wants to capture a project for their portfolio, prepare a currently-building entry, or fill project metadata without starting the write-up. For a full project spec with prose, use project-spec-writer instead.
---

# In-Progress Project Spec Writer

Capture an unfinished project's important metadata for the author's personal site
without drafting its write-up. The deliverable is an MDX entry containing only
YAML frontmatter. The description and current focus are metadata, not a prose
body. Do not add section headings, placeholders, TODOs, comments, or a narrative
after the closing delimiter.

## Gather context before asking

Read the supplied project context and inspect the relevant repository when
available. Focus on its README, package manifests, existing project metadata,
and the implementation needed to verify its purpose and stack. Use the repository
remote to establish `githubUrl` when appropriate; convert a Git SSH remote to a
valid HTTPS URL. Do not infer a live deployment from a development-server URL.

Reuse confirmed information instead of asking the user to repeat it. Treat plans
as plans, not completed features. A dependency's presence alone does not prove
the project uses it. Do not copy secrets or internal URLs into public metadata.

Ask for missing required details in small batches. Useful questions include:

- What is the project called, what problem does it solve, and who is it for?
- Is this personal, freelance, or work, and when did you start it?
- What are you working on right now, and when did you last make real progress?
- What are the milestones from start to done, in order, and which are finished?

Milestones and current focus must come from the user or explicit project context
they supplied, such as an existing roadmap. Ask if completion status is unclear.
Do not invent a roadmap, infer completion from file names, or substitute today's
date for an unknown start date or last-progress date. Resolve relative dates
against the conversation date; ask when a date is too vague for `YYYY-MM-DD`.

Gather only what is needed for the frontmatter. Skip the full spec's interview
about technical highlights, architecture narratives, and personal reflections.
Stop asking once the required metadata is established. Omit unknown optional
fields; do not block delivery to collect every optional value.

## Frontmatter contract

Use the site's project schema below. This contract is self-contained so the
skill can be installed on its own.

| Field | Type | Requirement |
| --- | --- | --- |
| `title` | string | Required. Quote the project name. |
| `date` | date | Required. Project start date as `YYYY-MM-DD`. |
| `category` | enum | Required. Exactly `freelance`, `work`, or `personal`. |
| `description` | string | Required. Quote a concise, practical project-card summary. Describe its purpose without implying unfinished work has shipped. |
| `stack` | string array | Optional. Only confirmed technologies. |
| `thumbnail` | string | Optional. Only a known image path. |
| `liveUrl` | URL string | Optional. A known, valid absolute public URL. |
| `githubUrl` | URL string | Optional. A known, valid absolute repository URL. |
| `blogSlug` | string | Optional. Only a known related blog slug. |
| `featured` | boolean | Required for this workflow. Always `false`. |
| `hidden` | boolean | Emit explicitly. Defaults to `false`; use `true` when requested. |
| `depth` | enum | Optional. `full` or `short`; omit unless specified. |
| `status` | enum | Required for this workflow. Always `"in-progress"`. |
| `progress` | object | Required. Contains the fields below. |
| `progress.focus` | string | Required. Quoted sentence describing the current work, shown after "Now:". |
| `progress.updated` | date | Required. Last real progress date as `YYYY-MM-DD`. The site marks projects paused after 30 days without an update. |
| `progress.milestones` | array | Required. At least one milestone, in intended completion order. |
| `progress.milestones[].label` | string | Required. Short, quoted noun phrase. |
| `progress.milestones[].done` | boolean | Emit explicitly. `true` only for confirmed completed milestones; otherwise `false`. |

Never add fields outside this schema or include `featuredOrder` or `featuredSize`:
those apply only to featured projects. Quote and escape strings as valid YAML;
leave dates and booleans unquoted. Use arrays for `stack` and block-style mappings
for milestones. The first unfinished milestone is displayed as current, so keep
its order consistent with `progress.focus`. Ask about conflicting information
rather than changing the roadmap yourself.

## Output

Return only the frontmatter, beginning with `---` and ending with `---`, ready
to save as an `.mdx` file. Do not wrap it in a code fence or append commentary.
If updating an existing entry, preserve known metadata. If it already has a prose
body, ask whether to keep that body or create a separate frontmatter-only entry
before removing any writing.

Example shape, using illustrative values only:

```yaml
---
title: "Homelab Observability Stack"
date: 2026-08-12
category: "personal"
description: "Metrics, logs, and alerting for services on my home server."
stack: ["Docker", "Linux"]
featured: false
hidden: false
status: "in-progress"
progress:
  focus: "Shipping container logs into Loki with bounded retention."
  updated: 2026-11-01
  milestones:
    - label: "Metrics collection"
      done: true
    - label: "Log aggregation"
      done: false
    - label: "Alerting rules"
      done: false
---
```

Before returning, check required fields, YAML types, allowed enum values, absolute
URLs, milestone order, and the evidence for every value. Confirm that there is
no MDX body. If the user later requests the actual write-up, use the full
project-spec-writer workflow with this metadata as the starting point.
