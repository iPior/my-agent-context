---
name: project-spec-writer
description: Use this skill whenever the user wants to write, draft, or revise a project spec, project write-up, portfolio entry, or "projects page" description for software work they built. Trigger it for requests like "write a spec for my X project", "help me write this up for my portfolio", "draft a project description", or when the user pastes details about something they built and wants it turned into a structured write-up. Use it even if they never say the word "spec" — any time the deliverable is a portfolio-style description of a software project, this applies.
---
 
# Project Spec Writer
 
Turn a description of a software project into a clean, structured portfolio spec written in the author's voice. The author is a developer documenting projects he owned (freelance, work, and personal). The output is read by recruiters, clients, and other engineers, so it stays practical and technical — it describes what was built and how, not how it felt to build it.
 
## Voice and tone
 
These rules matter because the whole point of the spec is to make a project legible to a technical reader at a glance. Reflective or sentimental writing buries the signal.
 
- **First person, direct.** Write as the person who built it: "I built", "the implementation prioritized", "I integrated". Describe the work plainly. Don't lean on ownership language ("I owned the full product", "I owned X end to end") — every project here was built and owned by the author, so saying so adds no information and reads as filler. State scope only when it's a real distinction (e.g. you owned the backend but not the design).
- **Practical and technical, never reflective.** Describe systems, flows, and decisions — not feelings, lessons, or journeys. No "this taught me", no "I'm proud that". (Pride belongs in the Technical Highlights *selection*, not in the prose.)
- **Concrete over vague.** "custom RSVP flows for ~200 guests" beats "a great user experience". Pull in real numbers, real constraints, and real tech where they exist.
- **Production-minded.** Favor language a real engineer respects: reliability, monitoring, auth, data handling, responsiveness, operational visibility, deployment.
- **Tight.** No filler, no marketing adjectives ("cutting-edge", "seamless", "robust solution"). If a sentence doesn't add information, cut it.
Never fabricate a tech stack, a metric, or a feature. If you don't have the detail, get it from the interview below — don't invent it.
 
## Interview the user first
 
Do not draft from a one-line prompt. A spec written off "I made a wedding site with Next.js" will read like generic LLM filler, because all the texture — the part that sounds like the author and not a template — lives in details the user hasn't volunteered yet. The interview exists to pull that texture out *before* drafting.
 
Two things you're fishing for:
1. **Concrete specifics** — the stack, the scale, the actual features, the constraints, the hard parts. These make the spec credible.
2. **The author's own framing and words** — how they describe the problem, what they get animated about, the phrase they'd use bragging to another dev. Capture these and reuse their phrasing in the draft. This is what stops the output from sounding machine-generated. When the user says something vivid or opinionated, keep their words rather than smoothing them into neutral prose.
**How to run it:**
- Ask in small batches (2–4 questions at a time), conversationally — not a wall of twenty questions. Follow up on whatever they get talkative about; that thread usually contains the best material.
- Lead with open, indirect questions over interrogative ones. "What would you brag about here?" pulls richer, more characteristic answers than "List your technical achievements."
- Keep going until you can write every section truthfully and distinctively. Then say you have enough and draft — don't drag it out once the well is full.
- You usually don't need the whole pool. Pick the questions that fill *this* project's gaps.
**Question pool** (draw from these, adapt the wording, don't read them off like a form):
 
*Framing & purpose*
- In one breath, what is this thing?
- What was broken or annoying before it existed — what problem are you actually solving?
- Who's on the other end using it, and what are they trying to get done?
- Freelance, work, or personal? Was there a client, a deadline, a real launch?
*Substance & scale*
- What were the main pieces you had to build to make it work?
- Any real numbers — users, guests, scale, traffic, how long it ran?
- What's the stack, and was anything a deliberate choice rather than a default?
- Walk me through what happens from the moment someone opens it.
*Pride & voice (the good stuff)*
- What are you proud of here?
- If you were showing this to another dev, what's the first thing you'd point at?
- What would you brag about?
- Was there anything clever, non-obvious, or that you had to figure out the hard way?
- What nearly broke, or what was the tricky constraint you had to design around?
- Is there a part that's more impressive than it looks from the outside?
*Edges*
- Anything you'd warn another developer about, or a tradeoff you knowingly made?
- Anything you built that you ended up cutting or that didn't make it in?
Map the answers onto the sections: framing/purpose → Overview; substance → What I Built and How It Works; pride/voice → Technical Highlights (and the vivid phrasing seeds the whole thing).
## Frontmatter contract

Return a complete MDX project entry, not only the prose body. The first bytes of every draft must be an opening `---` delimiter followed by valid YAML frontmatter. Missing or malformed frontmatter breaks the Astro content-collection build.

Use this field contract exactly:

| Field | Type | Requirement |
| --- | --- | --- |
| `title` | string | Required. Quote the value. |
| `date` | date | Required. Use `YYYY-MM-DD`. |
| `category` | enum | Required. Use exactly `freelance`, `work`, or `personal`. |
| `description` | string | Required. Quote a concise project-card summary. |
| `stack` | string array | Optional. Include only technologies confirmed by the user or repository. |
| `thumbnail` | string | Optional. Include only when a path is known. |
| `liveUrl` | URL string | Optional. Must be a valid absolute URL. |
| `githubUrl` | URL string | Optional. Must be a valid absolute URL. |
| `blogSlug` | string | Optional. Include only when the related blog slug is known. |
| `featured` | boolean | Optional; defaults to `false`. Prefer emitting it explicitly. |
| `hidden` | boolean | Optional; defaults to `false`. Prefer emitting it explicitly. |

Use this shape:

```yaml
---
title: "Project Title"
date: 2026-01-31
category: "personal"
description: "A concise summary used on project cards and in metadata."
stack: ["TypeScript", "Astro"]
liveUrl: "https://example.com"
githubUrl: "https://github.com/example/project"
blogSlug: "related-post"
featured: false
hidden: false
---
```

Omit unknown optional fields rather than inventing values. Never omit a required field: ask for it during the interview if it cannot be established from the user's details or the project repository. Keep YAML types intact—booleans are unquoted, arrays are YAML arrays, and URLs are strings. Do not add fields outside this contract.

## Output structure

After the frontmatter, use this exact set of headers, in this order, as H2 (`##`):
```
## Overview
## What I Built
## How It Works
## Technical Highlights
```
 
### Overview
2–3 sentences. Cover what the project is, who or what it serves, and the scope of the work. Keep it practical and technical, not reflective.
 
For personal projects only, an optional second short paragraph may note a process angle (e.g. that the build was also a test of agentic coding) — but only if the user raises it. The default Overview is one practical paragraph.
 
### What I Built
A bulleted list of the core features, workflows, or systems implemented. Each bullet is a full sentence describing one piece of owned work. Group related work into a single bullet rather than listing every small task. Typically 3–5 bullets.
 
### How It Works
Explain the system at a high level. Use either one short paragraph OR exactly 3 concise bullets. Walk the reader from the user-facing surface, to the behind-the-scenes operations, to the underlying stack/integration layer. Keep it to how the pieces fit together, not a feature list.
 
### Technical Highlights
The 3 things the author is proud of — the things he'd lead with when telling someone about the project. Format each as a **bold label** followed by a colon and one sentence of explanation:
 
```
- **Custom RSVP and guest workflows**: The site goes beyond a static event page by supporting structured guest responses and the operational flows needed to manage a live attendee list.
```
 
Pick highlights that are genuinely distinctive about *this* project, not generic engineering virtues. Aim for 3.
 
## Worked example
 
The following is a complete spec in the target style, for reference.

```mdx
---
title: "Personal Wedding Website"
date: 2026-03-17
category: "personal"
description: "A wedding website and guest management application with custom RSVP flows, admin tooling, and mobile-first reliability for roughly 200 guests."
stack: ["Next.js", "TypeScript", "Supabase", "Prisma", "Resend", "i18n"]
githubUrl: "https://github.com/iPior/old-portfolio-website"
blogSlug: "wedding-website"
featured: true
hidden: false
---

## Overview

This project is a full wedding website and guest management application built for a real event with roughly 200 attendees. It spans the public-facing information site, custom RSVP flows, an authenticated admin dashboard, guest management tooling, and the communication workflows needed to keep the event organized.

## What I Built

- The public wedding site experience, including event information architecture, navigation, and RSVP submission flows.
- The authenticated admin dashboard for managing guests, tracking responses, and supporting wedding-planning operations.
- The supporting integration layer for auth, data storage, email communication, and production monitoring.

## How It Works

- Guests use the public site primarily on mobile to view event details and submit RSVPs through a custom flow designed to be simple and low-friction.
- Behind the scenes, authenticated admin tools support guest tracking, imports, response management, and outbound email communication for planning and follow-up.
- The application uses Next.js and Supabase for the app layer, auth, and data handling, with production-minded attention to responsiveness, reliability, and operational visibility.

## Technical Highlights

- **Custom RSVP and guest workflows**: The site goes beyond a static event page by supporting structured guest responses and the operational flows needed to manage a live attendee list.
- **Admin tooling for real event operations**: A private dashboard, guest import tools, and broadcast email capabilities turned the project into a lightweight event management product rather than just a microsite.
- **Mobile-first reliability**: Because most guests were expected to use the site from their phones, the implementation prioritized mobile UX, responsive performance, testing, and issue monitoring.
```

## Workflow

1. **Interview first.** Read whatever the user gave you, then run the interview above to fill the gaps — in batches, until every section and every required frontmatter field can be written truthfully and in the author's voice. Don't skip to drafting from a thin prompt.
2. Once the well is full, say so and draft the frontmatter followed by all four sections in order. Reuse the user's own phrasing for the vivid bits.
3. Validate the draft against the frontmatter contract: opening and closing delimiters are present, all required fields exist, field types are correct, the category is allowed, URLs are absolute, and no value was fabricated.
4. Return the complete spec as clean MDX the user can paste directly into their site. Do not wrap the final document in a Markdown code fence or commentary unless they ask for notes.
5. Offer a quick revision pass — the user knows their own voice best, and a line they flag as "corny" is the fastest way to tighten the result.
