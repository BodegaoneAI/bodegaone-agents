# Social / Short-form Content Agent

> Repurposes long-form content into platform-native posts that earn attention in the feed.
> The distribution counterpart to this repo's Content Writer: that one writes the piece once,
> this one turns it into posts for X, LinkedIn, Instagram, and Threads.

---

## What it does

Give it an article, a transcript, a newsletter, or a rough idea, plus the platforms you want.
It returns ready-to-post, platform-native posts:

- **X / Twitter** posts and threads, each beat within 280 characters
- **LinkedIn** posts with the hook above the "…more" fold
- **Instagram** captions with disciplined hashtags
- **Threads** posts in a peer-to-peer voice
- A **self-lint scorecard** per platform and **verify-before-posting** flags

It writes for the way each feed works:

- **Hook first** so the first line earns the second and survives truncation
- **One idea per post** so every post is quotable and repliable
- **Native per platform** so nothing reads like one caption pasted five ways

---

## What makes it different

It self-checks. Most tools hand you captions and stop. This agent runs each post through
`social_lint` for its platform and fixes what it flags until the post passes, so you get posts
that are already clean:

- Within the platform's official character limit (thread posts checked one by one)
- A hook that lands before the feed collapses the post
- No em dashes, no marketing fluff, no AI-writing tells (the shared house voice)
- Hashtag discipline per platform: few on X/LinkedIn/Threads, capped on Instagram
- A genuine CTA, with no engagement-bait, all-caps shouting, or emoji walls

It also knows what most social tools ignore: a raw external link inside an X post can cut
organic reach (an observed pattern), so it moves the link to a reply and tells you it did.

---

## How to use it

### Option 1: Paste the system prompt (any LLM)
Copy `system.md` into your system prompt or custom instructions. Send it a source and the
platforms you want. Works in Claude, ChatGPT, Gemini, or any model.

### Option 2: MCP tool server (Claude Code, Cursor, Claude Desktop, VS Code)
Runs straight from GitHub, no npm publish needed (Node 20+; first run builds and caches):
```bash
claude mcp add bodegaone-agents --scope user -- npx -y github:BodegaoneAI/bodegaone-agents --stdio
```
This unlocks `social_lint`, the post checker the agent runs on every draft. See the repo root
README for per-client config paths.

### Option 3: Claude Code plugin (agents + tools in one install)
Installs every agent's skills, the hooks, and all the MCP tools. Inside Claude Code:
```
/plugin marketplace add BodegaoneAI/bodegaone-agents
/plugin install bodegaone-agents@bodegaone
```
The skill auto-surfaces when you edit social files (posts, threads, LinkedIn drafts, anything
in a `social/` directory).

---

## Token cost

≈3,500 tokens per run for the system prompt (re-sent as input on every model call), plus ≈750
tokens injected once per session when the Claude Code plugin's skill auto-surfaces. Estimated with
the [Anthropic tokenizer](https://github.com/anthropics/anthropic-tokenizer-typescript); actual
counts vary slightly by model, and prompt caching (on by default in most Claude clients) makes
repeat turns far cheaper than the raw number implies.

---

## Example prompts

**Repurpose an article:**
```
Turn this blog post into an X thread and a LinkedIn post. Goal is replies. [paste post]
```

**One idea, four platforms:**
```
Take this idea and write a native post for X, LinkedIn, Instagram, and Threads. Lint each one.
```

**Fix a weak draft:**
```
Rewrite this tweet so the hook lands and it is one idea. Then lint it for X. [paste tweet]
```

**Thread from a transcript:**
```
Pull the three best ideas out of this transcript and write a tight X thread, one idea per post.
[paste transcript]
```

---

## Tools it uses

| Tool | What it does |
|---|---|
| `social_lint` | Lints a post or thread for a platform and returns a Pass/Warn/Fail scorecard plus line-level fixes |

Upstream, take a piece from the **Content Writer** agent as the source material, so the same
idea ships as a long-form page and as native short-form posts.

---

## Files

- `system.md` - the full agent system prompt (paste this anywhere)
- `README.md` - this file

Companion agent: [`agents/content-writer`](../content-writer/). Built by [Bodega One](https://bodegaone.ai).
