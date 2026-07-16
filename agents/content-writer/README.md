# Content Writer Agent

> Writes publish-ready content that passes the SEO / AEO / GEO audit on the first try.
> The generative counterpart to this repo's SEO/GEO agent: that one grades a page, this one
> writes to the spec that earns the grade.

---

## What it does

Give it a topic, keyword, or rough draft. It returns a complete, publish-ready package:

- **SEO title** (50 to 60 chars) and **meta description** (120 to 160 chars)
- **URL slug**
- The **full article** in clean markdown: one H1, question-phrased H2s, answer-first
  sections, tables and lists where they fit, and a FAQ block where it helps
- **Suggested JSON-LD schema** for the piece
- **Internal link suggestions** with descriptive anchors
- A **self-lint scorecard** and **fact-check flags**

It writes for three targets at once:

- **SEO** so the page ranks as a link
- **AEO** so the page is lifted into featured snippets, People Also Ask, and AI Overview boxes
- **GEO** so the page gets cited as a source by ChatGPT, Perplexity, Claude, and Gemini

---

## What makes it different

It self-checks. Most AI writing tools hand you prose and stop. This agent runs its own draft
through `content_lint` and fixes what it flags until the draft passes, so you get content
that is already clean:

- No em dashes and no marketing fluff or AI-writing tells
- Answer-first sections that win snippets
- Question-phrased headings that feed People Also Ask and Google's query fan-out
- Correct title and meta lengths, descriptive link anchors, real FAQ structure
- Cited sources and author attribution for E-E-A-T
- Compliant with Google's AI-content policy (value, oversight, no scaled abuse)

It also knows what most tools get wrong: FAQ and HowTo rich results are deprecated in Google,
so it writes Q&A and step content for humans and AI extraction, never to chase a dead rich
result.

---

## How to use it

### Option 1: Paste the system prompt (any LLM)
Copy `system.md` into your system prompt or custom instructions. Send it a topic, keyword, or
draft. Works in Claude, ChatGPT, Gemini, or any model.

### Option 2: MCP tool server (Claude Code, Cursor, Claude Desktop, VS Code)
Runs straight from GitHub, no npm publish needed (Node 20+; first run builds and caches):
```bash
claude mcp add bodegaone-agents --scope user -- npx -y github:BodegaoneAI/bodegaone-agents --stdio
```
This unlocks `content_lint` (the draft checker) plus the SEO research tools the writer uses to
build outlines. See the repo root README for per-client config paths.

### Option 3: Claude Code plugin (agents + tools in one install)
Installs both agents' skills, the hooks, and all the MCP tools. Inside Claude Code:
```
/plugin marketplace add BodegaoneAI/bodegaone-agents
/plugin install bodegaone-agents@bodegaone
```
The skill auto-surfaces when you edit content files (blog posts, markdown, MDX, content
directories).

---

## Token cost

≈3,900 tokens per run for the system prompt (re-sent as input on every model call), plus ≈760
tokens injected once per session when the Claude Code plugin's skill auto-surfaces. Estimated with
the [Anthropic tokenizer](https://github.com/anthropics/anthropic-tokenizer-typescript); actual
counts vary slightly by model, and prompt caching (on by default in most Claude clients) makes
repeat turns far cheaper than the raw number implies.

---

## Example prompts

**Write a new piece:**
```
Write a pillar guide targeting "how much VRAM for local AI". Commercial-investigation intent,
practitioner audience. Return the full package and lint it.
```

**Rewrite a weak draft:**
```
Review and rewrite this draft to pass the SEO/AEO/GEO spec. Fix the openers to be answer-first,
strip banned words, add an FAQ block. [paste draft]
```

**Comparison page:**
```
Write an "X vs Y" comparison page for [product A] and [product B]. Lead with an answer-first
verdict, include a comparison table, and cover the real objections in the FAQ.
```

**Metadata only:**
```
Write three title + meta description options for this page, all in range and em-dash-free.
[paste page]
```

---

## Tools it uses

| Tool | What it does |
|---|---|
| `content_lint` | Lints a draft against this spec and returns a Pass/Warn/Fail scorecard plus line-level fixes |
| `seo_keyword_cluster` | Maps the topical cluster and query fan-out sub-questions for the outline |
| `seo_analyze_serp` | Shows what the top results cover (needs a Brave Search API key) |
| `seo_fetch_page` | Reads a competitor or existing page to find the content gap |

After publishing, hand off to the **SEO/GEO agent** to audit the live URL (Core Web Vitals,
live schema, canonical, internal-link graph) that a draft alone cannot show.

---

## Files

- `system.md` - the full agent system prompt (paste this anywhere)
- `README.md` - this file

Companion agent: [`agents/seo-geo`](../seo-geo/). Built by [Bodega One](https://bodegaone.ai).
