# Accessibility (a11y) Auditor Agent

> Audits HTML and components against WCAG 2.2 and the ARIA Authoring Practices, and hands back a
> prioritized fix list with the exact success criterion and level behind each finding.
> The accessibility counterpart to this repo's Designer agent: that one builds accessible
> foundations and owns color contrast, this one audits the rendered markup for everything else.

---

## What it does

Give it an HTML snippet, a component, or a full page. It returns a prioritized accessibility audit:

- **A Pass/Warn/Fail scorecard** across Images, Structure & Headings, Forms & Labels, Links &
  Buttons, ARIA & Interaction, and (for full pages) Document-level checks
- **Findings sorted into blocker / serious / moderate**, each with the specific fix
- **A WCAG success criterion and level (A or AA) on every finding**, so official requirements are
  clearly separated from best practices
- **Specific fixes that quote the offending tag**
- **An honest manual-testing list** of what static analysis cannot confirm

It audits against **WCAG 2.2 (W3C, published 2023-10-05)** at level AA by default: image alt text
[1.1.1], heading structure [1.3.1], form labels [3.3.2 / 4.1.2], discernible link and button text
[2.4.4 / 4.1.2], common ARIA mistakes [4.1.2 + ARIA APG], and page language, title, and viewport
zoom for full pages [3.1.1 / 2.4.2 / 1.4.4].

---

## What makes it different

It cites its sources and it knows its limits. Most "accessibility checkers" hand you a pile of
warnings with no priority and imply that a green scan means an accessible product. This agent does
neither:

- **Every finding names the WCAG criterion and level.** You can tell an official level A/AA
  requirement from a judgment call at a glance.
- **It triages.** Blockers first (an unlabeled checkout field), then serious, then best-practice
  cleanup, ordered by how many users and pages a fix touches.
- **It is honest about coverage.** Automated static checks catch only part of the picture, roughly
  a third of WCAG issues. It always names what still needs a keyboard and a screen reader:
  keyboard order, focus management, and screen-reader semantics.
- **It stays in its lane.** Color contrast [1.4.3] belongs to the Designer agent's `design_lint`
  tool, and target size [2.5.8] needs the rendered layout, so it hands those off instead of
  guessing.

---

## How to use it

### Option 1: Paste the system prompt (any LLM)
Copy `system.md` into your system prompt or custom instructions. Paste the HTML you want audited.
Works in Claude, ChatGPT, Gemini, or any model.

### Option 2: MCP tool server (Claude Code, Cursor, Claude Desktop, VS Code)
Runs straight from GitHub, no npm publish needed (Node 20+; first run builds and caches):
```bash
claude mcp add bodegaone-agents --scope user -- npx -y github:BodegaoneAI/bodegaone-agents --stdio
```
This unlocks `a11y_lint` (the markup auditor) alongside `design_lint` for color contrast. See the
repo root README for per-client config paths.

### Option 3: Claude Code plugin (agents + tools in one install)
Installs every agent's skills, the hooks, and all the MCP tools. Inside Claude Code:
```
/plugin marketplace add BodegaoneAI/bodegaone-agents
/plugin install bodegaone-agents@bodegaone
```
The skill auto-surfaces when you edit accessibility files (a11y directories, `*.a11y.*`, `A11Y.md`,
accessibility folders, ARIA-related files).

---

## Token cost

≈3,800 tokens per run for the system prompt (re-sent as input on every model call), plus ≈870
tokens injected once per session when the Claude Code plugin's skill auto-surfaces. Estimated with
the [Anthropic tokenizer](https://github.com/anthropics/anthropic-tokenizer-typescript); actual
counts vary slightly by model, and prompt caching (on by default in most Claude clients) makes
repeat turns far cheaper than the raw number implies.

---

## Example prompts

**Audit a component:**
```
Audit this navbar for accessibility and tell me what to fix first. [paste HTML]
```

**Audit a full page:**
```
Run a full-document accessibility audit on this page, target level AA. [paste HTML]
```

**Check one thing:**
```
Does this input need a label, and what's the right way to add one? [paste input markup]
```

**Fix and re-check:**
```
Here's the markup with your fixes applied. Re-run the audit and confirm it passes. [paste HTML]
```

---

## Tools it uses

| Tool | What it does |
|---|---|
| `a11y_lint` | Statically audits HTML against WCAG 2.2 (A/AA) and the ARIA APG; returns a Pass/Warn/Fail scorecard plus fixes that quote the offending tag. Set `isFullDocument: true` for a whole page. |
| `design_lint` | The sibling Designer tool for color contrast (WCAG 1.4.3). Contrast is not in `a11y_lint`; hand it hex pairs instead. |

Automated static analysis catches roughly a third of accessibility issues. After a clean scan,
test with a keyboard and a screen reader, and measure target sizes in the browser. This agent is
engineering guidance, not legal advice.

---

## Files

- `system.md` - the full agent system prompt (paste this anywhere)
- `README.md` - this file

Companion agent: [`agents/designer`](../designer/). Built by [Bodega One](https://bodegaone.ai).
