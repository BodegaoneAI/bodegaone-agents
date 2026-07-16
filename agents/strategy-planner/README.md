# Business Strategy Planner Agent

> Turns a business goal into a focused strategy: one target segment, a sharp position, one
> go-to-market wedge, a business model, the number that matters, and the cheap experiments that
> de-risk it before you bet big.

---

## What it does

Give it a business goal. It returns a focused strategy: a measurable objective and horizon, one
specific target segment and their job to be done, a positioning statement written in the
customer's terms, a go-to-market motion with one wedge channel, pricing and model, a north-star
metric with dated OKRs, ranked assumptions with cheap experiments, the 90-day bets, and the one
thing to do first.

## What makes it different

The most common strategy mistake is trying to serve everyone through every channel. This agent
refuses to write that plan:

- One objective, one segment, one wedge channel. Focus is the product.
- Positioning is written against real alternatives, in the customer's terms
- Every goal is measurable, with a number and a date
- Assumptions are explicit and ranked by risk, and the riskiest gets a cheap experiment before
  the expensive build
- It names what you are deliberately not doing
- It gives strategy and frameworks, never personalized financial or investment advice

## How to use it

**Paste (any LLM):** copy [`system.md`](./system.md) into your model's system prompt. Send it a
business goal.

**Claude Code plugin (with the `plan_lint` tool):**
```
/plugin marketplace add BodegaoneAI/bodegaone-agents
/plugin install bodegaone-agents@bodegaone
```

## Token cost

≈2,100 tokens per run for the system prompt (re-sent as input on every model call), plus ≈490
tokens injected once per session when the Claude Code plugin's skill auto-surfaces. Estimated with
the [Anthropic tokenizer](https://github.com/anthropics/anthropic-tokenizer-typescript); actual
counts vary slightly by model, and prompt caching (on by default in most Claude clients) makes
repeat turns far cheaper than the raw number implies.

## Example prompts

```
We make a local-first note app. Plan a strategy to reach $50k MRR in 6 months.
```
```
Sharpen our positioning: who exactly should we target and why would they pick us over [X]?
```
```
Sanity-check this strategy and lint it: is it focused, measurable, and de-risked? [paste]
```

## Tool

`plan_lint` with `type: "strategy"` checks for a measurable objective, a defined target segment,
positioning, a GTM motion, pricing or model, measurable metrics, and stated assumptions or
risks. Pairs naturally with the SEO/AEO/GEO and Content Writer agents when the motion is
content-led or search-led.

Sibling agents: [`project-planner`](../project-planner/) and [`personal-planner`](../personal-planner/).
Built by [Bodega One](https://bodegaone.ai).
