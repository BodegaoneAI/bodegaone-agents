# Ad Copy / Paid Media Agent

> Writes Google Responsive Search Ads and Meta ad copy that fit the platforms' asset specs and
> ad policies on the first submission. It completes the search stack in this repo: the SEO/GEO
> agent owns organic, this one owns paid.

---

## What it does

Give it a product, an offer, and a platform. It returns a launch-ready ad package:

- The **platform** (Google RSA or Meta) it is built for
- **Headlines** with character counts (Google: up to 15, each ≤30; Meta: one, ≤~40)
- **Descriptions** with character counts (Google: up to 4, each ≤90; Meta: link description ≤~30)
- **Primary text** for Meta, with the pre-"See more" hook length noted
- A **UTM-tagged final URL** with `utm_source`, `utm_medium`, and `utm_campaign`
- A **self-lint scorecard** and **assumptions & flags**

It writes to two paid platforms:

- **Google Responsive Search Ads** so assets stay in spec and read correctly in any combination
- **Meta (Facebook / Instagram)** so the hook and offer land before the "See more" fold

---

## What makes it different

It self-checks. Most copy tools hand you headlines and stop. This agent runs its own ad through
`ad_lint` and fixes what it flags until the ad passes, so you get copy that is already clean:

- Every headline and description trimmed to the platform's character limit
- No all-caps emphasis, no gimmicky punctuation, no exclamation mark in a Google headline
- No unprovable superlative ("best", "#1") without cited proof
- One clear call to action and a concrete number or offer, not generic filler
- A destination URL tagged with the three core UTM parameters for clean attribution

It also knows what most guides get wrong: **Meta removed the 20% image-text rule in 2020**, so it
never shrinks copy or rejects a creative to chase a limit that no longer exists. And it is honest
about the boundary: passing the linter is not ad approval, because only the platform's own review
approves an ad.

---

## How to use it

### Option 1: Paste the system prompt (any LLM)
Copy `system.md` into your system prompt or custom instructions. Send it a product, an offer, and
a platform. Works in Claude, ChatGPT, Gemini, or any model.

### Option 2: MCP tool server (Claude Code, Cursor, Claude Desktop, VS Code)
Runs straight from GitHub, no npm publish needed (Node 20+; first run builds and caches):
```bash
claude mcp add bodegaone-agents --scope user -- npx -y github:BodegaoneAI/bodegaone-agents --stdio
```
This unlocks `ad_lint` (the ad checker) alongside the other BodegaOne tools. See the repo root
README for per-client config paths.

### Option 3: Claude Code plugin (agents + tools in one install)
Installs every agent's skills, the hooks, and all the MCP tools. Inside Claude Code:
```
/plugin marketplace add BodegaoneAI/bodegaone-agents
/plugin install bodegaone-agents@bodegaone
```
The skill auto-surfaces when you edit ad files (campaign directories, `*.ads.md`, `ADS.md`).

---

## Token cost

≈4,000 tokens per run for the system prompt (re-sent as input on every model call), plus ≈760
tokens injected once per session when the Claude Code plugin's skill auto-surfaces. Estimated with
the [Anthropic tokenizer](https://github.com/anthropics/anthropic-tokenizer-typescript); actual
counts vary slightly by model, and prompt caching (on by default in most Claude clients) makes
repeat turns far cheaper than the raw number implies.

---

## Example prompts

**Write a Google RSA:**
```
Write a Google Responsive Search Ad for a same-day grocery delivery service. Offer: $20 off the
first order. Landing URL https://bodega.example/order. Return the full package and lint it.
```

**Write a Meta ad:**
```
Write a Meta ad (primary text, headline, link description) for the same offer, cold audience.
Front-load the hook and keep it in spec. UTM-tag the URL and lint it.
```

**Fix an existing ad:**
```
Review and fix these headlines to pass Google policy: strip the all-caps and the exclamation
marks, cut anything over 30 characters, and add UTM tracking. [paste ad]
```

**Both platforms at once:**
```
Write the Google RSA and the Meta ad for this launch from the same offer. Keep each in its own
platform's spec and lint both.
```

---

## Tools it uses

| Tool | What it does |
|---|---|
| `ad_lint` | Lints Google RSA or Meta copy against character specs, ad policy, CTA, and UTM tracking, and returns a Pass/Warn/Fail scorecard plus line-level fixes |

A PASS means the copy is clean against these checks, not that the platform approved the ad; the
platform's own human and automated review still applies. After the click lands, hand off to the
**SEO/GEO agent** to audit the landing page and the **Content Writer** to strengthen the page copy.

---

## Files

- `system.md` - the full agent system prompt (paste this anywhere)
- `README.md` - this file

Companion agents: [`agents/seo-geo`](../seo-geo/) and [`agents/content-writer`](../content-writer/).
Built by [Bodega One](https://bodegaone.ai).
