---
name: blog-writer
description: Use this skill whenever the user wants to write, draft, or revise a blog post for their personal site — especially a developer blog post about a project they built, but also blog posts on other topics. Trigger it for requests like "write a blog post about my X project", "turn this into a blog", "draft a blog entry", "I want to write up the story behind this build", or when the user pastes details about something they made and wants the longer, more personal write-up (as opposed to a terse spec). Use it even if they never say "blog" — any time the deliverable is a first-person, narrative MDX post for their site, this applies. This is the companion to project-spec-writer: the spec is the short technical summary; the blog is the longer, reflective story.
---

# Blog Writer

Turn a project (or a topic) into a finished `.mdx` blog post for the author's personal site, written in his voice. The author is a developer who writes one blog per project — the longer, more personal companion to the project spec. Where the spec is terse and unsentimental ("what was built and how"), the blog is the opposite: it tells the story, explains the *why*, is candid about what was hard, what he learned, and what he'd do differently. That reflective, first-person honesty is the entire reason the blog exists as a separate artifact. If a draft reads like a spec — clipped, feelingless, all systems and no story — it has failed.

The most common case is a blog about a project that already exists (often one that already has a spec). The skill is built around that case but also handles standalone blogs on other topics.

## The frontmatter is a strict contract

Every post begins with YAML frontmatter in **exactly** this shape. The field names, order, types, and quoting are not flexible — the site's content schema depends on them. This is the one part of the skill with no creative latitude.

```yaml
---
title: "Blog-style title here"
date: 2025-05-06
description: "One to two sentences describing the post. Reads like the project blurb."
projectSlug: "ai-tic-tac-toe"
tags: ["react", "javascript", "tailwind", "anthropic", "ai"]
coverImage: "../../assets/images/blog/tictactoe.png"
draft: false
hidden: false
---
```

Field rules:
- **title** — quoted string. This is a *blog title*, not the project name. The author's real titles are things like `"A Deeper Dive"`, `"Getting Back Into Coding"`, `"Project Number 2"`. It can be evocative, a phase-of-the-journey phrase, or a plain numbered label — match whatever the user wants, but don't just dump the project name in here unless they ask.
- **date** — unquoted, `YYYY-MM-DD`. Default to today's date unless the user gives one.
- **description** — quoted string, 1–2 sentences. Often mirrors the project's one-line summary. This is meta/SEO copy, so it can be a touch more neutral than the body.
- **projectSlug** — quoted string. The slug of the related project (kebab-case, matches the project's URL). For a blog tied to a project, always include it. **For a non-project blog, omit this line entirely** rather than inventing a slug.
- **tags** — array of lowercase strings, usually the stack plus a couple of topic tags (e.g. `"ai"`, `"learning"`). Keep them lowercase and short.
- **coverImage** — quoted relative path of the form `../../assets/images/blog/<name>.<ext>`. Derive `<name>` from the slug or project name. The extension varies (`.PNG`, `.png`, `.webp`, etc.) — don't hardcode it; default to `.png` and let the user correct it. The author has to add the actual image file separately, so **always tell the user the image path you used and that they need to drop the file there** — don't let a missing image be a silent surprise.
- **draft** — boolean, default `false`.
- **hidden** — boolean, default `false`.

When in doubt about a value, ask rather than fabricate — but never break the field set or the formatting.

## Voice and tone

The blog is where the author sounds like a person, not a résumé. These rules are what separate it from the spec.

- **First person, narrative, reflective.** "The idea came to me while looking at my work calendar and thinking, 'I could code that.'" He tells you how he got to the project, not just what it is. Past-tense storytelling is the default mode for the Backstory.
- **Candid about limitations and mistakes.** This is a signature of his voice. He'll say "I lacked the technical skills to bring my idea to life," or that a library's "documentation is very poorly written," or "as a less experienced coder, I would have chosen a different auth library." Don't sand this off into corporate neutrality — the honesty is the personality. The "What I Would Do Differently" section is built entirely on it.
- **Learning-oriented.** He frames projects as steps in a journey: trying a new framework, making the jump to TypeScript, getting back into coding. What he *learned* matters as much as what he built. It's fine — encouraged — to say "this taught me X," the exact opposite of the spec's rule.
- **Plain-spoken, lightly conversational.** Contractions, the occasional direct aside to the reader ("Why not develop something that can show me those stats more often?"). Warm but not gushing. No marketing adjectives, no "cutting-edge / seamless / robust."
- **Concrete.** Real frameworks, real constraints, the actual hard part (writing a custom refresh-token function because it wasn't built in; storing data in localStorage when IndexedDB would've been right). Specifics carry the post.

Never fabricate a tech stack, a metric, a feature, or — especially — a "lesson" or a "backstory." The reflective bits are the heart of the post and the easiest thing to fake badly. If you don't have the real story, get it in the interview. An invented backstory is worse than a short one.

## If a project spec already exists, start there

Because this is the companion to `project-spec-writer`, the user may already have a spec for this project. If they paste one, or if it's earlier in the conversation, **read it first.** The spec gives you the stack, the scope, the feature list, and the technical highlights for free — that's the *what* and *how*. Don't re-interview for those.

What the spec deliberately leaves out is exactly what the blog needs: the *why*, the story of getting there, what was hard, what got learned, what the author would change. So when a spec exists, aim the interview almost entirely at that reflective material rather than re-collecting facts the spec already states.

## Interview the user first

Do not draft from a one-line prompt. A blog written off "I made a tic-tac-toe game with React" will read like generic LLM filler, because everything that makes it *his* blog — the backstory, the candid limitations, the real lessons — lives in details he hasn't volunteered yet. The interview exists to pull that out before drafting.

Two things you're fishing for:
1. **The story and the feelings around it** — why he built it, what it connects to, what frustrated him, what clicked, what he'd redo. This is the blog's reason to exist.
2. **His own words and framing.** When he says something vivid, opinionated, or self-deprecating, keep it. Reuse his phrasing in the draft. This is what stops the post from sounding machine-generated.

**How to run it:**
- Ask in small batches (2–4 questions at a time), conversationally — not a wall of questions. Follow up on whatever he gets talkative about; that thread is usually the best material.
- Lead with open, story-pulling questions. "What made you want to build this in the first place?" pulls richer answers than "List your goals."
- If a spec already exists, skip the fact-gathering and go straight for the reflective questions.
- Keep going until you can write the Backstory, What I Learned, and What I'd Do Differently *truthfully and in his voice*. Then say you have enough and draft.

**Question pool** (adapt the wording; don't read them off like a form):

*Origin & motivation (→ Backstory, Goals)*
- What made you want to build this? Where did the idea come from?
- Had you tried something like it before? How'd that go?
- What were you actually trying to get better at — a new framework, a language, deployment, design?
- Was this part of a bigger arc for you (getting back into coding, leveling up, etc.)?

*The build (→ Overview, Technologies Used; skip if the spec covers it)*
- In a sentence, what is it?
- What's the stack, and was anything a deliberate choice over the default?
- Where's the source / is it deployed?

*The hard parts & lessons (→ What I Learned)*
- What did you actually learn building this — technical or otherwise?
- What surprised you? What did you have to figure out the hard way?
- Was there a moment where something finally clicked?

*Honest hindsight (→ What I'd Do Differently)*
- Knowing what you know now, what would you do differently?
- Any library, tool, or decision you'd swap out? Why?
- Anything that technically works but you're not happy with under the hood?

*The post itself*
- What do you want to call it? (title) Any vibe you're going for?
- What tags fit? Is there a related project slug?

## Output structure

The author's posts follow a consistent shape, but he has explicitly said he does **not** want to be locked to these exact headers. So treat this as the strong default skeleton — lead with it — but add, drop, rename, or reorder sections when the story calls for it. A blog about a non-project topic might keep almost none of these. Use judgment: serve the story, not the template.

Headers are H3 (`###`). The default skeleton, in order:

```
> **Source Code:** <https://github.com/...>

### Overview
### Goals of the Project
### Technologies Used
### Backstory
### What I Learned
### What I Would Do Differently
```

- **Source Code blockquote** — a `>` blockquote at the very top of the body (above Overview) linking the repo, formatted `> **Source Code:** <url>`. Include it whenever there's a public repo. Drop it for non-code posts.
- **Overview** — a short paragraph: what the project is, who it's for, the gist. Can reuse/expand the spec's overview. Slightly fuller and warmer than the spec version.
- **Goals of the Project** — a bulleted list of what he set out to do, often with *why* baked in (e.g. "develop something in TypeScript, given my last two projects were JavaScript"). Goals here are allowed to be personal/learning goals, not just product goals.
- **Technologies Used** — a bulleted list, each item a **bold tech name** + colon + one-line description. Example: `- **Next.js:** A React framework for building server-side rendered applications.`
- **Backstory** — the narrative heart. Prose, multiple paragraphs, first-person, past tense. This is where his voice lives most. Don't bullet it; let it breathe.
- **What I Learned** — bulleted list of real takeaways, technical and otherwise. Candid. Can include things like "I learned you need permission from Spotify to let arbitrary users log in." Nested sub-bullets are fine for grouping.
- **What I Would Do Differently** — bulleted list of honest hindsight, each a real, specific change with a reason. This section is non-negotiably candid; if the user has nothing here, push gently in the interview rather than padding it with fluff.

End the body with the same closing the author uses if you can — but the navigation/back-link is rendered by the site, so don't hand-write site chrome into the MDX. Just the frontmatter + body content.

## Worked example (abridged, for reference)

This is the target style — note the storytelling Backstory and the candor in the last two sections.

```mdx
---
title: "A Deeper Dive"
date: 2025-05-07
description: "SpotiDash is a web application that provides users with a personalized dashboard for exploring their favorite music on Spotify."
projectSlug: "spotidash"
tags: ["nextjs", "typescript", "spotify-api", "tailwind", "auth"]
coverImage: "../../assets/images/blog/spotidash.PNG"
draft: false
hidden: false
---

> **Source Code:** <https://github.com/iPior/nextjs-spotify-dashboard>

### Overview

SpotiDash is a web application that provides users with a personalized dashboard
for exploring their favorite music on Spotify...

### Goals of the Project

- The goal of this project was to further my learning and try out a React framework.
  Next.js seemed like the obvious choice because:
  * File-based routing gave the project great structure.
  * Server-side rendering and serverless deployment.
  * Easy integration with Vercel, a platform I wanted to try.
- I also wanted to build something fun for others to use. I'm really into music...

### Technologies Used

- **Next.js:** A React framework for building server-side rendered applications.
- **TypeScript:** A typed superset of JavaScript that compiles to plain JavaScript.
- **Spotify API:** Used to fetch music data for the application.

### Backstory

As mentioned in the goals, I've always loved the end of the year when everyone gets
their Spotify Wrapped. My friends and I send each other screenshots of what we've
been listening to... I even tried building something like this early in my coding
journey, with Flask, HTML, and CSS — but it turned out not too pleasant on the eyes.
Honestly, I lacked the technical skills to bring my idea to life...

### What I Learned

- A lot about Next.js: file-based routing, client/server-side code, API routes.
- That you need permission from Spotify to let arbitrary users log in. Instead, I
  added a list of friends to the user group and they were happy to test it.

### What I Would Do Differently

- I stored daily-fetched data in local storage out of instinct. With what I know now,
  I'd use IndexedDB with a library like Dexie.js.
- As a less experienced coder, I'd have chosen a different auth library. I had to write
  my own refresh-token function, and the docs were very poorly written.
```

## Workflow

1. **Check for an existing spec / prior context.** If the user has a project spec for this, read it and pull the *what/how* from it so the interview can focus on the *why/story*.
2. **Interview** to fill the reflective gaps — in small batches, until the Backstory, What I Learned, and What I'd Do Differently can each be written truthfully and in his voice. Don't draft from a thin prompt.
3. **Confirm the frontmatter values** (title, date, slug, tags, cover image name) — these are the parts most likely to need the user's input. Tell the user the `coverImage` path you used and that they need to add the actual image file.
4. **Draft** the full `.mdx`: exact frontmatter contract + body in the voice above. Lead with the default header skeleton, but adapt it to the story. Reuse the user's own phrasing for the vivid and candid bits.
5. **Deliver** as a single `.mdx` file the user can drop into `src/content/blog/`. Name the file after the slug (e.g. `spotidash.mdx`).
6. **Offer a revision pass.** The author knows his own voice best — a line he flags as "corny" or "too LLM" is the fastest way to tighten it.
