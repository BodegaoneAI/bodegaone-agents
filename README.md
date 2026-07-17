# BodegaOne Agents

> Specialized AI agents built for operators and founders. One agent at a time, done exceptionally well.

---

## Agents

> **Token cost** — each agent lists the extra context it adds, estimated with the
> [Anthropic tokenizer](https://github.com/anthropics/anthropic-tokenizer-typescript). Two figures:
> **system prompt** is loaded when you run the agent (Method 1 paste, or invoking it as a subagent)
> and re-sent as input on every model call — this is the main per-run cost; **skill** is injected
> once per session by the Claude Code plugin (Method 2) when you touch a matching file, then deduped
> for the rest of that session. Figures are estimates and vary slightly by model; prompt caching
> (on by default in most Claude clients) makes repeat turns far cheaper than the raw number implies.

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

**Token cost:** ≈16,700 tokens/run (system prompt) · ≈1,100 tokens once per session (auto-injected skill)

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

**Token cost:** ≈3,900 tokens/run (system prompt) · ≈760 tokens once per session (auto-injected skill)

---

### Planner Suite — Available Now

Three focused planning agents, one per problem. Each turns a fuzzy ask into a structured,
realistic plan, and each ships with a `plan_lint` mode that checks the draft for completeness.

- **[Project Planner](./agents/project-planner/)** — turns a goal into an execution plan:
  outcome milestones; tasks with owners, estimates, dependencies, and a definition of done; the
  critical path; a risk table; and one clear next action. It stays realistic about the people
  and time that actually exist. **Token cost:** ≈1,850 tokens/run (system prompt) · ≈510 once per session (skill).
- **[Business Strategy Planner](./agents/strategy-planner/)** — turns a business goal into a
  focused strategy: one target segment, sharp positioning in the customer's terms, one
  go-to-market wedge, a model, measurable metrics, and a cheap experiment for the riskiest
  assumption. It forces focus and names what you are deliberately not doing. **Token cost:** ≈2,100 tokens/run (system prompt) · ≈490 once per session (skill).
- **[Personal Planner](./agents/personal-planner/)** — turns a messy list and a fixed amount of
  time into a focused, time-blocked day or week: one most-important task, everything else
  deferred, delegated, or deleted, and a realistic, kind tone instead of a guilt trip. **Token cost:** ≈1,700 tokens/run (system prompt) · ≈460 once per session (skill).

---

### [Researcher Agent](./agents/researcher/) — Available Now

Turns a question into an honest, cited brief. Its defining rule is rigor: it cites every claim,
verifies load-bearing facts across independent sources, separates verified fact from inference
from speculation, labels confidence on every finding, and **never fabricates a source or a
statistic**. It treats "I could not verify this" as a finding, not a failure, and it surfaces
where good sources disagree instead of papering over it. Research feeds the strategy planner and
the content writer. Ships with `research_lint`, which checks a brief for unsourced claims, vague
attribution, source diversity, dates, confidence levels, and acknowledged uncertainty.

**Token cost:** ≈2,900 tokens/run (system prompt) · ≈640 tokens once per session (auto-injected skill)

---

### [Designer Agent](./agents/designer/) — Available Now

Helps non-designers make interfaces that are clear, usable, accessible, and on-brand. It gives
specific, grounded decisions on visual hierarchy, typography, spacing, color, components and
their states, and responsive layout, and hands off design tokens and specs a developer can build
from. Accessibility is non-negotiable: every text and interactive color must meet WCAG AA
contrast, verified with the `design_lint` tool rather than eyeballed. It diagnoses the real
problem (usually hierarchy, spacing, or contrast, not "style") and is honest that final polish
needs real rendering and user testing.

**Token cost:** ≈3,700 tokens/run (system prompt) · ≈670 tokens once per session (auto-injected skill)

---

### [Social / Short-form Agent](./agents/social/) — Available Now

Repurposes long-form content into platform-native posts for X, LinkedIn, Instagram, and Threads.
The distribution counterpart to the Content Writer: that one writes the piece once, this one turns
it into feed-ready posts, hook-first and one idea each. It self-checks every post with `social_lint`:
official per-platform character limits (X 280, Threads 500, LinkedIn 3,000, Instagram 2,200, with
thread posts checked one by one), a hook that lands before the "…more" fold, hashtag discipline, a
real CTA, and no engagement-bait or emoji walls. It also knows a raw link in an X post can cut reach,
and moves it to a reply.

**Token cost:** ≈3,500 tokens/run (system prompt) · ≈750 tokens once per session (auto-injected skill)

---

### [Email / Newsletter Agent](./agents/email/) — Available Now

Writes lifecycle emails and newsletters that reach the inbox and earn the click, grounded in the
Gmail/Yahoo bulk-sender rules, CAN-SPAM, and RFC 8058 — not folklore. It returns subject options, a
preheader, an inverted-pyramid body with one primary CTA, and a compliant footer, then self-checks
with `email_lint`: subject and preheader length, spam-trigger words, the unsubscribe link and postal
address a marketing email needs, and a deliverability-setup checklist (SPF, DKIM, DMARC, one-click
unsubscribe) for the requirements that live outside the body. It knows transactional mail is exempt
from the unsubscribe rule and lints it on the right track.

**Token cost:** ≈3,800 tokens/run (system prompt) · ≈830 tokens once per session (auto-injected skill)

---

### [Accessibility (a11y) Auditor Agent](./agents/a11y/) — Available Now

Audits HTML and components against WCAG 2.2 (W3C) and the ARIA Authoring Practices, extending the
Designer agent past color contrast. It returns a prioritized fix list — blocker, serious, moderate —
with the exact success criterion and level (A/AA) behind each finding, so official requirements are
separated from best practices. `a11y_lint` statically checks image alt text, heading structure, form
labels, discernible link and button names, common ARIA mistakes, and page-level language, title, and
zoom. It is honest that static analysis catches roughly a third of issues and names what still needs
a keyboard and a screen reader; color contrast stays in `design_lint`.

**Token cost:** ≈3,800 tokens/run (system prompt) · ≈870 tokens once per session (auto-injected skill)

---

### [Ad Copy / Paid Media Agent](./agents/ad-copy/) — Available Now

Writes Google Responsive Search Ads and Meta ad copy that fit the platforms' asset specs and ad
policies, completing the search stack: the SEO/GEO agent owns organic, this one owns paid. It returns
headlines and descriptions with character counts, Meta primary text, and a UTM-tagged URL, then
self-checks with `ad_lint`: official character limits (Google 15 headlines ≤30 chars, 4 descriptions
≤90 chars), ad-policy compliance (no all-caps, gimmicky punctuation, or unprovable "#1"), one clear
CTA, and the three core UTM parameters. It corrects the myth that Meta still enforces the 20%
image-text rule (removed in 2020) and is clear that a lint pass is not ad approval.

**Token cost:** ≈4,000 tokens/run (system prompt) · ≈760 tokens once per session (auto-injected skill)

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

Eleven agents, several ways to run them. Pick the row that matches how you work.

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
- Every other agent works the same way — `agents/<name>/system.md` for `project-planner`,
  `strategy-planner`, `personal-planner`, `researcher`, `designer`, `social`, `email`, `a11y`,
  and `ad-copy`.

Works in Claude, ChatGPT (as a Custom GPT or a system prompt), Gemini (as a Gem), or any model
that accepts a system prompt. No tools, no server, no install.

### Method 2 — Claude Code plugin (recommended for Claude Code)

One install gives you every agent's auto-injecting skills, the editor hooks, and all the MCP
tools. Inside Claude Code, run:

```
/plugin marketplace add BodegaoneAI/bodegaone-agents
/plugin install bodegaone-agents@bodegaone
```

Skills auto-surface when you edit relevant files (SEO, content, email, social, ad, accessibility,
and planning), and the tools are available in every session. Update later with
`/plugin marketplace update bodegaone`.

### Method 3 — MCP server in any MCP client (tools only)

Runs every tool (the six SEO analysis tools plus `content_lint`, `plan_lint`, `research_lint`,
`design_lint`, `design_palette`, `social_lint`, `email_lint`, `a11y_lint`, and `ad_lint`) in any
MCP client. It works today with no npm setup by
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
| `social_lint` | Lints a social/short-form post or thread for a platform (X, LinkedIn, Instagram, Threads): official character limits (per thread post), hook placement before the truncation fold, hashtag discipline, CTA, engagement-bait, all-caps, and emoji walls. Returns a Pass/Warn/Fail scorecard plus fixes | — |
| `email_lint` | Lints an email draft against the Gmail/Yahoo sender rules, CAN-SPAM, and RFC 8058: subject and preheader length, spam-trigger words, the unsubscribe link and postal address (marketing), and link/text balance. Returns a scorecard, fixes, and a deliverability-setup checklist. Transactional mode skips the unsubscribe requirement | — |
| `a11y_lint` | Statically audits HTML against WCAG 2.2 (A/AA) and the ARIA APG: image alt text, one-H1 and heading order, form labels, discernible link and button names, ARIA misuse, and page language/title/zoom (`isFullDocument`). Returns a scorecard plus fixes that quote the offending tag. Color contrast lives in `design_lint` | — |
| `ad_lint` | Lints Google Responsive Search Ads or Meta ad copy against official character specs, ad policy (no gimmicky caps/punctuation or unprovable superlatives), CTA presence, and UTM tracking on the destination URL. Returns a Pass/Warn/Fail scorecard plus specific fixes | — |

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

| Agent | Status | System prompt / run | Skill / session |
|---|---|---|---|
| SEO / AEO / GEO | Available | ≈16,700 | ≈1,100 |
| Content Writer | Available | ≈3,900 | ≈760 |
| Project Planner | Available | ≈1,850 | ≈510 |
| Business Strategy Planner | Available | ≈2,100 | ≈490 |
| Personal Planner | Available | ≈1,700 | ≈460 |
| Researcher | Available | ≈2,900 | ≈640 |
| Designer | Available | ≈3,700 | ≈670 |
| Social / Short-form | Available | ≈3,500 | ≈750 |
| Email / Newsletter | Available | ≈3,800 | ≈830 |
| Accessibility (a11y) | Available | ≈3,800 | ≈870 |
| Ad Copy / Paid Media | Available | ≈4,000 | ≈760 |

Token figures are estimates (Anthropic tokenizer); see [Agents](#agents) for how each is counted.

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
