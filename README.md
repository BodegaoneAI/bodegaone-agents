# BodegaOne Agents

> Specialized AI agents built for operators and founders. One agent at a time, done exceptionally well.

---

## Agents

### [SEO / AEO / GEO Agent](./agents/seo-geo/) — Available Now

A senior Search, Answer Engine, and Generative Engine Optimization strategist in a single
system prompt, backed by six live analysis tools. It combines traditional SEO with current,
source-backed knowledge of how AI answer engines (Google AI Overviews and AI Mode,
Perplexity, ChatGPT Search, Microsoft Copilot, Claude) discover, extract, and cite content.
Built entirely from official Google and Bing documentation and AI-crawler operator docs —
not third-party blog posts.

**It masters three disciplines and never conflates them:**

- **SEO** — rank as a link in Google and Bing (crawl, index, rank)
- **AEO** — *be* the answer: featured snippets, People Also Ask, AI Overview boxes, voice
- **GEO** — get *cited as a source* inside generative AI answers, often outside Google

**What makes it different:** most SEO tools hand you a checklist. This one gives you a
diagnosis — specific, prioritized, immediately actionable — and saves a full scored audit
report to disk as markdown. Every recommendation is labeled as an official requirement, an
official best practice, or an observed pattern, so you always know how much to trust it.

**10-step methodology on every analysis:**

> Intent → Topical authority & query fan-out gap → E-E-A-T → AEO extractability →
> GEO structure → Schema markup → Technical SEO → AI discoverability → Internal linking →
> Prioritized quick wins

**Corrects the myths most SEO tools still repeat:**

- FAQ and HowTo rich results are deprecated (FAQ leaves Google Search on May 7, 2026) —
  the agent still uses the schema for AEO/GEO extraction, but never promises a dead rich result
- AI crawlers split into training vs. retrieval — blocking GPTBot does **not** remove you
  from ChatGPT Search, and the agent knows exactly which bots keep you citable
- Query fan-out is the real mechanic behind AI Overviews, and the agent optimizes for it directly
- llms.txt is useful for developer tooling but has no confirmed ranking or citation impact
- E-E-A-T is not a score, and the helpful-content system is now part of core ranking

---

### [Content Writer Agent](./agents/content-writer/) — Available Now

The generative counterpart to the SEO/GEO agent: that one grades a page, this one **writes
to the spec that earns the grade**. Give it a topic, keyword, or rough draft and it returns a
complete, publish-ready package: SEO title, meta description, slug, the full article in clean
markdown, suggested JSON-LD schema, internal-link suggestions, and a self-lint scorecard.

It writes for **SEO, AEO, and GEO at the same time** — ranking, answer extraction, and AI
citation — and **self-checks every draft** with the `content_lint` tool: no em dashes, no
marketing fluff, answer-first sections, question-phrased headings, correct metadata lengths,
descriptive anchors, cited sources, and Google-AI-content-policy compliance. It fixes what
the linter flags until the draft passes.

---

## Installation

Pick the method that matches how you use AI.

### Option 1 — Paste the system prompt (zero setup, any LLM)

Copy [`agents/seo-geo/system.md`](./agents/seo-geo/system.md) into your LLM's system prompt
or custom instructions. Works in Claude, ChatGPT, Gemini, or any model that accepts a system
prompt. No tools, no server, no install — just a significantly smarter search brain.

### Option 2 — MCP tool server (recommended)

Unlocks six live analysis tools: page fetching, schema validation, SERP research, keyword
clustering, full-site crawling, and report generation.

#### Claude Code

```bash
claude mcp add bodegaone-agents --scope user -- npx -y bodegaone-agents --stdio
```

Run that once. The agent is available in every Claude Code session.

#### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or
`%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "bodegaone-agents": {
      "command": "npx",
      "args": ["-y", "bodegaone-agents", "--stdio"]
    }
  }
}
```

#### Cursor / Windsurf / VS Code / any MCP client

Use the same `npx -y bodegaone-agents --stdio` command in your client's MCP server config.

#### Optional: Brave Search API (for SERP analysis)

`seo_analyze_serp` and the live mode of `seo_keyword_cluster` need a Brave Search API key.
Get a free key at [brave.com/search/api](https://brave.com/search/api) — 2,000 free
queries/month.

```bash
export BRAVE_SEARCH_API_KEY=your_key_here
```

Without the key every other tool works normally, and keyword clustering falls back to planning mode.

### Option 3 — Claude Code plugin (auto-injection on relevant files)

The repo includes a Claude Code hooks configuration that auto-injects SEO/AEO/GEO context
whenever you edit SEO-relevant files (`robots.txt`, `sitemap.ts`, metadata, schema markup,
blog content). No prompt required.

```bash
claude plugin install github:BodegaoneAI/bodegaone-agents
```

### Local development install

```bash
git clone https://github.com/BodegaoneAI/bodegaone-agents.git
cd bodegaone-agents
npm install
npm run build

# Run the MCP server from the built output
node dist/mcp/server.js --stdio

# Or run the TypeScript directly, no build step
npx tsx mcp/server.ts --stdio
```

---

## MCP Tools

| Tool | What it does | Requires |
|---|---|---|
| `seo_fetch_page` | Fetches a live URL and extracts every SEO signal: title, meta description, heading structure, word count, schema types, canonical, OG tags, robots meta, internal/external links, and a detected-issues list | — |
| `seo_check_schema` | Validates all JSON-LD structured data against schema.org. Checks required fields per type, flags missing high-value schemas, and identifies AEO/GEO extraction opportunities | — |
| `seo_analyze_serp` | Fetches real search results for a keyword to identify competitor patterns, authority signals, and content gaps | Brave Search API key |
| `seo_keyword_cluster` | Maps a full topical cluster and query fan-out sub-questions from a seed keyword: pillar spec, cluster pages, long-tail queries, and an internal linking plan. Works without an API key in planning mode | — (planning mode) |
| `seo_crawl_site` | Discovers pages via `sitemap.xml` (with sitemap-index support) or an internal-link crawl, audits up to 200 pages, and returns a site-wide issue table with the worst pages surfaced | — |
| `seo_save_report` | Saves a complete scored audit as markdown: a Pass/Warn/Fail scorecard across 8 categories, per-category detail, diagnosis, and prioritized actions | — |
| `content_lint` | Lints a markdown draft against the SEO/AEO/GEO writing spec: em dashes, marketing fluff and AI tells, hedging, heading structure, answer-first openers, FAQ presence, title/meta length, anchor text, and depth. Returns a Pass/Warn/Fail scorecard plus line-level fixes | — |

---

## Audit Scorecard

Every report grades 8 categories Pass / Warn / Fail (overall grade = the worst category):

| Category | What's evaluated |
|---|---|
| Technical SEO | HTTPS, canonical, sitemap, robots.txt, status codes, crawlability |
| Metadata | Title length, meta description, Open Graph tags |
| Schema & Structured Data | JSON-LD presence, type-specific required fields, extraction opportunities |
| Content & E-E-A-T | Word count, author attribution, answer-first structure, original data |
| Core Web Vitals | LCP, INP, CLS vs. Google's official thresholds |
| GEO Readiness | AI crawler policy (training vs. retrieval), answer-first structure, entity naming |
| Internal Linking | Pillar-to-cluster links, anchor text quality, orphaned pages |
| Page Experience | Mobile, HTTPS, interstitials, ad density |

---

## Example Prompts

```
Audit https://example.com and save the report. Give me quick wins first.
```

```
I want to rank for "AI tools for small business". Map the query fan-out,
analyze the SERP, and tell me what it would take to own this topic.
```

```
Why isn't my content cited by Perplexity or ChatGPT? Check my robots.txt
bot policy and my schema markup.
```

```
Review this blog post for E-E-A-T and AI citation potential. Rewrite the
weak sections answer-first. [paste content]
```

---

## Roadmap

One agent, done exceptionally well, before moving to the next.

| Agent | Status |
|---|---|
| SEO / AEO / GEO | Available |
| Content Writer | Available |
| Planner | Coming soon |
| Designer | Coming soon |
| Researcher | Coming soon |

---

## Philosophy

Ten mediocre agents aren't worth one exceptional one.

Every agent is built from real production use, not theoretical checklists. The SEO/AEO/GEO
agent is grounded in official Google and Bing documentation and AI-crawler operator docs,
corrects the misconceptions the SEO industry still repeats, and reflects what actually
affects rankings and AI citation in 2026.

---

## Contributing

See an improvement? Open a PR. The bar is simple: does it make the agent give better advice
than it did before? If yes, it belongs here.

---

## License

MIT — free to use, fork, and build on. See [LICENSE](./LICENSE).

Built by [Bodega One](https://bodegaone.ai)
