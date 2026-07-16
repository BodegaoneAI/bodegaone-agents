/**
 * tests/unit/research-lint.test.ts
 * Unit tests for the pure research-linting logic.
 */
import { describe, it, expect } from "vitest";
import { lintResearch } from "../../mcp/lib/research-lint.js";

function overall(md: string) {
  const r = lintResearch({ markdown: md });
  const grades = r.categories.map((c) => {
    const fails = c.items.filter((i) => i.status === "fail").length;
    const warns = c.items.filter((i) => i.status === "warn").length;
    return fails >= 2 ? "FAIL" : fails === 1 ? "WARN" : warns >= 2 ? "WARN" : "PASS";
  });
  if (grades.includes("FAIL")) return "FAIL";
  if (grades.includes("WARN")) return "WARN";
  return "PASS";
}

const goodBrief = `# Question
Is the local-LLM market growing in 2026?

## Bottom line
Yes, adoption is growing, with medium confidence. Two independent trackers show rising usage.

## Key findings
1. Ollama pulls grew 50% year over year - Source: Ollama blog, Jan 2026 (https://ollama.com/blog) - Confidence: medium, single vendor metric.
2. Hugging Face reported 30,000 new GGUF models in 2025 - Source: Hugging Face, Dec 2025 (https://huggingface.co/blog) - Confidence: high, primary data.

## Contradictions and open questions
Vendor metrics likely overstate unique users. No neutral third-party count exists.

## Sources
- Ollama blog, promotional, Jan 2026, https://ollama.com/blog
- Hugging Face blog, primary, Dec 2025, https://huggingface.co/blog
- Stack Overflow survey, secondary, 2025, https://survey.stackoverflow.co

## Could not verify
Total unique local-LLM users worldwide. No reliable source found.
`;

describe("lintResearch", () => {
  it("passes a well-sourced, hedged brief", () => {
    expect(overall(goodBrief)).toBe("PASS");
  });

  it("fails a brief full of vague attribution and unsourced stats", () => {
    const bad =
      "# Is AI taking jobs?\n\nStudies show that 40% of jobs will be automated. " +
      "Experts agree this is inevitable and everyone knows it.";
    const r = lintResearch({ markdown: bad });
    expect(overall(bad)).toBe("FAIL");
    expect(r.flags.some((f) => f.toLowerCase().includes("studies show"))).toBe(true);
    expect(r.stats.vague).toBeGreaterThanOrEqual(3);
  });

  it("flags an unsourced statistic", () => {
    const r = lintResearch({ markdown: "# Note\n\nRevenue grew 25% last year." });
    const sourcing = r.categories.find((c) => c.name === "Sourcing")!;
    const cited = sourcing.items.find((i) => i.label.includes("cited"))!;
    expect(cited.status).toBe("fail");
  });

  it("flags missing confidence and uncertainty", () => {
    const r = lintResearch({ markdown: "# X\n\nThe answer is yes. See https://example.com/a." });
    const honesty = r.categories.find((c) => c.name === "Honesty")!;
    expect(honesty.items.every((i) => i.status !== "pass")).toBe(true);
  });

  it("counts distinct sources by host", () => {
    const r = lintResearch({
      markdown: "# X\n\nSee https://a.com/1 and https://b.com/2 and https://a.com/3 in 2025.",
    });
    expect(r.stats.distinctSources).toBe(2);
  });
});
