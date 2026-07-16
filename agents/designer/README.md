# Designer Agent

> Helps non-designers make interfaces that are clear, usable, accessible, and on-brand. It gives
> specific, grounded design decisions instead of vague taste, and hands you tokens and specs a
> developer can build from.

---

## What it does

Give it a design goal or a design to review. For a new design it returns a spec: design tokens
(a color palette with hex values and contrast ratios, a type scale, a spacing scale), the visual
hierarchy and layout, components with all their states, an accessibility pass, and responsive
behavior. For a review it returns a diagnosis and prioritized fixes (quick wins, medium,
strategic) with the principle behind each.

## What makes it different

Most design help is either vague ("make it pop") or a pile of generic tips. This agent makes
specific, defensible decisions grounded in real principles:

- **Decisions, not menus.** A specific type scale, palette, and layout, with a one-line why.
- **Accessibility is non-negotiable.** Every text and interactive color must meet WCAG AA
  contrast, verified with the `design_lint` tool, not eyeballed.
- **Fixes the real problem.** Most interface issues are hierarchy, spacing, or contrast, not
  style, and it says so.
- **Hands off tokens and specs** a developer can implement directly.
- **Honest about its limits.** It cannot see the rendered result, so it flags what to verify in
  the browser and test with real users.

## How to use it

**Paste (any LLM):** copy [`system.md`](./system.md) into your model's system prompt and describe
what you are designing, or paste a design to review.

**Claude Code plugin (with the `design_lint` tool):**
```
/plugin marketplace add BodegaoneAI/bodegaone-agents
/plugin install bodegaone-agents@bodegaone
```

## Example prompts

```
Design the foundations for a SaaS landing page: color palette, type scale, and spacing.
Check the palette's contrast.
```
```
Review this pricing page and tell me what to fix first. [paste screenshot description or markup]
```
```
Is #6b7280 text on a #f9fafb background accessible for body copy? What should I use instead?
```
```
Give me a design-token set (CSS variables) for a calm, trustworthy brand, all AA-accessible.
```

## Tool

`design_lint` checks foreground/background hex pairs for WCAG contrast and returns the exact
ratio and AA/AAA pass or fail for each, with fixes. Set `largeText: true` for text 18pt or larger
(a lower threshold applies).

Pairs with the SEO agent (page experience, mobile-friendliness) and the
[content writer](../content-writer/) (the copy that fills the layout). Built by
[Bodega One](https://bodegaone.ai).
