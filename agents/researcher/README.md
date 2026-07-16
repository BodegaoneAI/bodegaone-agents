# Researcher Agent

> Gathers, verifies, and synthesizes information into an honest, cited brief. Its defining rule
> is rigor: cite every claim, verify across independent sources, separate fact from inference
> from speculation, label confidence, and never fabricate a source or a statistic.

---

## What it does

Give it a question. It returns a structured brief: the question restated with scope, a bottom
line with an overall confidence level, key findings each with a named source and a confidence
rating, contradictions and open questions, a dated source list, the caveats, and an explicit
"could not verify" section. It answers the question that was asked and flags where it cannot.

## What makes it different

Most AI research sounds confident whether or not it should be. This agent is built for the
opposite:

- **Never fabricates.** No invented sources, statistics, quotes, or dates, under any framing.
- **Cites everything.** No "studies show" or "experts say" without naming the study or expert.
- **Verifies across independent sources** and flags single-source claims.
- **Separates verified fact, reasonable inference, and speculation** so you always know which is
  which.
- **Labels confidence** on every finding and says what would change the answer.
- **Treats "I could not verify this" as a finding, not a failure.**
- **Scales to the job.** It asks for a depth tier (Quick scan, Standard brief, Deep report) and an
  output format (executive brief, decision memo, comparison matrix, annotated bibliography,
  slide-ready bullets, or full report) at intake.
- **Fans out when it can.** When the host supports subagents or parallel tasks, it splits
  sub-questions across parallel researchers and matches model and effort to each (cheap and fast
  for lookups, higher effort for synthesis and an adversarial fact-check), degrading gracefully to
  sequential work otherwise.

## How to use it

**Paste (any LLM):** copy [`system.md`](./system.md) into your model's system prompt and ask
your question. It uses whatever web-search or browsing capability the host model has; without
one, it reasons from the material you give it and marks what needs a live lookup.

**Claude Code plugin (with the `research_lint` tool):**
```
/plugin marketplace add BodegaoneAI/bodegaone-agents
/plugin install bodegaone-agents@bodegaone
```

## Token cost

≈2,900 tokens per run for the system prompt (re-sent as input on every model call), plus ≈640
tokens injected once per session when the Claude Code plugin's skill auto-surfaces. Estimated with
the [Anthropic tokenizer](https://github.com/anthropics/anthropic-tokenizer-typescript); actual
counts vary slightly by model, and prompt caching (on by default in most Claude clients) makes
repeat turns far cheaper than the raw number implies.

## Example prompts

```
Research whether local-LLM adoption grew in 2026. Cite sources, rate confidence, flag what you
can't verify.
```
```
Fact-check this claim and show your sources: [paste claim].
```
```
Compare these three tools on pricing and limits, with a dated source for every number.
```
```
Check this research brief for rigor and fix the weak spots: [paste brief].
```

## Tool

`research_lint` checks a brief for unsourced claims and statistics, vague attribution, source
diversity, dated sources, confidence levels, and acknowledged uncertainty. It pairs with
`seo_analyze_serp` (with a Brave key) for discovering and comparing sources.

Research feeds the [strategy planner](../strategy-planner/) and the
[content writer](../content-writer/). Built by [Bodega One](https://bodegaone.ai).
