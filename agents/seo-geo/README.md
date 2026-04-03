# SEO/GEO Agent

> The most comprehensive SEO + Generative Engine Optimization agent available.
> Built for founders, operators, and content teams who need results, not theory.

---

## What it does

This agent combines traditional SEO expertise with deep knowledge of how AI search
engines (Perplexity, ChatGPT Search, Gemini, Copilot, Claude) discover and cite content.
It follows a 9-step methodology on every analysis:

1. Intent classification
2. Topical authority gap analysis
3. E-E-A-T audit (Google's quality signals)
4. GEO structure audit (AI citation optimization)
5. Schema markup audit
6. Technical SEO audit
7. AI bot strategy
8. Internal linking audit
9. Prioritized quick wins

---

## How to use it

### Option 1 — Paste into any LLM (Claude, ChatGPT, Gemini)
Copy the contents of `system.md` into your Custom Instructions or System Prompt.
Then send it a URL, keyword, or piece of content.

### Option 2 — Claude Code (with MCP tools)
```bash
# Install the plugin
claude plugin install github:BodegaoneAI/bodegaone-agents

# The agent auto-injects when you're working on SEO-related files
```

### Option 3 — Any MCP client (Cursor, Claude Desktop, VS Code)
```bash
# Run the tool server locally
npx bodegaone-agents --stdio
```

Add to your MCP config:
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

---

## Example prompts

**Analyze a live page:**
```
Analyze https://example.com/blog/my-post for SEO and GEO. Give me quick wins first.
```

**Audit a keyword opportunity:**
```
I want to rank for "best local AI IDE 2026". What's the content gap and what would
it take to own this keyword?
```

**Review content before publishing:**
```
Review this blog post draft for SEO and GEO. Flag anything that would hurt E-E-A-T
or reduce AI citation potential. [paste content]
```

**Fix a specific technical issue:**
```
My page is in the sitemap but noindexed. What's causing this and how do I fix it?
```

**GEO-specific audit:**
```
Why isn't my content being cited by Perplexity when users ask about [topic]?
What needs to change?
```

---

## What makes this different

Most SEO agents give you a checklist. This one gives you a diagnosis.

| Generic SEO agent | This agent |
|---|---|
| "Add keywords to your title" | Identifies the specific keyword, explains intent fit, tells you the exact title to write |
| "Improve your content quality" | Runs E-E-A-T audit, flags specific sentences, identifies missing author attribution |
| "Use structured data" | Identifies which schema types are missing, provides the exact JSON-LD to add |
| No GEO knowledge | Knows how Perplexity, ChatGPT, Gemini, and Copilot select citations |
| Generic checklist output | Prioritized: Quick Wins / Medium Term / Strategic Moves |

---

## MCP Tools (optional, extends capabilities)

When the MCP server is running, the agent gains access to:

| Tool | What it does |
|---|---|
| `seo_fetch_page` | Fetches a live URL and extracts all SEO signals |
| `seo_check_schema` | Validates structured data against schema.org spec |
| `seo_analyze_serp` | Analyzes top results for a keyword (requires Brave Search API key) |
| `seo_keyword_cluster` | Builds topical cluster from a seed keyword |

Tools requiring API keys will prompt you to set the relevant env var if missing.

---

## Built by Bodega One

This agent is maintained by [Bodega One](https://bodegaone.ai) and built from
real-world SEO work on production sites. Every pattern in `system.md` has been
tested against actual rankings and AI citation behavior.
