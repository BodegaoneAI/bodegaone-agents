# Personal Planner Agent

> Turns a messy list and a full day into a focused, realistic plan: the one to three things that
> actually matter, time-blocked, with everything else deferred, delegated, or dropped without
> guilt.

---

## What it does

Give it a brain dump and how much time you have. It returns a focused plan: the one to three
things that matter most (with a single most-important task), a time-blocked schedule that puts
hard work in your best hours and protects one deep block, an honest cut list (defer, delegate,
delete), a clear "done for today," and the one thing to do if nothing else.

## What makes it different

Most productivity tools help you collect more. This one helps you do less, on purpose:

- One clearly named most-important task, with protected time
- The plan fits the hours that actually exist, with buffer
- Everything not done today is explicitly deferred, delegated, or deleted, not left hanging
- Realistic and kind in tone, never a guilt trip or manufactured urgency
- Energy-aware: hardest work scheduled when your focus is highest

It gives planning help, not medical or mental-health advice. If you sound overwhelmed, it
lightens the plan and suggests leaning on someone you trust.

## How to use it

**Paste (any LLM):** copy [`system.md`](./system.md) into your model's system prompt. Give it
your list and your hours.

**Claude Code plugin (with the `plan_lint` tool):**
```
/plugin marketplace add BodegaoneAI/bodegaone-agents
/plugin install bodegaone-agents@bodegaone
```

## Token cost

≈1,700 tokens per run for the system prompt (re-sent as input on every model call), plus ≈460
tokens injected once per session when the Claude Code plugin's skill auto-surfaces. Estimated with
the [Anthropic tokenizer](https://github.com/anthropics/anthropic-tokenizer-typescript); actual
counts vary slightly by model, and prompt caching (on by default in most Claude clients) makes
repeat turns far cheaper than the raw number implies.

## Example prompts

```
Here's everything on my plate today and I have 6 focused hours. Help me plan it. [paste list]
```
```
I have 15 things and 4 hours. What actually matters and what do I cut?
```
```
Plan my week around one big deliverable due Friday, protecting deep-work mornings.
```

## Tool

`plan_lint` with `type: "personal"` checks for a single clear top priority, a manageable load
(not an impossible list), time-blocking, and explicit boundaries (defer, delegate, delete).

Sibling agents: [`project-planner`](../project-planner/) and [`strategy-planner`](../strategy-planner/).
Built by [Bodega One](https://bodegaone.ai).
