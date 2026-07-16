/**
 * tests/unit/plan-lint.test.ts
 * Unit tests for the pure plan-linting logic across all three planner types.
 */
import { describe, it, expect } from "vitest";
import { lintPlan, type PlanType } from "../../mcp/lib/plan-lint.js";

function overall(md: string, type: PlanType) {
  const r = lintPlan({ markdown: md, type });
  const grades = r.categories.map((c) => {
    const fails = c.items.filter((i) => i.status === "fail").length;
    const warns = c.items.filter((i) => i.status === "warn").length;
    return fails >= 2 ? "FAIL" : fails === 1 ? "WARN" : warns >= 2 ? "WARN" : "PASS";
  });
  if (grades.includes("FAIL")) return "FAIL";
  if (grades.includes("WARN")) return "WARN";
  return "PASS";
}

const goodProject = `# Project: Onboarding revamp

## Objective
New users reach first value in under 5 minutes, measured by activation rate hitting 40% by 2026-09-30.

## Scope
In: signup and guided setup. Out: billing changes.

## Milestones
1. Signup flow live - target Aug 15
2. Guided setup live - target Sep 1

## Tasks
| Task | Owner | Estimate | Depends on | Definition of done |
|---|---|---|---|---|
| Build signup API | Sam | 3 days | none | endpoint returns 200 and creates a user |
| Wire setup UI | Priya | 2 days | signup API | user reaches the dashboard |

## Risks and assumptions
Riskiest assumption: users will complete setup. Test with 5 users next week.

## First next action
Sam starts the signup API today.
`;

const goodStrategy = `# Strategy: reach $50k MRR by Q2 2026

## Target segment
Solo Shopify sellers doing their own SEO. Their job to be done: rank product pages without hiring an agency.

## Positioning
Alternatives: agencies and generic SEO plugins. Unique attributes: AI audits grounded in official docs.
Value: rank without a $2k/mo agency. We win because we are specific and free.

## Go-to-market
Motion: content-led. Wedge channel: an SEO blog plus the Shopify community. First move: 10 comparison posts.

## Pricing
Free core, $29/mo pro. Primary conversion: audit-report signup.

## Metrics
North-star: weekly active audits. OKR: 1,000 audits per week by Q2 2026.

## Assumptions
Assumption: sellers will self-serve. Risk: they may want done-for-you. Experiment: 10 customer calls next week.
`;

const goodPersonal = `# Today

## Focus
- MIT: Finish the investor update draft
- Review the Q3 numbers
- Reply to Sam

## Schedule
- 9:00am - MIT: investor update (deep work)
- 11:00am - buffer
- 11:30am - batch emails and Slack
- 2:00pm - review Q3 numbers

## The rest
Defer: gym research to Saturday
Delegate: the expense report to my assistant
Delete: reorganize bookmarks

## Done for today
Investor update sent and Q3 numbers reviewed.
`;

describe("lintPlan — project", () => {
  it("passes a complete project plan", () => {
    expect(overall(goodProject, "project")).toBe("PASS");
  });
  it("fails a vague project plan and flags missing owners", () => {
    const r = lintPlan({ markdown: "# Do the thing\n\nWe should improve onboarding and make it better.", type: "project" });
    expect(r.flags.some((f) => f.toLowerCase().includes("owner"))).toBe(true);
    expect(overall("# Do the thing\n\nWe should improve onboarding.", "project")).not.toBe("PASS");
  });
});

describe("lintPlan — strategy", () => {
  it("passes a complete strategy plan", () => {
    expect(overall(goodStrategy, "strategy")).toBe("PASS");
  });
  it("flags a missing target segment", () => {
    const r = lintPlan({ markdown: "# Grow the business\n\nWe want more revenue and awareness.", type: "strategy" });
    expect(r.flags.some((f) => f.toLowerCase().includes("segment"))).toBe(true);
  });
});

describe("lintPlan — personal", () => {
  it("passes a focused, time-blocked personal plan", () => {
    expect(overall(goodPersonal, "personal")).toBe("PASS");
  });
  it("flags an overloaded list with no priority", () => {
    const overloaded =
      "# Today\n\n" +
      Array.from({ length: 14 }, (_, i) => `- task number ${i + 1}`).join("\n");
    const r = lintPlan({ markdown: overloaded, type: "personal" });
    expect(r.flags.some((f) => f.toLowerCase().includes("too many"))).toBe(true);
    expect(r.flags.some((f) => f.toLowerCase().includes("mit") || f.toLowerCase().includes("most important"))).toBe(true);
  });
});
