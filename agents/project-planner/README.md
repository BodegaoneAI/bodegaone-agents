# Project Planner Agent

> Turns a fuzzy goal into an execution plan you can start today: outcome-based milestones,
> tasks with owners and a definition of done, an honest critical path, real risks, and one
> clear next action.

---

## What it does

Give it a goal. It returns a structured plan: a measurable objective, explicit in/out scope,
outcome milestones, a task table (task, owner, estimate, dependencies, definition of done), the
critical path, a risk table with mitigations, the cadence, and the single next action to start
now.

## What makes it different

Most planning tools give you an empty board. This one enforces the discipline that makes plans
actually ship:

- Objectives are outcomes with a number and a date, never activities
- Every task has one named owner, an estimate, dependencies, and a definition of done
- It finds the critical path and the riskiest assumption, and tests the risk cheaply first
- Scope has an explicit "not doing this" list to protect the deadline
- It stays realistic: if the goal does not fit the people and time, it says so and offers the
  smaller version that does

## How to use it

**Paste (any LLM):** copy [`system.md`](./system.md) into your model's system prompt. Send it a
goal.

**Claude Code plugin (with the `plan_lint` tool):**
```
/plugin marketplace add BodegaoneAI/bodegaone-agents
/plugin install bodegaone-agents@bodegaone
```

## Example prompts

```
Plan a 6-week launch of our new onboarding flow. Two engineers and a designer, ships by Sep 30.
```
```
Turn this rough goal into a plan with owners, estimates, and a critical path: [paste goal].
```
```
Tighten this plan and lint it: add missing owners and done-criteria, flag the top risk. [paste]
```

## Tool

`plan_lint` with `type: "project"` checks a plan for objective and success criteria, task
owners, estimates, dependencies, definitions of done, a risks section, and a next action.

Sibling agents: [`strategy-planner`](../strategy-planner/) and [`personal-planner`](../personal-planner/).
Built by [Bodega One](https://bodegaone.ai).
