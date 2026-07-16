# SEO / AEO / GEO Agent

> A senior-level Search, Answer Engine, and Generative Engine Optimization strategist,
> grounded in official Google and Bing documentation and current AI-crawler operator docs.
> Built for founders, operators, and content teams who need a diagnosis, not a checklist.

---

## What it does

This agent masters three overlapping disciplines and never conflates them:

- **SEO** — rank as a link in Google and Bing (the classic crawl, index, rank pipeline)
- **AEO** — *be* the answer: featured snippets, People Also Ask, AI Overview answer boxes, voice
- **GEO** — get *cited as a source* inside generative answers (ChatGPT, Perplexity, Claude, Gemini)

It runs a 10-step methodology on every analysis:

1. Intent classification
2. Topical authority & query fan-out gap analysis
3. E-E-A-T audit
4. AEO audit (answer-first extractability)
5. GEO structure audit (AI citation readiness)
6. Schema markup audit
7. Technical SEO audit
8. AI discoverability audit (crawler policy, IndexNow, entity signals)
9. Internal linking audit
10. Prioritized output (Quick Wins / Medium Term / Strategic Moves)

Every recommendation is labeled as an **official requirement**, an **official best
practice**, or an **observed pattern** — so you always know how much to trust it.

---

## What makes it current (and correct)

Most SEO agents repeat myths. This one is built to correct them:

- **FAQ and HowTo rich results are deprecated.** FAQPage rich results leave Google Search
  on May 7, 2026; HowTo rich results are already gone. The agent still recommends the schema
  for AEO/GEO extraction, but never sells a Google rich result that no longer exists.
- **AI crawlers split into training vs. retrieval.** Blocking GPTBot does not remove you
  from ChatGPT Search. The agent knows which bots keep you citable and which only affect training.
- **Query fan-out** is the mechanic behind AI Overviews and AI Mode, and the agent optimizes
  for it directly (semantic completeness across sub-questions, self-contained passages).
- **llms.txt** gets an honest treatment: useful for agents and developers, no confirmed
  ranking or citation impact.
- **E-E-A-T is not a score**, the helpful-content system is now part of core ranking, and
  IndexNow reaches Bing (and therefore ChatGPT Search + Copilot) but not Google.

---

## How to use it

### Option 1 — Paste the system prompt (any LLM)
Copy `system.md` into your system prompt or custom instructions. Works in Claude, ChatGPT,
Gemini, or any model. No tools, no setup.

### Option 2 — MCP tool server (Claude Code, Cursor, Claude Desktop, VS Code)
Runs straight from GitHub, no npm publish needed (Node 20+; first run builds and caches):
```bash
claude mcp add bodegaone-agents --scope user -- npx -y github:BodegaoneAI/bodegaone-agents --stdio
```
Or add the same command to your MCP client's config as `command: "npx"`,
`args: ["-y", "github:BodegaoneAI/bodegaone-agents", "--stdio"]`. See the repo root README for
per-client config paths and the optional Brave Search API key.

### Option 3 — Claude Code plugin (agents + tools in one install)
Installs both agents' auto-injecting skills, the editor hooks, and all the MCP tools. Inside
Claude Code:
```
/plugin marketplace add BodegaoneAI/bodegaone-agents
/plugin install bodegaone-agents@bodegaone
```
The skill auto-surfaces when you edit SEO-relevant files (`robots.txt`, `sitemap.ts`, metadata,
schema, blog content).

---

## Example prompts

**Analyze a live page:**
```
Analyze https://example.com/blog/my-post for SEO, AEO, and GEO. Quick wins first, then save the report.
```

**Audit a keyword opportunity:**
```
I want to rank for "best local AI IDE 2026". Map the query fan-out, find the content gap,
and tell me what it takes to own it.
```

**Review before publishing:**
```
Review this draft. Flag anything hurting E-E-A-T or reducing AI citation potential,
and rewrite the weak sections answer-first. [paste content]
```

**AI visibility:**
```
Why isn't my content cited by Perplexity or ChatGPT? Check my robots.txt bot policy and schema.
```

**Fix a technical issue:**
```
My page is in the sitemap but noindexed. What's causing this and how do I fix it?
```

---

## MCP Tools

| Tool | What it does |
|---|---|
| `seo_fetch_page` | Fetch a live URL and extract every SEO signal + a detected-issues list |
| `seo_check_schema` | Validate all JSON-LD against schema.org; flag missing high-value schemas |
| `seo_analyze_serp` | Analyze the top results for a keyword (requires Brave Search API key) |
| `seo_keyword_cluster` | Map a topical cluster and fan-out sub-questions from a seed keyword |
| `seo_crawl_site` | Discover pages via sitemap (or link crawl) and audit the whole site |
| `seo_save_report` | Save a full scored audit (8-category scorecard) to `./seo-reports/` |

---

## Files

- `system.md` — the full agent system prompt (paste this anywhere)
- `RESEARCH.md` — every official source and the key finding from each
- `README.md` — this file

Built by [Bodega One](https://bodegaone.ai). Every pattern here is tested against real
production sites and real AI citation behavior.
