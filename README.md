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

### Planner Suite — Available Now

Three focused planning agents, one per problem. Each turns a fuzzy ask into a structured,
realistic plan, and each ships with a `plan_lint` mode that checks the draft for completeness.

- **[Project Planner](./agents/project-planner/)** — turns a goal into an execution plan:
  outcome milestones; tasks with owners, estimates, dependencies, and a definition of done; the
  critical path; a risk table; and one clear next action. It stays realistic about the people
  and time that actually exist.
- **[Business Strategy Planner](./agents/strategy-planner/)** — turns a business goal into a
  focused strategy: one target segment, sharp positioning in the customer's terms, one
  go-to-market wedge, a model, measurable metrics, and a cheap experiment for the riskiest
  assumption. It forces focus and names what you are deliberately not doing.
- **[Personal Planner](./agents/personal-planner/)** — turns a messy list and a fixed amount of
  time into a focused, time-blocked day or week: one most-important task, everything else
  deferred, delegated, or deleted, and a realistic, kind tone instead of a guilt trip.

---

### [Researcher Agent](./agents/researcher/) — Available Now

Turns a question into an honest, cited brief. Its defining rule is rigor: it cites every claim,
verifies load-bearing facts across independent sources, separates verified fact from inference
from speculation, labels confidence on every finding, and **never fabricates a source or a
statistic**. It treats "I could not verify this" as a finding, not a failure, and it surfaces
where good sources disagree instead of papering over it. Research feeds the strategy planner and
the content writer. Ships with `research_lint`, which checks a brief for unsourced claims, vague
attribution, source diversity, dates, confidence levels, and acknowledged uncertainty.

---

### [Designer Agent](./agents/designer/) — Available Now

Helps non-designers make interfaces that are clear, usable, accessible, and on-brand. It gives
specific, grounded decisions on visual hierarchy, typography, spacing, color, components and
their states, and responsive layout, and hands off design tokens and specs a developer can build
from. Accessibility is non-negotiable: every text and interactive color must meet WCAG AA
contrast, verified with the `design_lint` tool rather than eyeballed. It diagnoses the real
problem (usually hierarchy, spacing, or contrast, not "style") and is honest that final polish
needs real rendering and user testing.

---

## Why these exist

BodegaOne Agents are free and MIT-licensed, built to give the community the same caliber of
search, answer-engine, and content tooling that usually sits behind a subscription. The
principles:

- **Free and open.** MIT-licensed. Use them, fork them, ship them inside your own product. No
  seat fees, no upsell.
- **No data collection.** The agents run in your own LLM client, and the tools run on your own
  machine. Nothing you audit or write is sent to us. There is no telemetry.
- **Grounded in primary sources, not SEO folklore.** Every rule traces to official Google or
  Bing documentation or an AI-crawler operator's own docs. [`RESEARCH.md`](./agents/seo-geo/RESEARCH.md)
  shows the receipts.
- **Honest about what is dead.** We tell you when a tactic stopped working (FAQ and HowTo rich
  results are deprecated) instead of selling it back to you.
- **No lock-in.** The core of each agent is a plain-text system prompt. Paste it into Claude,
  ChatGPT, Gemini, or any model. The tools are optional.

### How they compare

| | Typical paid SEO tool / AI writer | BodegaOne Agents |
|---|---|---|
| Price | $50–500+/mo | Free, MIT |
| Where your data goes | Their servers | Your client, your machine |
| Source of its "best practices" | Recycled SEO blogs | Official Google/Bing + operator docs |
| Portability | Locked to their app | Paste the prompt into any model |
| Answer-engine + AI-citation coverage | Rare or bolted on | Built in (AEO + GEO) |

---

## Installation

Two agents, several ways to run them. Pick the row that matches how you work.

| You use | Best method |
|---|---|
| Any LLM (Claude, ChatGPT, Gemini) | **Method 1** — paste the system prompt |
| Claude Code | **Method 2** — install the plugin (agents + tools together) |
| Cursor, Claude Desktop, VS Code, any MCP client | **Method 3** — add the MCP server |
| Contributing or running from source | **Method 4** — clone and build |

### Method 1 — Paste the system prompt (zero setup, any LLM)

Copy the agent's `system.md` into your model's system prompt or custom instructions:

- SEO/AEO/GEO: [`agents/seo-geo/system.md`](./agents/seo-geo/system.md)
- Content Writer: [`agents/content-writer/system.md`](./agents/content-writer/system.md)

Works in Claude, ChatGPT (as a Custom GPT or a system prompt), Gemini (as a Gem), or any model
that accepts a system prompt. No tools, no server, no install.

### Method 2 — Claude Code plugin (recommended for Claude Code)

One install gives you both agents' auto-injecting skills, the editor hooks, and all the MCP
tools. Inside Claude Code, run:

```
/plugin marketplace add BodegaoneAI/bodegaone-agents
/plugin install bodegaone-agents@bodegaone
```

Skills auto-surface when you edit SEO or content files, and the tools are available in every
session. Update later with `/plugin marketplace update bodegaone`.

### Method 3 — MCP server in any MCP client (tools only)

Runs every tool (the six SEO analysis tools plus `content_lint`, `plan_lint`, `research_lint`,
`design_lint`, and `design_palette`) in any MCP client. It works today with no npm setup by
running straight from GitHub. The first run builds and caches (Node 20+ required); later runs are
instant.

**Claude Code (CLI):**
```bash
claude mcp add bodegaone-agents --scope user -- npx -y github:BodegaoneAI/bodegaone-agents --stdio
```

**Claude Desktop / Cursor / Windsurf / VS Code** — add to your client's MCP config:

```json
{
  "mcpServers": {
    "bodegaone-agents": {
      "command": "npx",
      "args": ["-y", "github:BodegaoneAI/bodegaone-agents", "--stdio"]
    }
  }
}
```

Claude Desktop config file location:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

> **Windows note:** if the server fails to start with an ENOENT error, wrap the command:
> set `"command": "cmd"` and `"args": ["/c", "npx", "-y", "github:BodegaoneAI/bodegaone-agents", "--stdio"]`.
> This is a known npx-on-Windows quirk in some MCP clients.

#### Optional: Brave Search API (for SERP tools)

`seo_analyze_serp` and the live mode of `seo_keyword_cluster` use a free Brave Search API key
([brave.com/search/api](https://brave.com/search/api), 2,000 queries/month). Pass it in the
MCP config so it works on every OS:

```json
{
  "mcpServers": {
    "bodegaone-agents": {
      "command": "npx",
      "args": ["-y", "github:BodegaoneAI/bodegaone-agents", "--stdio"],
      "env": { "BRAVE_SEARCH_API_KEY": "your_key_here" }
    }
  }
}
```

For the Claude Code CLI, add `--env BRAVE_SEARCH_API_KEY=your_key_here` before the `--`.
Without the key every other tool works normally, and keyword clustering falls back to planning mode.

### Method 4 — Run from source (contributors)

```bash
git clone https://github.com/BodegaoneAI/bodegaone-agents.git
cd bodegaone-agents
npm install
npm run build
npm test

# Run the MCP server from the built output
node dist/mcp/server.js --stdio

# Or run the TypeScript directly, no build step
npx tsx mcp/server.ts --stdio
```

> **Prefer the short `npx bodegaone-agents`?** Once this package is published to npm, swap
> `github:BodegaoneAI/bodegaone-agents` for `bodegaone-agents` in any command above. Until
> then, the GitHub form works with no extra setup.

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
| `plan_lint` | Checks a plan draft for completeness against a planner's standards. `type: project` (milestones, owners, estimates, dependencies, definition of done, risks, next action), `type: strategy` (measurable objective, target segment, positioning, GTM, pricing, metrics, assumptions), or `type: personal` (one top priority, manageable load, time-blocking, boundaries). Returns a Pass/Warn/Fail scorecard with fixes | — |
| `research_lint` | Checks a research brief for rigor: unsourced claims and statistics, vague attribution ("studies show", "experts say"), source diversity, dated sources, confidence levels, and acknowledged uncertainty. Returns a Pass/Warn/Fail scorecard plus specific fixes | — |
| `design_lint` | Checks foreground/background color pairs for WCAG contrast. Returns the exact ratio and AA/AAA pass or fail for each pair (normal or large text) with fixes, so your palette is accessible before the colors spread through the design | — |
| `design_palette` | Generates an accessible, harmonious palette from a base color and a harmony type (complementary, analogous, triadic, split-complementary, tetradic, monochromatic): brand color, accents, a tinted neutral ramp, semantic colors, every swatch contrast-checked, plus ready-to-paste CSS variables | — |

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
| Project Planner | Available |
| Business Strategy Planner | Available |
| Personal Planner | Available |
| Researcher | Available |
| Designer | Available |

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
