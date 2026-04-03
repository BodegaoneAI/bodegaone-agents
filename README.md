# BodegaOne Agents

> Specialized AI agents built for operators and founders. One agent at a time, done exceptionally well.

---

## Agents

### [SEO/GEO Agent](./agents/seo-geo/) — Available Now

The most comprehensive SEO + Generative Engine Optimization agent available.
Combines traditional SEO expertise with deep knowledge of how AI search engines
(Perplexity, ChatGPT, Gemini, Copilot, Claude) discover and cite content.
Built entirely from official Google and Bing documentation — not third-party blogs.

**What makes it different:** Most SEO tools give you a checklist. This one gives you
a diagnosis — specific, prioritized, immediately actionable — and saves a full scored
audit report to disk as a markdown file.

**9-step methodology on every analysis:**

> Intent classification → Topical authority gap → E-E-A-T audit → GEO structure →
> Schema markup → Technical SEO → AI bot strategy → Internal linking → Prioritized quick wins

---

## Installation

Pick the method that matches how you use AI.

---

### Option 1 — Paste the system prompt (zero setup, any LLM)

Copy [`agents/seo-geo/system.md`](./agents/seo-geo/system.md) into your LLM's
system prompt or custom instructions. Works in Claude, ChatGPT, Gemini, or any model
that accepts a system prompt.

No tools, no server, no install. Just a significantly smarter SEO brain.

---

### Option 2 — MCP tool server (recommended)

Unlocks 5 live analysis tools: page fetching, schema validation, SERP research,
keyword clustering, and report generation.

#### Claude Code

```bash
claude mcp add bodegaone-agents --scope user -- npx -y bodegaone-agents --stdio
```

Run that once. The agent is now available in every Claude Code session.

#### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)
or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

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

Use the same `npx -y bodegaone-agents --stdio` command in your MCP server config.
Refer to your client's documentation for where to add MCP servers.

#### Optional: Brave Search API (for SERP analysis)

The `seo_analyze_serp` and `seo_keyword_cluster` (live mode) tools require a Brave Search API key.
Get a free key at [brave.com/search/api](https://brave.com/search/api) — 2,000 free queries/month.

```bash
# Set in your environment or add to your shell profile
export BRAVE_SEARCH_API_KEY=your_key_here
```

Without the key, all other tools work normally. Keyword clustering falls back to planning mode.

---

### Option 3 — Claude Code plugin (auto-injection on relevant files)

The repo includes a Claude Code hooks configuration that auto-injects SEO/GEO
context whenever you edit SEO-relevant files (`robots.txt`, `sitemap.ts`, metadata,
schema markup, blog content). No prompt required — context appears automatically.

```bash
claude plugin install github:BodegaoneAI/bodegaone-agents
```

---

### Local development install

If you want to run from source or contribute:

```bash
git clone https://github.com/BodegaoneAI/bodegaone-agents.git
cd bodegaone-agents
npm install
npm run build

# Run the MCP server from the built output
node dist/mcp/server.js --stdio

# Or use tsx to run TypeScript directly (no build step)
npx tsx mcp/server.ts --stdio
```

Then point your MCP client at the local `server.js` path.

---

## MCP Tools

| Tool | What it does | Requires |
|---|---|---|
| `seo_fetch_page` | Fetches a live URL and extracts all SEO signals: title, meta description, heading structure, word count, schema types, canonical, OG tags, robots meta, internal/external links, and a detected issues list | — |
| `seo_check_schema` | Validates all JSON-LD structured data against schema.org spec. Checks required fields per type, flags missing high-value schemas, and identifies GEO citation opportunities | — |
| `seo_analyze_serp` | Fetches real search results for a keyword to identify competitor content patterns, domain authority signals, and content gaps | Brave Search API key |
| `seo_keyword_cluster` | Maps a full topical cluster from a seed keyword — pillar page spec, 5 cluster pages, 10 long-tail queries, GEO opportunities, and an internal linking plan. Works without API key in planning mode | — (planning mode) |
| `seo_save_report` | Saves a complete scored audit as a markdown file. Includes a Pass/Warn/Fail scorecard across 8 categories, per-category item details, diagnosis, quick wins, medium-term actions, and strategic moves | — |

---

## Audit Scorecard

Every report grades 8 categories with Pass / Warn / Fail:

| Category | What's evaluated |
|---|---|
| Technical SEO | HTTPS, canonical, sitemap, robots.txt, status codes, crawlability |
| Metadata | Title length, meta description, Open Graph tags |
| Schema & Structured Data | JSON-LD presence, type-specific required fields, GEO schema opportunities |
| Content & E-E-A-T | Word count, author attribution, topical depth, original data |
| Core Web Vitals | LCP, INP, CLS thresholds vs. Google's official benchmarks |
| GEO Readiness | AI bot allowances, FAQ/HowTo schema, answer-first structure, entity naming |
| Internal Linking | Pillar-to-cluster links, anchor text quality, orphaned pages |
| Page Experience | Mobile, HTTPS, interstitials, page speed signals |

---

## Example Prompts

```
Audit https://example.com and save the report. Give me quick wins first.
```

```
I want to rank for "AI tools for small business". Analyze the SERP,
build a keyword cluster, and tell me what it would take to own this topic.
```

```
Why isn't my content being cited by Perplexity when users ask about [topic]?
Check my robots.txt and schema markup.
```

```
Review this blog post for E-E-A-T signals and GEO citation potential.
What's missing that the top results have?
[paste content]
```

```
Check the schema markup on https://example.com/blog/post and tell me
what structured data I'm missing for AI citation.
```

---

## Roadmap

One agent, done exceptionally well, before moving to the next.

| Agent | Status |
|---|---|
| SEO/GEO | ✅ Available |
| Content Writer | 🔜 Coming soon |
| Planner | 🔜 Coming soon |
| Designer | 🔜 Coming soon |
| Researcher | 🔜 Coming soon |

---

## Philosophy

Ten mediocre agents aren't worth one exceptional one.

Every agent is built from real production use — not theoretical checklists.
The SEO/GEO agent is grounded entirely in official Google and Bing documentation,
corrects common misconceptions in the SEO industry, and reflects what actually
affects rankings and AI citation in 2025/2026.

---

## Contributing

See an improvement? Open a PR. The bar is simple: does it make the agent
give better advice than it did before? If yes, it belongs here.

---

## License

MIT — free to use, fork, and build on.

Built by [Bodega One](https://bodegaone.ai)
