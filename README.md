# BodegaOne Agents

> Specialized AI agents built for operators and founders. One agent at a time, done exceptionally well.

---

## Agents

### [SEO/GEO Agent](./agents/seo-geo/) — Available Now

The most comprehensive SEO + Generative Engine Optimization agent available.
Combines traditional SEO expertise with deep knowledge of how AI search engines
(Perplexity, ChatGPT, Gemini, Copilot, Claude) discover and cite content.

**What makes it different:** Most SEO agents give you a checklist. This one gives you
a diagnosis — specific, prioritized, immediately actionable.

**9-step methodology on every analysis:**
Intent classification → Topical authority gap → E-E-A-T audit → GEO structure →
Schema markup → Technical SEO → AI bot strategy → Internal linking → Prioritized quick wins

---

## Installation

### Option 1 — Paste system prompt anywhere (zero setup)

Copy [`agents/seo-geo/system.md`](./agents/seo-geo/system.md) into your LLM's
custom instructions or system prompt. Works in Claude, ChatGPT, Gemini, or any LLM.

### Option 2 — Claude Code plugin (auto-injects on relevant files)

```bash
claude plugin install github:BodegaoneAI/bodegaone-agents
```

The SEO/GEO agent automatically activates when you're editing `robots.txt`,
`sitemap.ts`, metadata files, schema markup, or blog content.

### Option 3 — MCP tool server (Claude Desktop, Cursor, VS Code, Windsurf)

```bash
npx bodegaone-agents --stdio
```

Add to your MCP config (`claude_desktop_config.json` or equivalent):

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

**Optional: Brave Search API for SERP analysis**
```bash
export BRAVE_SEARCH_API_KEY=your_key_here
```
Get a free key at [brave.com/search/api](https://brave.com/search/api) — 2,000 free queries/month.

---

## MCP Tools

When running as an MCP server, the following tools are available:

| Tool | What it does |
|---|---|
| `seo_fetch_page` | Fetches a live URL and extracts all SEO signals — title, meta, headings, schema types, word count, canonical, OG tags, issues list |
| `seo_check_schema` | Validates all JSON-LD structured data on a page against schema.org spec, flags missing high-value schemas |
| `seo_analyze_serp` | Analyzes top search results for a keyword to identify patterns and content gaps *(requires Brave Search API key)* |
| `seo_keyword_cluster` | Maps a topical cluster from a seed keyword — pillar page, supporting pages, long-tail queries, GEO opportunities |

---

## Example Usage

```
Analyze https://yoursite.com/blog/post for SEO and GEO. Give me quick wins first.
```

```
I want to rank for "best local AI IDE 2026". What's the content gap and
what would it take to own this keyword?
```

```
Why isn't my content being cited by Perplexity when users ask about [topic]?
```

```
Review this blog post for E-E-A-T signals and GEO citation potential. [paste content]
```

---

## Roadmap

Agents are added one at a time. Each one is built to be the best available for its domain.

| Agent | Status |
|---|---|
| SEO/GEO | ✅ Available |
| Content Writer | 🔜 Coming soon |
| Planner | 🔜 Coming soon |
| Designer | 🔜 Coming soon |
| Researcher | 🔜 Coming soon |

---

## Philosophy

One agent, done exceptionally well, beats ten mediocre ones.

Every agent in this repo is built from real production use — not theoretical checklists.
The SEO/GEO agent reflects patterns tested on actual sites with real rankings and AI
citation data. We use these agents ourselves before releasing them.

---

## Contributing

See an improvement? Open a PR. The bar is: does it make the agent give better advice
than it did before? If yes, it belongs here.

---

## Built by [Bodega One](https://bodegaone.ai)

Bodega One builds AI tools for developers and operators. These agents are a public
resource — free to use, fork, and build on.

**License:** MIT
