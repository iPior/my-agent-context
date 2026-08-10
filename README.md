# my-agent-skills

A personal collection of skills I use with AI coding assistants.

Install all skills into `~/.agents/skills` with:

```sh
npx github:iPior/my-agent-skills
```

Pass one or more skill names to install only those skills.

## Skills

### [project-spec-writer](project-spec-writer/)

A skill that turns a description of a software project into a clean, structured portfolio spec written in the author's own voice. It runs a short interview to pull out the concrete specifics and the author's framing, then drafts a write-up under a fixed set of sections — Overview, What I Built, How It Works, and Technical Highlights.

The output is aimed at recruiters, clients, and other engineers: practical and technical, describing what was built and how, without marketing filler or reflective fluff.

Trigger it with requests like "write a spec for my X project", "help me write this up for my portfolio", or by pasting details about something you built and asking for a structured write-up.

See [SKILL.md](project-spec-writer/SKILL.md) for the full instructions.

### [blog-writer](blog-writer/)

The companion to `project-spec-writer`. Where the spec is the terse technical summary, this skill writes the longer, first-person, narrative blog post for the author's personal site — telling the story behind a build: why it happened, what was hard, what got learned, and what he'd do differently. It outputs a finished `.mdx` file with a strict frontmatter contract and a default section skeleton (Overview, Goals, Technologies Used, Backstory, What I Learned, What I Would Do Differently).

If a project spec already exists, the skill reads it for the *what/how* and aims its interview at the reflective *why/story* the spec leaves out. It also handles standalone blog posts on other topics.

Trigger it with requests like "write a blog post about my X project", "turn this into a blog", or "I want to write up the story behind this build".

See [SKILL.md](blog-writer/SKILL.md) for the full instructions.
