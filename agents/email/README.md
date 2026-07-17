# Email / Newsletter Agent

> Writes lifecycle emails and newsletters that land in the inbox and get one click.
> The delivery-side counterpart to this repo's Content Writer: that one writes pages that rank,
> this one writes messages that arrive, open, and convert.

---

## What it does

Give it an email type, an offer, or a rough draft. It returns a complete, ready-to-send package:

- **Subject line options** (3, each ~≤40 chars) and a **preheader** (40–100 chars)
- The **full body** in clean, scannable text: the point and one primary call to action in the
  first screen, short paragraphs, descriptive link anchors
- A compliant **footer** with the unsubscribe and physical postal address for marketing mail
- A **self-lint scorecard** and **fact-check flags**
- A **deliverability-setup checklist** for the requirements that live outside the body

It writes for three targets at once:

- **Delivery** so the message reaches the inbox, not the spam folder
- **Open** so a short, honest subject and preheader earn the tap
- **Act** so an inverted-pyramid body with one primary CTA gets the click

---

## What makes it different

It self-checks. Most AI email tools hand you copy and stop. This agent runs its own draft through
`email_lint` and fixes what it flags until the draft passes, so you get an email that is already
clean:

- No spam-trigger words, ALL-CAPS shouting, or "!!!" that trip filters
- A subject that fits a mobile inbox and a preheader that extends it
- The unsubscribe and physical postal address a marketing email legally needs
- Real text instead of one big image, and descriptive links instead of "click here"
- The deliverability requirements (SPF, DKIM, DMARC, one-click unsubscribe) surfaced up front

It also knows the distinction most tools miss: transactional email (receipts, password resets,
shipping notices) is exempt from the unsubscribe rule, so it lints those on the right track instead
of flagging a footer they do not need.

---

## How to use it

### Option 1: Paste the system prompt (any LLM)
Copy `system.md` into your system prompt or custom instructions. Send it an email type, offer, or
draft. Works in Claude, ChatGPT, Gemini, or any model.

### Option 2: MCP tool server (Claude Code, Cursor, Claude Desktop, VS Code)
Runs straight from GitHub, no npm publish needed (Node 20+; first run builds and caches):
```bash
claude mcp add bodegaone-agents --scope user -- npx -y github:BodegaoneAI/bodegaone-agents --stdio
```
This unlocks `email_lint` (the draft checker) alongside the other tools in the server. See the repo
root README for per-client config paths.

### Option 3: Claude Code plugin (agents + tools in one install)
Installs every agent's skills, the hooks, and all the MCP tools. Inside Claude Code:
```
/plugin marketplace add BodegaoneAI/bodegaone-agents
/plugin install bodegaone-agents@bodegaone
```
The skill auto-surfaces when you edit email files (newsletters, `.mjml`, email directories).

---

## Token cost

≈3,800 tokens per run for the system prompt (re-sent as input on every model call), plus ≈830
tokens injected once per session when the Claude Code plugin's skill auto-surfaces. Estimated with
the [Anthropic tokenizer](https://github.com/anthropics/anthropic-tokenizer-typescript); actual
counts vary slightly by model, and prompt caching (on by default in most Claude clients) makes
repeat turns far cheaper than the raw number implies.

---

## Example prompts

**Write a welcome email:**
```
Write a welcome email for people who just joined our coffee-shop list. One action: browse the July
menu. Marketing. Return the full package and lint it.
```

**Write a newsletter:**
```
Draft this month's newsletter with three items (new specials, weekend hours, a staff pick). One hero
CTA up top. Give me 3 subject options and a preheader, then lint it.
```

**Fix a draft that lands in spam:**
```
Review and rewrite this email to pass the deliverability spec. Cut the spam-trigger words, shorten the
subject, add the footer. [paste draft]
```

**Transactional notice:**
```
Write a shipping-confirmation email. Transactional, facts-first, no marketing padding. Lint it as
transactional.
```

---

## Tools it uses

| Tool | What it does |
|---|---|
| `email_lint` | Lints an email against the Gmail/Yahoo rules, CAN-SPAM, and RFC 8058 and returns a Pass/Warn/Fail scorecard, specific fixes, and a deliverability-setup checklist |

The deliverability items `email_lint` reports (SPF, DKIM, DMARC, one-click unsubscribe headers, a low
complaint rate) live in your sending setup, not the body, so the agent surfaces them as advisories to
confirm before you send at scale.

---

## Compliance note

The compliance guidance here is general, not legal advice. CAN-SPAM and the mailbox-provider rules
change, and your obligations depend on where you and your recipients are. Confirm the specifics with
each provider's current documentation and with qualified counsel before sending at scale.

---

## Files

- `system.md` - the full agent system prompt (paste this anywhere)
- `README.md` - this file

Companion agent: [`agents/content-writer`](../content-writer/). Built by [Bodega One](https://bodegaone.ai).
